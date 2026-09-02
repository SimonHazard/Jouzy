import { and, asc, eq, isNotNull, or } from "drizzle-orm";
import type { D1Transaction, JouzyDatabase } from "../../client.js";
import {
	articleMedia,
	articles,
	authors,
	games,
	mediaAssets,
} from "../../schema/index.js";
import { conflict, notFound } from "./errors.js";

export type MediaDatabase = JouzyDatabase | D1Transaction;
export type MediaAssetDto = typeof mediaAssets.$inferSelect;

export async function listMediaAssets(
	db: MediaDatabase,
): Promise<MediaAssetDto[]> {
	return db.select().from(mediaAssets).orderBy(asc(mediaAssets.createdAt));
}

export async function getMediaAsset(
	db: MediaDatabase,
	mediaAssetId: string,
): Promise<MediaAssetDto | null> {
	const rows = await db
		.select()
		.from(mediaAssets)
		.where(eq(mediaAssets.id, mediaAssetId))
		.limit(1);
	return rows[0] ?? null;
}

export async function createMediaAsset(
	db: MediaDatabase,
	input: Omit<MediaAssetDto, "id" | "createdAt"> & {
		id?: string;
		createdAt?: number;
	},
): Promise<MediaAssetDto> {
	const id = input.id ?? crypto.randomUUID();
	await db
		.insert(mediaAssets)
		.values({ ...input, id, createdAt: input.createdAt ?? Date.now() });
	const media = await getMediaAsset(db, id);
	if (!media) throw notFound();
	return media;
}

export async function assertMediaAssetOrphaned(
	db: MediaDatabase,
	mediaAssetId: string,
): Promise<void> {
	const references = await db
		.select({ id: mediaAssets.id })
		.from(mediaAssets)
		.leftJoin(articleMedia, eq(articleMedia.mediaAssetId, mediaAssets.id))
		.leftJoin(
			articles,
			or(
				eq(articles.heroMediaId, mediaAssets.id),
				eq(articles.id, articleMedia.articleId),
			),
		)
		.leftJoin(authors, eq(authors.avatarMediaId, mediaAssets.id))
		.leftJoin(games, eq(games.coverMediaId, mediaAssets.id))
		.where(
			and(
				eq(mediaAssets.id, mediaAssetId),
				or(
					isNotNull(articleMedia.mediaAssetId),
					isNotNull(articles.heroMediaId),
					isNotNull(authors.avatarMediaId),
					isNotNull(games.coverMediaId),
				),
			),
		)
		.limit(1);
	if (references[0]) throw conflict("mediaAssetId");
}

export async function deleteMediaAsset(
	db: MediaDatabase,
	mediaAssetId: string,
): Promise<void> {
	const media = await getMediaAsset(db, mediaAssetId);
	if (!media) throw notFound();
	await assertMediaAssetOrphaned(db, mediaAssetId);
	await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaAssetId));
}
