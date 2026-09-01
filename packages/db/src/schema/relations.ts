import { relations } from "drizzle-orm";

import {
	articleEmbeds,
	articleGames,
	articleLinks,
	articleMedia,
	articleSlugRedirects,
	articles,
	articleTags,
	authorSocialLinks,
	authors,
	gameGenres,
	gamePlatforms,
	gameStoreLinks,
	games,
	genres,
	mediaAssets,
	platforms,
	tags,
} from "./tables.js";

export const authorsRelations = relations(authors, ({ one, many }) => ({
	avatarMedia: one(mediaAssets, {
		fields: [authors.avatarMediaId],
		references: [mediaAssets.id],
	}),
	socialLinks: many(authorSocialLinks),
	articles: many(articles),
}));

export const authorSocialLinksRelations = relations(
	authorSocialLinks,
	({ one }) => ({
		author: one(authors, {
			fields: [authorSocialLinks.authorId],
			references: [authors.id],
		}),
	}),
);

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
	uploader: one(authors, {
		fields: [mediaAssets.uploadedByAuthorId],
		references: [authors.id],
	}),
	authorAvatar: many(authors),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
	coverMedia: one(mediaAssets, {
		fields: [games.coverMediaId],
		references: [mediaAssets.id],
	}),
	articles: many(articleGames),
	storeLinks: many(gameStoreLinks),
	platforms: many(gamePlatforms),
	genres: many(gameGenres),
}));

export const platformsRelations = relations(platforms, ({ many }) => ({
	games: many(gamePlatforms),
}));

export const genresRelations = relations(genres, ({ many }) => ({
	games: many(gameGenres),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	articles: many(articleTags),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
	author: one(authors, {
		fields: [articles.authorId],
		references: [authors.id],
	}),
	heroMedia: one(mediaAssets, {
		fields: [articles.heroMediaId],
		references: [mediaAssets.id],
	}),
	finalReview: one(articles, {
		fields: [articles.finalReviewId],
		references: [articles.id],
		relationName: "final_review",
	}),
	firstImpressions: many(articles, { relationName: "final_review" }),
	games: many(articleGames),
	tags: many(articleTags),
	links: many(articleLinks),
	media: many(articleMedia),
	embeds: many(articleEmbeds),
	redirects: many(articleSlugRedirects),
}));

export const articleSlugRedirectsRelations = relations(
	articleSlugRedirects,
	({ one }) => ({
		article: one(articles, {
			fields: [articleSlugRedirects.articleId],
			references: [articles.id],
		}),
	}),
);

export const articleGamesRelations = relations(articleGames, ({ one }) => ({
	article: one(articles, {
		fields: [articleGames.articleId],
		references: [articles.id],
	}),
	game: one(games, {
		fields: [articleGames.gameId],
		references: [games.id],
	}),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
	article: one(articles, {
		fields: [articleTags.articleId],
		references: [articles.id],
	}),
	tag: one(tags, {
		fields: [articleTags.tagId],
		references: [tags.id],
	}),
}));

export const articleLinksRelations = relations(articleLinks, ({ one }) => ({
	article: one(articles, {
		fields: [articleLinks.articleId],
		references: [articles.id],
	}),
}));

export const gameStoreLinksRelations = relations(gameStoreLinks, ({ one }) => ({
	game: one(games, {
		fields: [gameStoreLinks.gameId],
		references: [games.id],
	}),
}));

export const gamePlatformsRelations = relations(gamePlatforms, ({ one }) => ({
	game: one(games, {
		fields: [gamePlatforms.gameId],
		references: [games.id],
	}),
	platform: one(platforms, {
		fields: [gamePlatforms.platformId],
		references: [platforms.id],
	}),
}));

export const gameGenresRelations = relations(gameGenres, ({ one }) => ({
	game: one(games, {
		fields: [gameGenres.gameId],
		references: [games.id],
	}),
	genre: one(genres, {
		fields: [gameGenres.genreId],
		references: [genres.id],
	}),
}));

export const articleMediaRelations = relations(articleMedia, ({ one }) => ({
	article: one(articles, {
		fields: [articleMedia.articleId],
		references: [articles.id],
	}),
	mediaAsset: one(mediaAssets, {
		fields: [articleMedia.mediaAssetId],
		references: [mediaAssets.id],
	}),
}));

export const articleEmbedsRelations = relations(articleEmbeds, ({ one }) => ({
	article: one(articles, {
		fields: [articleEmbeds.articleId],
		references: [articles.id],
	}),
}));
