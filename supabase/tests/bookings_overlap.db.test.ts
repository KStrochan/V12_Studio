import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createDb } from "./helpers";

let db: PGlite;
let serviceId: string;
let clientId: string;

beforeAll(async () => {
  db = await createDb();
  serviceId = (
    await db.query<{ id: string }>(
      "insert into services(title, price_from, duration_min) values ('t', 100, 60) returning id",
    )
  ).rows[0].id;
  clientId = (
    await db.query<{ id: string }>(
      "insert into clients(name, phone) values ('A', '+380501112233') returning id",
    )
  ).rows[0].id;
});

const ins = (post: number, s: string, e: string, status = "pending") =>
  db.query(
    `insert into bookings(service_id, client_id, start_at, end_at, post_no, status)
     values ($1, $2, $3, $4, $5, $6)`,
    [serviceId, clientId, s, e, post, status],
  );

describe("bookings overlap guard", () => {
  it("rejects overlapping booking on same post with 23P01", async () => {
    await ins(1, "2030-01-01T10:00:00Z", "2030-01-01T11:00:00Z");
    await expect(ins(1, "2030-01-01T10:30:00Z", "2030-01-01T11:30:00Z")).rejects.toMatchObject({
      code: "23P01",
    });
  });
  it("allows same time on another post", async () => {
    await ins(2, "2030-01-01T10:30:00Z", "2030-01-01T11:30:00Z");
  });
  it("allows back-to-back bookings", async () => {
    await ins(1, "2030-01-01T11:00:00Z", "2030-01-01T12:00:00Z");
  });
  it("rejected booking does not block the slot", async () => {
    await ins(1, "2030-01-02T10:00:00Z", "2030-01-02T11:00:00Z", "rejected");
    await ins(1, "2030-01-02T10:00:00Z", "2030-01-02T11:00:00Z", "pending");
  });
  it("confirmed bookings block too", async () => {
    await ins(1, "2030-01-03T10:00:00Z", "2030-01-03T11:00:00Z", "confirmed");
    await expect(ins(1, "2030-01-03T10:15:00Z", "2030-01-03T10:45:00Z")).rejects.toMatchObject({
      code: "23P01",
    });
  });
  it("enforces clients.phone format and uniqueness", async () => {
    await expect(
      db.query("insert into clients(name, phone) values ('B', '0501112233')"),
    ).rejects.toThrow();
    await expect(
      db.query("insert into clients(name, phone) values ('B', '+380501112233')"),
    ).rejects.toMatchObject({ code: "23505" });
  });
});
