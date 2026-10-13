import { describe, it, expect, beforeEach } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createDb, as } from "../../supabase/tests/helpers";
import {
  handleBookingPost,
  handleConsultationPost,
  handleSlotsGet,
  type BookingDeps,
} from "../../src/lib/booking-service";
import type { WorkingHours } from "../../src/lib/slots";

let db: PGlite;
let serviceId: string;

function pgDeps(db: PGlite): BookingDeps {
  const iso = (v: unknown) => (v instanceof Date ? v : new Date(v as string));
  return {
    now: () => new Date("2026-10-01T00:00:00Z"),
    async getService(id) {
      const r = await db.query<{ id: string; duration_min: number }>(
        "select id, duration_min from services where id = $1 and active",
        [id],
      );
      return r.rows[0] ? { id: r.rows[0].id, durationMin: r.rows[0].duration_min } : null;
    },
    async getSettings() {
      const r = await db.query<{ working_hours: WorkingHours; posts: number; step_min: number; min_lead_min: number }>("select * from settings");
      const s = r.rows[0];
      return { hours: s.working_hours, posts: s.posts, stepMin: s.step_min, minLeadMin: s.min_lead_min };
    },
    async getDaysOff() {
      const r = await db.query<{ day: Date | string }>("select day from days_off");
      return r.rows.map((x) => (x.day instanceof Date ? x.day.toISOString().slice(0, 10) : x.day));
    },
    async getBusy(from, to) {
      const r = await db.query<{ start_at: Date | string; end_at: Date | string; post_no: number }>(
        `select start_at, end_at, post_no from bookings
         where status in ('pending','confirmed') and start_at < $2 and end_at > $1`,
        [from.toISOString(), to.toISOString()],
      );
      return r.rows.map((x) => ({ start: iso(x.start_at), end: iso(x.end_at), postNo: x.post_no }));
    },
    async createBookingTx(a) {
      const r = await db.query<{ id: string }>(
        "select create_booking_tx($1,$2,$3,$4,$5,$6,$7,$8,$9) as id",
        [a.serviceId, a.start, a.end, a.postNo, a.name, a.phone, a.carMake, a.carModel, a.comment],
      );
      return r.rows[0].id;
    },
    async rateLimit(key, max, win) {
      const r = await db.query<{ ok: boolean }>("select hit_rate_limit($1,$2,$3) as ok", [key, max, win]);
      return r.rows[0].ok;
    },
    async insertConsultation(c) {
      const r = await db.query<{ id: string }>(
        "insert into consultations(name, phone, question) values ($1,$2,$3) returning id",
        [c.name, c.phone, c.question],
      );
      return r.rows[0].id;
    },
  };
}

const body = (over: Record<string, unknown> = {}) => ({
  serviceId,
  start: "2026-10-14T07:00:00.000Z", // 10:00 Kyiv, Wednesday
  name: "Іван",
  phone: "050 111 22 33",
  carMake: "Audi",
  carModel: "A4",
  ...over,
});

beforeEach(async () => {
  db = await createDb({ seed: true });
  await db.exec("update settings set posts = 1");
  serviceId = (await db.query<{ id: string }>("select id from services where duration_min = 60 limit 1")).rows[0].id;
});

describe("POST /api/bookings handler on a real schema", () => {
  it("two simultaneous POSTs on one slot, posts=1 -> one 201 and one 409", async () => {
    const deps = pgDeps(db);
    const realTx = deps.createBookingTx;
    let txCalls = 0;
    deps.createBookingTx = (a) => {
      txCalls++;
      return realTx(a);
    };
    const [a, b] = await Promise.all([
      handleBookingPost(body(), "1.1.1.1", deps),
      handleBookingPost(body({ name: "Петро", phone: "0671112233" }), "2.2.2.2", deps),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    // both reached the DB; the loser hit 23P01 and went through the retry path
    expect(txCalls).toBe(2);
    const loser = a.status === 409 ? a : b;
    const slots = (loser.body as { slots: { start: string }[] }).slots;
    expect(slots.some((s) => s.start === "2026-10-14T07:00:00.000Z")).toBe(false);
    const n = await db.query<{ n: number }>("select count(*)::int as n from bookings");
    expect(n.rows[0].n).toBe(1);
  });

  it("two phone formats of one person create one client", async () => {
    const deps = pgDeps(db);
    const a = await handleBookingPost(body({ phone: "+38 (050) 111-22-33" }), "1.1.1.1", deps);
    const b = await handleBookingPost(
      body({ phone: "0501112233", start: "2026-10-14T09:00:00.000Z" }),
      "1.1.1.1",
      deps,
    );
    expect([a.status, b.status]).toEqual([201, 201]);
    const c = await db.query<{ phone: string }>("select phone from clients");
    expect(c.rows).toEqual([{ phone: "+380501112233" }]);
    const bk = await db.query<{ status: string }>("select status from bookings");
    expect(bk.rows.map((r) => r.status)).toEqual(["pending", "pending"]);
  });

  it("existing client name/car are not overwritten by a later booking with the same phone", async () => {
    const deps = pgDeps(db);
    await handleBookingPost(body(), "1.1.1.1", deps);
    await handleBookingPost(
      body({ name: "Зловмисник", carMake: "BMW", carModel: "X5", start: "2026-10-14T09:00:00.000Z" }),
      "1.1.1.1",
      deps,
    );
    const c = await db.query<{ name: string; car: string }>("select name, car from clients");
    expect(c.rows).toEqual([{ name: "Іван", car: "Audi A4" }]);
    expect((await db.query("select 1 from bookings")).rows).toHaveLength(2);
  });

  it("empty client name/car are filled in", async () => {
    await db.exec("insert into clients(name, phone, car) values ('', '+380501112233', null)");
    await handleBookingPost(body(), "1.1.1.1", pgDeps(db));
    const c = await db.query<{ name: string; car: string }>("select name, car from clients");
    expect(c.rows).toEqual([{ name: "Іван", car: "Audi A4" }]);
  });

  it("slots endpoint: impossible date 422 and rate limit 429 on real rate_limits", async () => {
    const deps = pgDeps(db);
    expect((await handleSlotsGet({ serviceId, date: "2026-02-31" }, "4.4.4.4", deps)).status).toBe(422);
    let last = 0;
    for (let i = 0; i < 62; i++) last = (await handleSlotsGet({ serviceId, date: "2026-10-14" }, "5.5.5.5", deps)).status;
    expect(last).toBe(429);
  });

  it("422 on invalid input, 429 after 5 hits from one IP", async () => {
    const deps = pgDeps(db);
    const bad = await handleBookingPost(body({ phone: "123" }), "9.9.9.9", deps);
    expect(bad.status).toBe(422);
    expect((bad.body as { errors: Record<string, string> }).errors.phone).toBeTruthy();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await handleBookingPost(body({ phone: "1" }), "8.8.8.8", deps)).status);
    expect(statuses).toEqual([422, 422, 422, 422, 422, 429]);
  });

  it("honeypot returns 201 and writes nothing", async () => {
    const r = await handleBookingPost(body({ website: "spam" }), "1.1.1.1", pgDeps(db));
    expect(r.status).toBe(201);
    expect((await db.query("select 1 from bookings")).rows).toHaveLength(0);
    expect((await db.query("select 1 from clients")).rows).toHaveLength(0);
  });

  it("slots handler lists slots and hides the booked one", async () => {
    const deps = pgDeps(db);
    await handleBookingPost(body(), "1.1.1.1", deps);
    const r = await handleSlotsGet({ serviceId, date: "2026-10-14" }, "3.3.3.3", deps);
    expect(r.status).toBe(200);
    const slots = (r.body as { slots: { start: string }[] }).slots;
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some((s) => s.start === "2026-10-14T07:00:00.000Z")).toBe(false);
    expect((await handleSlotsGet({ serviceId: "x", date: "2026-10-14" }, "3.3.3.3", deps)).status).toBe(422);
  });

  it("consultation: 201 stored; honeypot 201 not stored", async () => {
    const deps = pgDeps(db);
    const ok = await handleConsultationPost({ name: "Іван", phone: "0501112233", question: "?" }, "1.1.1.1", deps);
    expect(ok.status).toBe(201);
    const spam = await handleConsultationPost({ name: "Бот", phone: "0501112233", website: "x" }, "1.1.1.1", deps);
    expect(spam.status).toBe(201);
    expect((await db.query("select 1 from consultations")).rows).toHaveLength(1);
  });
});

describe("function privileges", () => {
  it("anon cannot call hit_rate_limit or create_booking_tx", async () => {
    await expect(as(db, "anon", () => db.query("select hit_rate_limit('k', 5, 60)"))).rejects.toThrow();
    await expect(
      as(db, "anon", () =>
        db.query("select create_booking_tx($1, now(), now() + interval '1 hour', 1, 'a', '+380501112233', 'x', 'y', null)", [serviceId]),
      ),
    ).rejects.toThrow();
  });
  it("service_role can call hit_rate_limit", async () => {
    await db.exec("set role service_role");
    const r = await db.query<{ ok: boolean }>("select hit_rate_limit('k', 5, 60) as ok");
    await db.exec("reset role");
    expect(r.rows[0].ok).toBe(true);
  });
});
