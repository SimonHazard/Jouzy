import type { GameInput } from "@jouzy/domain";
import { asc, eq } from "drizzle-orm";
import {
	type D1BatchStatement,
	type JouzyDatabase,
	runD1Batch,
} from "../../client.js";
import {
	gameGenres,
	gamePlatforms,
	gameStoreLinks,
	games,
} from "../../schema/index.js";
import { notFound, throwDatabaseConflict } from "./errors.js";

export type GameDto = {
	id: string;
	title: string;
	slug: string;
	coverMediaId: string | null;
	developer: string | null;
	publisher: string | null;
	releaseDate: string | null;
	releaseDatePrecision: "day" | "month" | "year" | "unknown" | null;
	createdAt: number;
	updatedAt: number;
	platformIds: string[];
	genreIds: string[];
	storeLinks: Array<typeof gameStoreLinks.$inferSelect>;
};

type GameDatabase = JouzyDatabase;

async function readGame(
	db: GameDatabase,
	gameId: string,
): Promise<GameDto | null> {
	const rows = await db
		.select()
		.from(games)
		.where(eq(games.id, gameId))
		.limit(1);
	const game = rows[0];
	if (!game) return null;
	const [platformRows, genreRows, storeLinks] = await Promise.all([
		db
			.select({ id: gamePlatforms.platformId })
			.from(gamePlatforms)
			.where(eq(gamePlatforms.gameId, gameId)),
		db
			.select({ id: gameGenres.genreId })
			.from(gameGenres)
			.where(eq(gameGenres.gameId, gameId)),
		db
			.select()
			.from(gameStoreLinks)
			.where(eq(gameStoreLinks.gameId, gameId))
			.orderBy(asc(gameStoreLinks.position)),
	]);
	return {
		...game,
		platformIds: platformRows.map((row) => row.id),
		genreIds: genreRows.map((row) => row.id),
		storeLinks,
	};
}

export async function listGames(db: GameDatabase): Promise<GameDto[]> {
	const rows = await db
		.select({ id: games.id })
		.from(games)
		.orderBy(asc(games.title));
	return Promise.all(
		rows.map(async (row) => {
			const game = await readGame(db, row.id);
			if (!game) throw notFound();
			return game;
		}),
	);
}

export async function getGame(
	db: GameDatabase,
	gameId: string,
): Promise<GameDto | null> {
	return readGame(db, gameId);
}

function relationStatements(
	db: GameDatabase,
	gameId: string,
	input: GameInput,
): D1BatchStatement[] {
	const statements: D1BatchStatement[] = [];
	if (input.platformIds.length > 0) {
		statements.push(
			db
				.insert(gamePlatforms)
				.values(
					input.platformIds.map((platformId) => ({ gameId, platformId })),
				),
		);
	}
	if (input.genreIds.length > 0) {
		statements.push(
			db
				.insert(gameGenres)
				.values(input.genreIds.map((genreId) => ({ gameId, genreId }))),
		);
	}
	if (input.storeLinks.length > 0) {
		statements.push(
			db.insert(gameStoreLinks).values(
				input.storeLinks.map((link, index) => ({
					id: crypto.randomUUID(),
					gameId,
					platform: link.platform,
					provider: link.provider,
					label: link.label,
					url: link.url,
					position: link.position ?? index,
				})),
			),
		);
	}
	return statements;
}

function gameValues(input: GameInput, gameId: string, now: number) {
	return {
		id: gameId,
		title: input.title,
		slug: input.slug,
		developer: input.developer ?? null,
		publisher: input.publisher ?? null,
		releaseDate: input.releaseDate ?? null,
		releaseDatePrecision: input.releaseDatePrecision ?? null,
		coverMediaId: input.coverMediaId ?? null,
		createdAt: now,
		updatedAt: now,
	} as const;
}

export async function createGame(
	db: GameDatabase,
	input: GameInput,
	now = Date.now(),
): Promise<GameDto> {
	const gameId = crypto.randomUUID();
	try {
		await runD1Batch(db, [
			db.insert(games).values(gameValues(input, gameId, now)),
			...relationStatements(db, gameId, input),
		]);
	} catch (error) {
		throwDatabaseConflict(error, "slug");
	}
	const game = await getGame(db, gameId);
	if (!game) throw notFound();
	return game;
}

export async function updateGame(
	db: GameDatabase,
	gameId: string,
	input: GameInput,
	now = Date.now(),
): Promise<GameDto> {
	try {
		const existing = await db
			.select({ id: games.id })
			.from(games)
			.where(eq(games.id, gameId))
			.limit(1);
		if (!existing[0]) throw notFound();
		await runD1Batch(db, [
			db
				.update(games)
				.set({
					title: input.title,
					slug: input.slug,
					developer: input.developer ?? null,
					publisher: input.publisher ?? null,
					releaseDate: input.releaseDate ?? null,
					releaseDatePrecision: input.releaseDatePrecision ?? null,
					coverMediaId: input.coverMediaId ?? null,
					updatedAt: now,
				})
				.where(eq(games.id, gameId)),
			db.delete(gamePlatforms).where(eq(gamePlatforms.gameId, gameId)),
			db.delete(gameGenres).where(eq(gameGenres.gameId, gameId)),
			db.delete(gameStoreLinks).where(eq(gameStoreLinks.gameId, gameId)),
			...relationStatements(db, gameId, input),
		]);
	} catch (error) {
		throwDatabaseConflict(error, "slug");
	}
	const game = await getGame(db, gameId);
	if (!game) throw notFound();
	return game;
}
