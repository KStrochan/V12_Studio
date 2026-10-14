import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

const BOOTSTRAP = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

export async function createDb(opts: { seed?: boolean } = {}): Promise<PGlite> {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec(BOOTSTRAP);
  await db.exec(readFileSync(path.join(root, "migrations/0001_schema.sql"), "utf8"));
  await db.exec(readFileSync(path.join(root, "migrations/0002_rls.sql"), "utf8"));
  await db.exec(readFileSync(path.join(root, "migrations/0003_create_booking_tx.sql"), "utf8"));
  await db.exec(readFileSync(path.join(root, "migrations/0004_booking_tx_keep_client.sql"), "utf8"));
  await db.exec(readFileSync(path.join(root, "migrations/0005_admin_booking_tx.sql"), "utf8"));
  await db.exec(readFileSync(path.join(root, "migrations/0006_hardening.sql"), "utf8"));
  await db.exec(readFileSync(path.join(root, "migrations/0007_car_year.sql"), "utf8"));
  if (opts.seed) await db.exec(readFileSync(path.join(root, "seed.sql"), "utf8"));
  return db;
}

export type Who = "postgres" | "anon" | "owner" | "authenticated" | "service_role";

/** Run fn as a Supabase-like role; owner = authenticated with app_metadata.role='owner'. */
export async function as<T>(db: PGlite, who: Who, fn: () => Promise<T>): Promise<T> {
  const role = who === "owner" ? "authenticated" : who;
  const claims =
    who === "owner"
      ? { role: "authenticated", app_metadata: { role: "owner" } }
      : who === "authenticated"
        ? { role: "authenticated", app_metadata: {} }
        : {};
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
