import { defineConfig } from "drizzle-kit";
export default defineConfig({
    schema: "./schema.ts",
    out: "./supabase/migrations",
    dialect: "postgresql",
});
