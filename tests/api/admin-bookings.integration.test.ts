import { describe, it, expect, beforeEach } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createDb, as } from "../../supabase/tests/helpers";
import {
  handleBookingPatch,
  handleManualBookingPost,
  type AdminBookingDeps,
} from "../../src/lib/admin-bookings";
import type { WorkingHours } from "../../src/lib/slots";
import type { BookingStatus } from "../../src/lib/booking-transitions";

let db: PGlite;
let serviceId: string; // 60 min

const toDate = (v: unknown) => (v instanceof Date ? v : new Date(v as string));

/** Every query runs as the signed-in owner, so RLS and the invoker RPC are exercised. */
function pgDeps(db: PGlite): AdminBookingDeps {
  const q = <T extends object>(sql: string, params: unknown[] = []) =>
    as(db, "owner", () => db.query<T>(sql, params));
  return {
    now: () => new Date("2026-10-01T00:00:00Z"),
    async getBooking(id) {
      const r = await q<{ id: string; status: BookingStatus; start_at: Date; end_at: Date; post_no: number }>(
        "select id, status, start_at, end_at, post_no from bookings where id = $1",
        [id],
      );
      const b = r.rows[0];
      return b ? { id: b.id, status: b.status, start: toDate(b.start_at), end: toDate(b.end_at), postNo: b.post_no } : null;
    },
    async getService(id) {
      const r = await q<{ id: string; duration_min: number }>(
        "select id, duration_min from services where id = $1 and active",
        [id],
      );
      return r.rows[0] ? { id: r.rows[0].id, durationMin: r.rows[0].duration_min } : null;
    },
    async getSettings() {
      const r = await q<{ working_hours: WorkingHours; posts: number; step_min: number; min_lead_min: number }>(
        "select * from settings",
      );
      const s = r.rows[0];
      return { hours: s.working_hours, posts: s.posts, stepMin: s.step_min, minLeadMin: s.min_lead_min };
    },
    async getDaysOff() {
      const r = await q<{ day: Date | string }>("select day from days_off");
      return r.rows.map((x) => (x.day instanceof Date ? x.day.toISOString().slice(0, 10) : x.day));
    },
    async getBusy(from, to) {
      const r = await q<{ id: string; start_at: Date; end_at: Date; post_no: number }>(
        `select id, start_at, end_at, post_no from bookings
         where status in ('pending','confirmed') and start_at < $2 and end_at > $1`,
        [from.toISOString(), to.toISOString()],
      );
      return r.rows.map((x) => ({ id: x.id, start: toDate(x.start_at), end: toDate(x.end_at), postNo: x.post_no }));
    },
    async setStatus(id, from, to) {
      const r = await q("update bookings set status = $3 where id = $1 and status = $2 returning id", [id, from, to]);
      return r.rows.length > 0;
    },
    async reschedule(id, start, end, postNo) {
      const r = await q(
        `update bookings set start_at = $2, end_at = $3, post_no = $4
         where id = $1 and status in ('pending','confirmed') returning id`,
        [id, start, end, postNo],
      );
      return r.rows.length > 0;
    },
    async createManual(a) {
      const r = await q<{ id: string }>("select admin_create_booking_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as id", [
        a.serviceId, a.start, a.end, a.postNo, a.name, a.phone, a.carMake, a.carModel, a.comment, a.carYear,
      ]);
      return r.rows[0].id;
    },
  };
}

const T10 = "2026-10-14T07:00:00.000Z"; // 10:00 Kyiv (UTC+3), Wednesday
const T12 = "2026-10-14T09:00:00.000Z";
const manual = (over: Record<string, unknown> = {}) => ({
  serviceId,
  start: T10,
  name: "Іван",
  phone: "050 111 22 33",
  carMake: "Audi",
  carModel: "A4",
  ...over,
});

async function seedBooking(start: string, post: number, status: BookingStatus = "pending") {
  const end = new Date(Date.parse(start) + 3_600_000).toISOString();
  const r = await db.query<{ id: string }>(
    `insert into bookings (service_id, start_at, end_at, post_no, status) values ($1,$2,$3,$4,$5) returning id`,
    [serviceId, start, end, post, status],
  );
  return r.rows[0].id;
}

beforeEach(async () => {
  db = await createDb({ seed: true });
  await db.exec("update settings set posts = 1");
  serviceId = (await db.query<{ id: string }>("select id from services where duration_min = 60 limit 1")).rows[0].id;
});

describe("PATCH status", () => {
  it("pending -> confirmed works, then confirmed -> done", async () => {
    const id = await seedBooking(T10, 1);
    expect((await handleBookingPatch(id, { status: "confirmed" }, pgDeps(db))).status).toBe(200);
    expect((await handleBookingPatch(id, { status: "done" }, pgDeps(db))).status).toBe(200);
    const r = await db.query<{ status: string }>("select status from bookings where id=$1", [id]);
    expect(r.rows[0].status).toBe("done");
  });

  it("forbidden transitions return 422 and change nothing", async () => {
    const id = await seedBooking(T10, 1, "rejected");
    const r = await handleBookingPatch(id, { status: "confirmed" }, pgDeps(db));
    expect(r.status).toBe(422);
    expect((await db.query<{ status: string }>("select status from bookings")).rows[0].status).toBe("rejected");
  });

  it("unknown id 404, bad id 404, bad body 422", async () => {
    const deps = pgDeps(db);
    expect((await handleBookingPatch("11111111-1111-4111-8111-111111111111", { status: "done" }, deps)).status).toBe(404);
    expect((await handleBookingPatch("nope", { status: "done" }, deps)).status).toBe(404);
    const id = await seedBooking(T10, 1);
    expect((await handleBookingPatch(id, { status: "bogus" }, deps)).status).toBe(422);
    expect((await handleBookingPatch(id, { status: "done", start: T12 }, deps)).status).toBe(422);
    expect((await handleBookingPatch(id, {}, deps)).status).toBe(422);
  });

  it("a status that changed since it was read yields 409 (compare-and-set)", async () => {
    const id = await seedBooking(T10, 1);
    const deps = pgDeps(db);
    const real = deps.getBooking;
    deps.getBooking = async (i) => {
      const b = await real(i);
      await db.query("update bookings set status='cancelled' where id=$1", [i]);
      return b;
    };
    expect((await handleBookingPatch(id, { status: "confirmed" }, deps)).status).toBe(409);
  });
});

describe("PATCH reschedule", () => {
  it("moves to a free slot and keeps the duration", async () => {
    const id = await seedBooking(T10, 1);
    const r = await handleBookingPatch(id, { start: T12 }, pgDeps(db));
    expect(r.status).toBe(200);
    const row = (await db.query<{ start_at: Date; end_at: Date }>("select start_at,end_at from bookings")).rows[0];
    expect(row.start_at.toISOString()).toBe(T12);
    expect(row.end_at.toISOString()).toBe("2026-10-14T10:00:00.000Z");
  });

  it("moving within its own old interval does not conflict with itself", async () => {
    const id = await seedBooking(T10, 1);
    const r = await handleBookingPatch(id, { start: "2026-10-14T07:30:00.000Z" }, pgDeps(db));
    expect(r.status).toBe(200);
  });

  it("onto an occupied slot -> 409", async () => {
    const id = await seedBooking(T10, 1);
    await seedBooking(T12, 1);
    const r = await handleBookingPatch(id, { start: T12 }, pgDeps(db));
    expect(r.status).toBe(409);
    expect((await db.query<{ start_at: Date }>("select start_at from bookings where id=$1", [id])).rows[0].start_at.toISOString()).toBe(T10);
  });

  it("an explicit occupied post -> 409; a second post is used when posts = 2", async () => {
    await db.exec("update settings set posts = 2");
    const id = await seedBooking(T10, 1);
    await seedBooking(T12, 1);
    expect((await handleBookingPatch(id, { start: T12, postNo: 1 }, pgDeps(db))).status).toBe(409);
    const ok = await handleBookingPatch(id, { start: T12 }, pgDeps(db));
    expect(ok.status).toBe(200);
    expect((ok.body as { postNo: number }).postNo).toBe(2);
  });

  it("race: DB constraint 23P01 on update is turned into 409", async () => {
    const id = await seedBooking(T10, 1);
    const deps = pgDeps(db);
    const realBusy = deps.getBusy;
    deps.getBusy = async (...a) => {
      const busy = await realBusy(...a);
      await seedBooking(T12, 1); // someone else grabs the slot after our check
      return busy;
    };
    expect((await handleBookingPatch(id, { start: T12 }, deps)).status).toBe(409);
  });

  it("outside working hours, on a day off, on Sunday, or in the past -> 422", async () => {
    const id = await seedBooking(T10, 1);
    const deps = pgDeps(db);
    expect((await handleBookingPatch(id, { start: "2026-10-14T16:00:00.000Z" }, deps)).status).toBe(422); // 19:00
    await db.exec("insert into days_off(day) values ('2026-10-15')");
    expect((await handleBookingPatch(id, { start: "2026-10-15T07:00:00.000Z" }, deps)).status).toBe(422);
    expect((await handleBookingPatch(id, { start: "2026-10-18T07:00:00.000Z" }, deps)).status).toBe(422); // Sunday
    expect((await handleBookingPatch(id, { start: "2026-09-30T07:00:00.000Z" }, deps)).status).toBe(422);
  });

  it("finished bookings cannot be moved", async () => {
    const id = await seedBooking(T10, 1, "done");
    expect((await handleBookingPatch(id, { start: T12 }, pgDeps(db))).status).toBe(422);
  });
});

describe("POST manual booking", () => {
  it("car year is optional: stored when given, null otherwise, validated when present", async () => {
    expect((await handleManualBookingPost(manual({ carYear: 2012 }), pgDeps(db))).status).toBe(201);
    expect((await db.query("select car_year from bookings")).rows).toEqual([{ car_year: 2012 }]);
    await db.exec("delete from bookings");
    expect((await handleManualBookingPost(manual(), pgDeps(db))).status).toBe(201);
    expect((await db.query("select car_year from bookings")).rows).toEqual([{ car_year: null }]);
    expect((await handleManualBookingPost(manual({ carYear: 1800, start: T12 }), pgDeps(db))).status).toBe(422);
  });

  it("creates a confirmed manual booking with a normalized phone and client", async () => {
    const r = await handleManualBookingPost(manual(), pgDeps(db));
    expect(r.status).toBe(201);
    const b = (await db.query<{ status: string; source: string; post_no: number }>("select status, source, post_no from bookings")).rows[0];
    expect(b).toEqual({ status: "confirmed", source: "manual", post_no: 1 });
    expect((await db.query("select phone, name, car from clients")).rows).toEqual([
      { phone: "+380501112233", name: "Іван", car: "Audi A4" },
    ]);
  });

  it("does not overwrite an existing client's name/car", async () => {
    await db.exec("insert into clients(name, phone, car) values ('Старий', '+380501112233', 'BMW X5')");
    await handleManualBookingPost(manual(), pgDeps(db));
    expect((await db.query("select name, car from clients")).rows).toEqual([{ name: "Старий", car: "BMW X5" }]);
    expect((await db.query("select 1 from bookings")).rows).toHaveLength(1);
  });

  it("occupied slot -> 409; second post is chosen when free", async () => {
    await seedBooking(T10, 1);
    expect((await handleManualBookingPost(manual(), pgDeps(db))).status).toBe(409);
    await db.exec("update settings set posts = 2");
    const r = await handleManualBookingPost(manual({ phone: "0671112233" }), pgDeps(db));
    expect(r.status).toBe(201);
    expect((await db.query<{ post_no: number }>("select post_no from bookings order by created_at desc limit 1")).rows[0].post_no).toBe(2);
  });

  it("race: 23P01 from the RPC -> 409 and no orphan booking", async () => {
    const deps = pgDeps(db);
    const real = deps.getBusy;
    deps.getBusy = async (...a) => {
      const busy = await real(...a);
      await seedBooking(T10, 1);
      return busy;
    };
    expect((await handleManualBookingPost(manual(), deps)).status).toBe(409);
    expect((await db.query("select 1 from bookings")).rows).toHaveLength(1);
  });

  it("validation: bad phone, unknown service, bad post, off-hours -> 422", async () => {
    const deps = pgDeps(db);
    expect((await handleManualBookingPost(manual({ phone: "123" }), deps)).status).toBe(422);
    expect((await handleManualBookingPost(manual({ serviceId: "11111111-1111-4111-8111-111111111111" }), deps)).status).toBe(422);
    expect((await handleManualBookingPost(manual({ postNo: 5 }), deps)).status).toBe(422);
    expect((await handleManualBookingPost(manual({ start: "2026-10-14T20:00:00.000Z" }), deps)).status).toBe(422);
    expect((await handleManualBookingPost(manual({ name: "" }), deps)).status).toBe(422);
  });

  it("the RPC refuses non-owners (anon/authenticated)", async () => {
    for (const who of ["anon", "authenticated"] as const) {
      await expect(
        as(db, who, () =>
          db.query("select admin_create_booking_tx($1,$2,$3,1,'X','+380501112233','','',null)", [
            serviceId, T10, "2026-10-14T08:00:00.000Z",
          ]),
        ),
      ).rejects.toThrow();
    }
    expect((await db.query("select 1 from bookings")).rows).toHaveLength(0);
  });
});
