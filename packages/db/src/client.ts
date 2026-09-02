import type { D1Database } from "@cloudflare/workers-types";
import type { BatchItem } from "drizzle-orm/batch";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";

import { schema } from "./schema.js";

export type JouzyDatabase = DrizzleD1Database<typeof schema> & {
	$client: D1Database;
};
export type D1Transaction = Parameters<
	Parameters<JouzyDatabase["transaction"]>[0]
>[0];
export type D1BatchStatement = BatchItem<"sqlite">;

export async function runD1Batch(
	database: JouzyDatabase,
	statements: D1BatchStatement[],
): Promise<void> {
	if (statements.length === 0) return;
	await database.batch(statements as [D1BatchStatement, ...D1BatchStatement[]]);
}

export function createDb(database: D1Database): JouzyDatabase {
	if (!database) {
		throw new TypeError("Le binding D1 est requis pour créer le client Jouzy.");
	}
	return drizzle(database, { schema });
}

export async function healthCheck(database: JouzyDatabase): Promise<boolean> {
	const result = await database.$client
		.prepare("SELECT 1 AS ok")
		.first<{ ok: number }>();
	return result?.ok === 1;
}
