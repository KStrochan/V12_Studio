import { describe, it, expect } from "vitest";
import { createDb } from "./helpers";

describe("seed", () => {
  it("loads with expected rows", async () => {
    const db = await createDb({ seed: true });
    const n = async (t: string) =>
      Number((await db.query<{ n: string }>(`select count(*) n from ${t}`)).rows[0].n);
    expect(await n("settings")).toBe(1);
    expect(await n("services")).toBe(8);
    expect(await n("reviews")).toBe(3);
    const s = (await db.query<any>("select * from settings")).rows[0];
    expect(s.phone).toBe("");
    expect(s.address).toBe("");
    expect(Number((await db.query<{ n: string }>("select count(*) n from reviews where visible")).rows[0].n)).toBe(0);
    expect(s.posts).toBe(2);
    expect(s.step_min).toBe(30);
    expect(s.min_lead_min).toBe(60);
    expect(s.working_hours["0"]).toBeNull();
    expect(s.working_hours["6"]).toEqual({ open: "10:00", close: "15:00" });
    expect(s.working_hours["1"]).toEqual({ open: "09:00", close: "18:00" });
  });
});
