import type { ArticleDraftInput } from "@jouzy/domain";
import { asc, desc, eq, ne } from "drizzle-orm";
import {
	type D1BatchStatement,
	type JouzyDatabase,
	runD1Batch,
} from "../../client.js";
import {
	articleEmbeds,
	articleGames,
	articleLinks,
	articleMedia,
	articleSlugRedirects,
	articles,
	articleTags,
	authors,
	games,
	tags,
} from "../../schema/index.js";
import { conflict, notFound, throwDatabaseConflict } from "./errors.js";

export type ArticleDatabase = JouzyDatabase;
export interface ArticleProjection {
	mediaAssetIds: string[];
	embeds: Array<{
		directiveId: string;
		type: "video" | "music";
		provider:
			| "youtube"
			| "vimeo"
			| "spotify"
			| "apple_music"
			| "youtube_music"
			| "bandcamp"
			| "soundcloud";
		canonicalUrl: string;
		position: number;
	}>;
}
export type ArticleAdminDto = {
	article: typeof articles.$inferSelect;
	author: { id: string; displayName: string };
	games: Array<{ id: string; title: string; isPrimary: boolean }>;
	tags: Array<{ id: string; name: string }>;
	links: Array<typeof articleLinks.$inferSelect>;
	mediaAssetIds: string[];
	embeds: Array<typeof articleEmbeds.$inferSelect>;
};

async function hydrateArticle(
	db: ArticleDatabase,
	articleId: string,
): Promise<ArticleAdminDto | null> {
	const rows = await db
		.select({
			article: articles,
			author: { id: authors.id, displayName: authors.displayName },
		})
		.from(articles)
		.innerJoin(authors, eq(authors.id, articles.authorId))
		.where(eq(articles.id, articleId))
		.limit(1);
	const row = rows[0];
	if (!row) return null;
	const [gameRows, tagRows, links, media, embeds] = await Promise.all([
		db
			.select({
				id: games.id,
				title: games.title,
				isPrimary: articleGames.isPrimary,
			})
			.from(articleGames)
			.innerJoin(games, eq(games.id, articleGames.gameId))
			.where(eq(articleGames.articleId, articleId))
			.orderBy(desc(articleGames.isPrimary), asc(games.title)),
		db
			.select({ id: tags.id, name: tags.name })
			.from(articleTags)
			.innerJoin(tags, eq(tags.id, articleTags.tagId))
			.where(eq(articleTags.articleId, articleId))
			.orderBy(asc(tags.name)),
		db
			.select()
			.from(articleLinks)
			.where(eq(articleLinks.articleId, articleId))
			.orderBy(asc(articleLinks.position)),
		db
			.select({ mediaAssetId: articleMedia.mediaAssetId })
			.from(articleMedia)
			.where(eq(articleMedia.articleId, articleId)),
		db
			.select()
			.from(articleEmbeds)
			.where(eq(articleEmbeds.articleId, articleId))
			.orderBy(asc(articleEmbeds.position)),
	]);
	return {
		article: row.article,
		author: row.author,
		games: gameRows,
		tags: tagRows,
		links,
		mediaAssetIds: media.map((item) => item.mediaAssetId),
		embeds,
	};
}

export async function getArticle(
	db: ArticleDatabase,
	articleId: string,
): Promise<ArticleAdminDto | null> {
	return hydrateArticle(db, articleId);
}

export async function listArticles(
	db: ArticleDatabase,
	authorId?: string,
): Promise<ArticleAdminDto[]> {
	const rows = await db
		.select({ id: articles.id })
		.from(articles)
		.where(authorId ? eq(articles.authorId, authorId) : undefined)
		.orderBy(desc(articles.updatedAt), desc(articles.id));
	return Promise.all(
		rows.map(async ({ id }) => {
			const article = await hydrateArticle(db, id);
			if (!article) throw notFound();
			return article;
		}),
	);
}

function unique(values: readonly string[]): string[] {
	return [...new Set(values)];
}

function relationStatements(
	db: ArticleDatabase,
	articleId: string,
	input: ArticleDraftInput,
	projection: ArticleProjection,
): D1BatchStatement[] {
	const statements: D1BatchStatement[] = [
		db.delete(articleGames).where(eq(articleGames.articleId, articleId)),
		db.delete(articleTags).where(eq(articleTags.articleId, articleId)),
		db.delete(articleLinks).where(eq(articleLinks.articleId, articleId)),
		db.delete(articleMedia).where(eq(articleMedia.articleId, articleId)),
		db.delete(articleEmbeds).where(eq(articleEmbeds.articleId, articleId)),
	];
	const gameIds = unique(input.gameIds);
	if (gameIds.length)
		statements.push(
			db.insert(articleGames).values(
				gameIds.map((gameId) => ({
					articleId,
					gameId,
					isPrimary: gameId === input.primaryGameId,
				})),
			),
		);
	const tagIds = unique(input.tagIds);
	if (tagIds.length)
		statements.push(
			db
				.insert(articleTags)
				.values(tagIds.map((tagId) => ({ articleId, tagId }))),
		);
	if (input.links.length)
		statements.push(
			db.insert(articleLinks).values(
				input.links.map((link, position) => ({
					id: crypto.randomUUID(),
					articleId,
					provider: link.provider,
					label: link.label,
					url: link.url,
					isAffiliate: link.isAffiliate,
					position,
				})),
			),
		);
	if (projection.mediaAssetIds.length)
		statements.push(
			db.insert(articleMedia).values(
				unique(projection.mediaAssetIds).map((mediaAssetId) => ({
					articleId,
					mediaAssetId,
				})),
			),
		);
	if (projection.embeds.length)
		statements.push(
			db.insert(articleEmbeds).values(
				projection.embeds.map((embed) => ({
					id: crypto.randomUUID(),
					articleId,
					directiveId: embed.directiveId,
					type: embed.type,
					provider: embed.provider,
					canonicalUrl: embed.canonicalUrl,
					position: embed.position,
				})),
			),
		);
	return statements;
}

function values(
	input: ArticleDraftInput,
	articleId: string,
	status: "draft" | "published",
	publishedAt: number | null,
	now: number,
) {
	return {
		id: articleId,
		type: input.type,
		status,
		authorId: input.authorId ?? "",
		title: input.title,
		slug: input.slug,
		excerpt: input.excerpt,
		bodyMarkdown: input.bodyMarkdown,
		heroMediaId: input.heroMediaId,
		scoreHalfSteps: input.scoreHalfSteps,
		verdict: input.verdict,
		featured: input.featured && status === "published",
		finalReviewId: input.finalReviewId,
		hasMaterialBenefit: input.hasMaterialBenefit,
		disclosure: input.disclosure,
		publishedAt,
		createdAt: now,
		updatedAt: now,
	} as const;
}

export async function createArticle(
	db: ArticleDatabase,
	input: ArticleDraftInput,
	projection: ArticleProjection,
	status: "draft" | "published" = "draft",
	publishedAt: number | null = null,
	now = Date.now(),
): Promise<ArticleAdminDto> {
	const articleId = crypto.randomUUID();
	try {
		const statements: D1BatchStatement[] = [
			db
				.insert(articles)
				.values(values(input, articleId, status, publishedAt, now)),
		];
		if (input.featured && status === "published")
			statements.push(
				db
					.update(articles)
					.set({ featured: false })
					.where(ne(articles.id, articleId)),
			);
		statements.push(...relationStatements(db, articleId, input, projection));
		await runD1Batch(db, statements);
	} catch (error) {
		throwDatabaseConflict(error, "slug");
	}
	const article = await hydrateArticle(db, articleId);
	if (!article) throw notFound();
	return article;
}

export async function saveArticle(
	db: ArticleDatabase,
	articleId: string,
	input: ArticleDraftInput,
	projection: ArticleProjection,
	status: "draft" | "published",
	publishedAt: number | null,
	now = Date.now(),
): Promise<ArticleAdminDto> {
	try {
		const existing = await db
			.select({ article: articles })
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);
		const current = existing[0]?.article;
		if (!current) throw notFound();
		const statements: D1BatchStatement[] = [];
		if (current.publishedAt !== null && current.slug !== input.slug) {
			const redirect = await db
				.select({ id: articleSlugRedirects.id })
				.from(articleSlugRedirects)
				.where(eq(articleSlugRedirects.oldSlug, input.slug))
				.limit(1);
			if (redirect[0]) throw conflict("slug");
			statements.push(
				db.insert(articleSlugRedirects).values({
					id: crypto.randomUUID(),
					oldSlug: current.slug,
					articleId,
					createdAt: now,
				}),
			);
		}
		statements.push(
			db
				.update(articles)
				.set({
					type: input.type,
					authorId: input.authorId ?? current.authorId,
					title: input.title,
					slug: input.slug,
					excerpt: input.excerpt,
					bodyMarkdown: input.bodyMarkdown,
					heroMediaId: input.heroMediaId,
					scoreHalfSteps: input.scoreHalfSteps,
					verdict: input.verdict,
					featured: input.featured && status === "published",
					finalReviewId: input.finalReviewId,
					hasMaterialBenefit: input.hasMaterialBenefit,
					disclosure: input.disclosure,
					status,
					publishedAt,
					updatedAt: now,
				})
				.where(eq(articles.id, articleId)),
		);
		if (input.featured && status === "published")
			statements.push(
				db
					.update(articles)
					.set({ featured: false })
					.where(ne(articles.id, articleId)),
			);
		statements.push(...relationStatements(db, articleId, input, projection));
		await runD1Batch(db, statements);
	} catch (error) {
		throwDatabaseConflict(error, "slug");
	}
	const article = await hydrateArticle(db, articleId);
	if (!article) throw notFound();
	return article;
}

export async function unpublishArticle(
	db: ArticleDatabase,
	articleId: string,
	now = Date.now(),
): Promise<ArticleAdminDto> {
	try {
		const current = await db
			.select({ id: articles.id })
			.from(articles)
			.where(eq(articles.id, articleId))
			.limit(1);
		if (!current[0]) throw notFound();
		await runD1Batch(db, [
			db
				.update(articles)
				.set({ status: "draft", featured: false, updatedAt: now })
				.where(eq(articles.id, articleId)),
		]);
	} catch (error) {
		throwDatabaseConflict(error);
	}
	const article = await hydrateArticle(db, articleId);
	if (!article) throw notFound();
	return article;
}
