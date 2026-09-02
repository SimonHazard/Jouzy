import type { TaxonomyInput } from "@jouzy/domain";
import { asc, count, eq } from "drizzle-orm";
import type { D1Transaction, JouzyDatabase } from "../../client.js";
import {
	articleTags,
	gameGenres,
	gamePlatforms,
	genres,
	platforms,
	tags,
} from "../../schema/index.js";
import { conflict, notFound, throwDatabaseConflict } from "./errors.js";

export type TaxonomyDto = {
	id: string;
	name: string;
	slug: string;
	position: number | null;
};

type TaxonomyDatabase = JouzyDatabase | D1Transaction;
type TaxonomyTable = typeof platforms | typeof genres | typeof tags;
type TaxonomyRow = {
	id: string;
	name: string;
	slug: string;
	position: number | null;
};

const toDto = (row: TaxonomyRow): TaxonomyDto => ({
	id: row.id,
	name: row.name,
	slug: row.slug,
	position: row.position,
});

async function listTable(
	db: TaxonomyDatabase,
	table: TaxonomyTable,
): Promise<TaxonomyDto[]> {
	const rows = await db
		.select()
		.from(table)
		.orderBy(asc(table.position), asc(table.name));
	return rows.map(toDto);
}

async function createInTable(
	db: TaxonomyDatabase,
	table: TaxonomyTable,
	input: TaxonomyInput,
): Promise<TaxonomyDto> {
	const id = crypto.randomUUID();
	try {
		await db.insert(table).values({
			id,
			name: input.name,
			slug: input.slug,
			position: input.position ?? null,
		});
	} catch (error) {
		throwDatabaseConflict(error, "slug");
	}
	const rows = await db.select().from(table).where(eq(table.id, id)).limit(1);
	const row = rows[0];
	if (!row) throw notFound();
	return toDto(row);
}

async function updateInTable(
	db: TaxonomyDatabase,
	table: TaxonomyTable,
	id: string,
	input: TaxonomyInput,
): Promise<TaxonomyDto> {
	try {
		const result = await db
			.update(table)
			.set({
				name: input.name,
				slug: input.slug,
				position: input.position ?? null,
			})
			.where(eq(table.id, id))
			.returning();
		const row = result[0];
		if (!row) throw notFound();
		return toDto(row);
	} catch (error) {
		throwDatabaseConflict(error, "slug");
	}
}

export const listPlatforms = (db: TaxonomyDatabase) => listTable(db, platforms);
export const listGenres = (db: TaxonomyDatabase) => listTable(db, genres);
export const listTags = (db: TaxonomyDatabase) => listTable(db, tags);

export const createPlatform = (db: TaxonomyDatabase, input: TaxonomyInput) =>
	createInTable(db, platforms, input);
export const createGenre = (db: TaxonomyDatabase, input: TaxonomyInput) =>
	createInTable(db, genres, input);
export const createTag = (db: TaxonomyDatabase, input: TaxonomyInput) =>
	createInTable(db, tags, input);

export const updatePlatform = (
	db: TaxonomyDatabase,
	id: string,
	input: TaxonomyInput,
) => updateInTable(db, platforms, id, input);
export const updateGenre = (
	db: TaxonomyDatabase,
	id: string,
	input: TaxonomyInput,
) => updateInTable(db, genres, id, input);
export const updateTag = (
	db: TaxonomyDatabase,
	id: string,
	input: TaxonomyInput,
) => updateInTable(db, tags, id, input);

export async function deletePlatform(
	db: TaxonomyDatabase,
	id: string,
): Promise<void> {
	const references = await db
		.select({ count: count() })
		.from(gamePlatforms)
		.where(eq(gamePlatforms.platformId, id));
	if ((references[0]?.count ?? 0) > 0) throw conflict();
	const deleted = await db
		.delete(platforms)
		.where(eq(platforms.id, id))
		.returning({ id: platforms.id });
	if (!deleted[0]) throw notFound();
}

export async function deleteGenre(
	db: TaxonomyDatabase,
	id: string,
): Promise<void> {
	const references = await db
		.select({ count: count() })
		.from(gameGenres)
		.where(eq(gameGenres.genreId, id));
	if ((references[0]?.count ?? 0) > 0) throw conflict();
	const deleted = await db
		.delete(genres)
		.where(eq(genres.id, id))
		.returning({ id: genres.id });
	if (!deleted[0]) throw notFound();
}

export async function deleteTag(
	db: TaxonomyDatabase,
	id: string,
): Promise<void> {
	const references = await db
		.select({ count: count() })
		.from(articleTags)
		.where(eq(articleTags.tagId, id));
	if ((references[0]?.count ?? 0) > 0) throw conflict();
	const deleted = await db
		.delete(tags)
		.where(eq(tags.id, id))
		.returning({ id: tags.id });
	if (!deleted[0]) throw notFound();
}
