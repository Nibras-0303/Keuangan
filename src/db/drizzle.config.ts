import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

const config = (() => {
  if (databaseUrl) {
    console.log("Drizzle Kit using DATABASE_URL configuration (Supabase/PostgreSQL).");
    return {
      url: databaseUrl,
    };
  }

  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

  if (!sqlHost || !sqlDbName || !user || !password) {
    console.warn("Neither DATABASE_URL nor complete SQL_* credentials are set in environment variables. Fallback mode.");
    return {
      url: "",
    };
  }

  console.log(`Drizzle Kit using SQL_* configuration. Admin user: ${user}`);
  return {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false, // Cloud SQL Auth Proxy doesn't require SSL locally
  };
})();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: config,
  verbose: true,
});

