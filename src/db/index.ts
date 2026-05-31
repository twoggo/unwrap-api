import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema.js"

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/unwrap.db",
})

export const db = drizzle(client, { schema })
export type Db = typeof db
