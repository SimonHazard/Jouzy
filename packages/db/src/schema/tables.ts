import { sql } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import {
	check,
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const mediaAssets = sqliteTable(
	"media_assets",
	{
		id: text("id").primaryKey(),
		r2Key: text("r2_key").notNull(),
		originalFilename: text("original_filename").notNull(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		width: integer("width").notNull(),
		height: integer("height").notNull(),
		altText: text("alt_text").notNull(),
		caption: text("caption"),
		credit: text("credit"),
		uploadedByAuthorId: text("uploaded_by_author_id")
			.notNull()
			.references((): SQLiteColumn => authors.id, { onDelete: "restrict" }),
		createdAt: integer("created_at", { mode: "number" }).notNull(),
	},
	(table) => [
		uniqueIndex("media_assets_r2_key_unique").on(table.r2Key),
		index("media_assets_uploaded_by_author_idx").on(table.uploadedByAuthorId),
	],
);

export const authors = sqliteTable(
	"authors",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull(),
		role: text("role", { enum: ["admin", "author"] }).notNull(),
		status: text("status", { enum: ["active", "disabled"] }).notNull(),
		slug: text("slug").notNull(),
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		displayName: text("display_name").notNull(),
		bio: text("bio").notNull().default(""),
		avatarMediaId: text("avatar_media_id").references(
			(): SQLiteColumn => mediaAssets.id,
			{
				onDelete: "set null",
			},
		),
		publicEmail: text("public_email"),
		createdAt: integer("created_at", { mode: "number" }).notNull(),
		updatedAt: integer("updated_at", { mode: "number" }).notNull(),
	},
	(table) => [
		uniqueIndex("authors_email_unique").on(table.email),
		uniqueIndex("authors_slug_unique").on(table.slug),
		index("authors_status_updated_at_idx").on(table.status, table.updatedAt),
		check("authors_role_check", sql`${table.role} IN ('admin', 'author')`),
		check(
			"authors_status_check",
			sql`${table.status} IN ('active', 'disabled')`,
		),
	],
);

export const authorSocialLinks = sqliteTable(
	"author_social_links",
	{
		id: text("id").primaryKey(),
		authorId: text("author_id")
			.notNull()
			.references((): SQLiteColumn => authors.id, { onDelete: "cascade" }),
		provider: text("provider").notNull(),
		label: text("label").notNull(),
		url: text("url").notNull(),
		position: integer("position").notNull().default(0),
	},
	(table) => [index("author_social_links_author_idx").on(table.authorId)],
);

export const platforms = sqliteTable(
	"platforms",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		position: integer("position"),
	},
	(table) => [uniqueIndex("platforms_slug_unique").on(table.slug)],
);

export const genres = sqliteTable(
	"genres",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		position: integer("position"),
	},
	(table) => [uniqueIndex("genres_slug_unique").on(table.slug)],
);

export const tags = sqliteTable(
	"tags",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		position: integer("position"),
	},
	(table) => [uniqueIndex("tags_slug_unique").on(table.slug)],
);

export const games = sqliteTable(
	"games",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		slug: text("slug").notNull(),
		coverMediaId: text("cover_media_id").references(
			(): SQLiteColumn => mediaAssets.id,
			{
				onDelete: "set null",
			},
		),
		developer: text("developer"),
		publisher: text("publisher"),
		releaseDate: text("release_date"),
		releaseDatePrecision: text("release_date_precision", {
			enum: ["day", "month", "year", "unknown"],
		}),
		createdAt: integer("created_at", { mode: "number" }).notNull(),
		updatedAt: integer("updated_at", { mode: "number" }).notNull(),
	},
	(table) => [
		uniqueIndex("games_slug_unique").on(table.slug),
		index("games_title_idx").on(table.title),
		check(
			"games_release_date_precision_check",
			sql`${table.releaseDatePrecision} IS NULL OR ${table.releaseDatePrecision} IN ('day', 'month', 'year', 'unknown')`,
		),
	],
);

export const articles = sqliteTable(
	"articles",
	{
		id: text("id").primaryKey(),
		type: text("type", {
			enum: ["review", "first_impression", "article"],
		}).notNull(),
		status: text("status", { enum: ["draft", "published"] }).notNull(),
		authorId: text("author_id")
			.notNull()
			.references((): SQLiteColumn => authors.id, { onDelete: "restrict" }),
		title: text("title").notNull(),
		slug: text("slug").notNull(),
		excerpt: text("excerpt").notNull().default(""),
		bodyMarkdown: text("body_markdown").notNull().default(""),
		heroMediaId: text("hero_media_id").references(
			(): SQLiteColumn => mediaAssets.id,
			{
				onDelete: "restrict",
			},
		),
		scoreHalfSteps: integer("score_half_steps"),
		verdict: text("verdict"),
		featured: integer("featured", { mode: "boolean" }).notNull().default(false),
		finalReviewId: text("final_review_id").references(
			(): SQLiteColumn => articles.id,
			{
				onDelete: "set null",
			},
		),
		hasMaterialBenefit: integer("has_material_benefit", { mode: "boolean" })
			.notNull()
			.default(false),
		disclosure: text("disclosure"),
		publishedAt: integer("published_at", { mode: "number" }),
		createdAt: integer("created_at", { mode: "number" }).notNull(),
		updatedAt: integer("updated_at", { mode: "number" }).notNull(),
	},
	(table) => [
		uniqueIndex("articles_slug_unique").on(table.slug),
		index("articles_status_published_at_idx").on(
			table.status,
			table.publishedAt,
		),
		index("articles_author_status_updated_at_idx").on(
			table.authorId,
			table.status,
			table.updatedAt,
		),
		index("articles_title_idx").on(table.title),
		check(
			"articles_type_check",
			sql`${table.type} IN ('review', 'first_impression', 'article')`,
		),
		check(
			"articles_status_check",
			sql`${table.status} IN ('draft', 'published')`,
		),
		check(
			"articles_score_check",
			sql`${table.scoreHalfSteps} IS NULL OR (${table.scoreHalfSteps} BETWEEN 0 AND 20 AND ${table.scoreHalfSteps} = CAST(${table.scoreHalfSteps} AS INTEGER))`,
		),
	],
);

export const articleSlugRedirects = sqliteTable(
	"article_slug_redirects",
	{
		id: text("id").primaryKey(),
		oldSlug: text("old_slug").notNull(),
		articleId: text("article_id")
			.notNull()
			.references((): SQLiteColumn => articles.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "number" }).notNull(),
	},
	(table) => [
		uniqueIndex("article_slug_redirects_old_slug_unique").on(table.oldSlug),
		index("article_slug_redirects_article_idx").on(table.articleId),
	],
);

export const articleGames = sqliteTable(
	"article_games",
	{
		articleId: text("article_id")
			.notNull()
			.references((): SQLiteColumn => articles.id, { onDelete: "cascade" }),
		gameId: text("game_id")
			.notNull()
			.references((): SQLiteColumn => games.id, { onDelete: "restrict" }),
		isPrimary: integer("is_primary", { mode: "boolean" })
			.notNull()
			.default(false),
	},
	(table) => [
		primaryKey({ columns: [table.articleId, table.gameId] }),
		index("article_games_article_idx").on(table.articleId),
		index("article_games_game_idx").on(table.gameId),
		uniqueIndex("article_games_primary_unique")
			.on(table.articleId)
			.where(sql`${table.isPrimary} = 1`),
	],
);

export const articleTags = sqliteTable(
	"article_tags",
	{
		articleId: text("article_id")
			.notNull()
			.references((): SQLiteColumn => articles.id, { onDelete: "cascade" }),
		tagId: text("tag_id")
			.notNull()
			.references((): SQLiteColumn => tags.id, { onDelete: "restrict" }),
	},
	(table) => [
		primaryKey({ columns: [table.articleId, table.tagId] }),
		index("article_tags_article_idx").on(table.articleId),
		index("article_tags_tag_idx").on(table.tagId),
	],
);

export const articleLinks = sqliteTable(
	"article_links",
	{
		id: text("id").primaryKey(),
		articleId: text("article_id")
			.notNull()
			.references((): SQLiteColumn => articles.id, { onDelete: "cascade" }),
		provider: text("provider").notNull(),
		label: text("label").notNull(),
		url: text("url").notNull(),
		isAffiliate: integer("is_affiliate", { mode: "boolean" })
			.notNull()
			.default(false),
		position: integer("position").notNull().default(0),
	},
	(table) => [index("article_links_article_idx").on(table.articleId)],
);

export const gameStoreLinks = sqliteTable(
	"game_store_links",
	{
		id: text("id").primaryKey(),
		gameId: text("game_id")
			.notNull()
			.references((): SQLiteColumn => games.id, { onDelete: "cascade" }),
		platform: text("platform").notNull(),
		provider: text("provider").notNull(),
		label: text("label").notNull(),
		url: text("url").notNull(),
		position: integer("position").notNull().default(0),
	},
	(table) => [index("game_store_links_game_idx").on(table.gameId)],
);

export const gamePlatforms = sqliteTable(
	"game_platforms",
	{
		gameId: text("game_id")
			.notNull()
			.references((): SQLiteColumn => games.id, { onDelete: "cascade" }),
		platformId: text("platform_id")
			.notNull()
			.references((): SQLiteColumn => platforms.id, { onDelete: "restrict" }),
	},
	(table) => [
		primaryKey({ columns: [table.gameId, table.platformId] }),
		index("game_platforms_game_idx").on(table.gameId),
		index("game_platforms_platform_idx").on(table.platformId),
	],
);

export const gameGenres = sqliteTable(
	"game_genres",
	{
		gameId: text("game_id")
			.notNull()
			.references((): SQLiteColumn => games.id, { onDelete: "cascade" }),
		genreId: text("genre_id")
			.notNull()
			.references((): SQLiteColumn => genres.id, { onDelete: "restrict" }),
	},
	(table) => [
		primaryKey({ columns: [table.gameId, table.genreId] }),
		index("game_genres_game_idx").on(table.gameId),
		index("game_genres_genre_idx").on(table.genreId),
	],
);

export const articleMedia = sqliteTable(
	"article_media",
	{
		articleId: text("article_id")
			.notNull()
			.references((): SQLiteColumn => articles.id, { onDelete: "cascade" }),
		mediaAssetId: text("media_asset_id")
			.notNull()
			.references((): SQLiteColumn => mediaAssets.id, { onDelete: "restrict" }),
	},
	(table) => [
		primaryKey({ columns: [table.articleId, table.mediaAssetId] }),
		index("article_media_article_idx").on(table.articleId),
		index("article_media_media_asset_idx").on(table.mediaAssetId),
	],
);

export const articleEmbeds = sqliteTable(
	"article_embeds",
	{
		id: text("id").primaryKey(),
		articleId: text("article_id")
			.notNull()
			.references((): SQLiteColumn => articles.id, { onDelete: "cascade" }),
		directiveId: text("directive_id").notNull(),
		type: text("type", { enum: ["video", "music"] }).notNull(),
		provider: text("provider", {
			enum: [
				"youtube",
				"vimeo",
				"spotify",
				"apple_music",
				"youtube_music",
				"bandcamp",
				"soundcloud",
			],
		}).notNull(),
		canonicalUrl: text("canonical_url").notNull(),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		uniqueIndex("article_embeds_article_directive_unique").on(
			table.articleId,
			table.directiveId,
		),
		index("article_embeds_article_idx").on(table.articleId),
	],
);
