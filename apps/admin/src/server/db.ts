import { env } from "cloudflare:workers";

import { createDb, type JouzyDatabase } from "@jouzy/db";

export function getDatabase(): JouzyDatabase {
	return createDb(env.DB);
}
