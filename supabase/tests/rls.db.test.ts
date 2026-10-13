import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createDb, as } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
  await db.exec(`
    insert into settings(phone) values ('+380000000000');
    insert into services(title, price_from, duration_min, active) values ('on', 1, 30, true), ('off', 1, 30, false);
    insert into reviews(author, body, rating, visible) values ('a','x',5,true), ('b','y',1,false);
    insert into days_off(day, reason) values ('2030-05-01', 'x');
    insert into clients(name, phone) values ('C', '+380509998877');
    insert into consultations(name, phone, question) values ('C', '+380509998877', 'q');
  `);
  await db.exec(`insert into bookings(service_id, client_id, start_at, end_at, post_no)
    select s.id, c.id, '2030-01-01T10:00Z', '2030-01-01T11:00Z', 1 from services s, clients c limit 1`);
});

const count = async (t: string) =>
  Number((await db.query<{ n: string }>(`select count(*) n from ${t}`)).rows[0].n);

describe("anon", () => {
  it("reads only active services", async () => {
    expect(await as(db, "anon", () => count("services"))).toBe(1);
  });
  it("reads only visible reviews", async () => {
    expect(await as(db, "anon", () => count("reviews"))).toBe(1);
  });
  it("reads settings and the days_off dates", async () => {
    expect(await as(db, "anon", () => count("settings"))).toBe(1);
    expect(await as(db, "anon", () => count("days_off_public"))).toBe(1);
  });
  it("cannot read days_off.reason or the base table", async () => {
    await expect(as(db, "anon", () => db.query("select reason from days_off"))).rejects.toThrow();
    await expect(as(db, "anon", () => count("days_off"))).rejects.toThrow();
    const r = await as(db, "anon", () => db.query<Record<string, unknown>>("select * from days_off_public"));
    expect(Object.keys(r.rows[0])).toEqual(["day"]);
  });
  it("owner still reads the reason", async () => {
    const r = await as(db, "owner", () => db.query<{ reason: string }>("select reason from days_off"));
    expect(r.rows[0].reason).toBe("x");
  });
  it("cannot read bookings/clients/consultations", async () => {
    for (const t of ["bookings", "clients", "consultations"]) {
      expect(await as(db, "anon", () => count(t))).toBe(0);
    }
  });
  it("cannot write bookings/clients/consultations", async () => {
    await expect(
      as(db, "anon", () => db.query("insert into clients(name, phone) values ('Z','+380501234567')")),
    ).rejects.toThrow();
    await expect(
      as(db, "anon", () =>
        db.query("insert into consultations(name, phone) values ('Z','+380501234567')"),
      ),
    ).rejects.toThrow();
    await expect(
      as(db, "anon", () =>
        db.query(
          "insert into bookings(service_id, start_at, end_at, post_no) select id, now(), now() + interval '1 hour', 1 from services limit 1",
        ),
      ),
    ).rejects.toThrow();
  });
  it("cannot write public content", async () => {
    await expect(
      as(db, "anon", () => db.query("insert into days_off(day) values ('2031-01-01')")),
    ).rejects.toThrow();
    await as(db, "anon", () => db.query("update services set title='h'"));
    expect((await db.query("select 1 from services where title='h'")).rows).toHaveLength(0);
  });
  it("cannot touch rate_limits directly", async () => {
    await expect(as(db, "anon", () => count("rate_limits"))).rejects.toThrow();
  });
});

describe("non-owner authenticated", () => {
  it("has no more access than anon to private tables", async () => {
    expect(await as(db, "authenticated", () => count("bookings"))).toBe(0);
    expect(await as(db, "authenticated", () => count("services"))).toBe(1);
  });
});

describe("owner", () => {
  it("reads everything", async () => {
    expect(await as(db, "owner", () => count("services"))).toBe(2);
    expect(await as(db, "owner", () => count("reviews"))).toBe(2);
    for (const t of ["bookings", "clients", "consultations"]) {
      expect(await as(db, "owner", () => count(t))).toBe(1);
    }
  });
  it("modifies everything", async () => {
    await as(db, "owner", () => db.query("update bookings set status='confirmed'"));
    expect((await db.query("select 1 from bookings where status='confirmed'")).rows).toHaveLength(1);
    await as(db, "owner", () => db.query("insert into days_off(day) values ('2031-02-02')"));
    await as(db, "owner", () => db.query("delete from days_off where day='2031-02-02'"));
  });
});

describe("hit_rate_limit", () => {
  it("allows up to max then blocks for service_role; anon is denied", async () => {
    const hit = () =>
      as(
        db,
        "service_role",
        async () => (await db.query<{ ok: boolean }>("select hit_rate_limit('ip:1', 2, 60) ok")).rows[0].ok,
      );
    expect(await hit()).toBe(true);
    expect(await hit()).toBe(true);
    expect(await hit()).toBe(false);
    await expect(as(db, "anon", () => db.query("select hit_rate_limit('ip:2', 2, 60)"))).rejects.toThrow();
  });
  it("purges rows older than a day", async () => {
    await db.exec("insert into rate_limits(key, window_start, hits) values ('old', now() - interval '2 days', 3)");
    await as(db, "service_role", () => db.query("select hit_rate_limit('ip:3', 2, 60)"));
    expect((await db.query("select 1 from rate_limits where key='old'")).rows).toHaveLength(0);
    expect((await db.query("select 1 from rate_limits where key='ip:3'")).rows).toHaveLength(1);
  });
});
