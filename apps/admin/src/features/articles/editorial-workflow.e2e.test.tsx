import type {
	ArticleAdminDto,
	ArticleProjection,
	AuthorIdentityRecord,
	GameDto,
	MediaAssetDto,
} from "@jouzy/db/queries/admin";
import type { ArticleDraftInput, AuthorizationIdentity } from "@jouzy/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ids = vi.hoisted(() => ({
	admin: "author-admin-0001",
	author: "author-editor-0001",
	otherAuthor: "author-other-0001",
	game: "game-jouzy-0001",
	tag: "tag-review-0001",
	media: "media-cover-0001",
}));

type FixtureState = {
	authors: Map<string, AuthorIdentityRecord>;
	games: Map<string, GameDto>;
	tags: Map<string, { id: string; name: string }>;
	media: Map<string, MediaAssetDto>;
	articles: Map<string, ArticleAdminDto>;
	redirects: Array<{ oldSlug: string; articleId: string }>;
};

function makeAuthor(
	id: string,
	role: "admin" | "author",
	displayName: string,
): AuthorIdentityRecord {
	return {
		id,
		email: `${id}@example.test`,
		role,
		status: "active",
		displayName,
	};
}

function makeState(): FixtureState {
	return {
		authors: new Map([
			[ids.admin, makeAuthor(ids.admin, "admin", "Administrateur Jouzy")],
			[ids.author, makeAuthor(ids.author, "author", "Auteur Jouzy")],
			[ids.otherAuthor, makeAuthor(ids.otherAuthor, "author", "Autre auteur")],
		]),
		games: new Map([
			[
				ids.game,
				{
					id: ids.game,
					title: "Jouzy E2E Game",
					slug: "jouzy-e2e-game",
					coverMediaId: null,
					developer: "Jouzy Studio",
					publisher: "Jouzy Publishing",
					releaseDate: "2026-09-01",
					releaseDatePrecision: "day",
					createdAt: 1_757_000_000_000,
					updatedAt: 1_757_000_000_000,
					platformIds: [],
					genreIds: [],
					storeLinks: [],
				},
			],
		]),
		tags: new Map([[ids.tag, { id: ids.tag, name: "Review" }]]),
		media: new Map([
			[
				ids.media,
				{
					id: ids.media,
					r2Key: "media/2026/cover-e2e.png",
					originalFilename: "cover-e2e.png",
					mimeType: "image/png",
					sizeBytes: 24,
					width: 512,
					height: 256,
					altText: "Couverture du jeu E2E",
					caption: "Une image de couverture de test",
					credit: "Jouzy E2E",
					uploadedByAuthorId: ids.admin,
					createdAt: 1_757_000_000_000,
				},
			],
		]),
		articles: new Map(),
		redirects: [],
	};
}

function identity(
	authorId: string,
	role: "admin" | "author",
	displayName: string,
): AuthorizationIdentity {
	return {
		authorId,
		email: `${authorId}@example.test`,
		role,
		status: "active",
		displayName,
	};
}

function buildArticle(
	state: FixtureState,
	input: ArticleDraftInput,
	projection: ArticleProjection,
	status: "draft" | "published",
	publishedAt: number | null,
	now: number,
	articleId: string = crypto.randomUUID(),
): ArticleAdminDto {
	const author = state.authors.get(input.authorId ?? "");
	if (!author) throw new Error("fixture author missing");
	return {
		article: {
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
		},
		author: { id: author.id, displayName: author.displayName },
		games: input.gameIds.flatMap((gameId) => {
			const game = state.games.get(gameId);
			return game
				? [
						{
							id: game.id,
							title: game.title,
							isPrimary: gameId === input.primaryGameId,
						},
					]
				: [];
		}),
		tags: input.tagIds.flatMap((tagId) => {
			const tag = state.tags.get(tagId);
			return tag ? [tag] : [];
		}),
		links: input.links.map((link, position) => ({
			id: crypto.randomUUID(),
			articleId,
			provider: link.provider,
			label: link.label,
			url: link.url,
			isAffiliate: link.isAffiliate,
			position,
		})),
		mediaAssetIds: [...new Set(projection.mediaAssetIds)],
		embeds: projection.embeds.map((embed) => ({
			id: crypto.randomUUID(),
			articleId,
			directiveId: embed.directiveId,
			type: embed.type,
			provider: embed.provider,
			canonicalUrl: embed.canonicalUrl,
			position: embed.position,
		})),
	};
}

const mocks = vi.hoisted(() => {
	let state = makeState();
	const db = {} as never;
	const getState = () => state;
	return {
		db,
		getState,
		reset: () => {
			state = makeState();
		},
		findAuthorById: vi.fn(
			async (_db: unknown, id: string) => state.authors.get(id) ?? null,
		),
		getAuthorForAdmin: vi.fn(
			async (_db: unknown, id: string) => state.authors.get(id) ?? null,
		),
		listAuthors: vi.fn(async () => [...state.authors.values()]),
		getGame: vi.fn(
			async (_db: unknown, id: string) => state.games.get(id) ?? null,
		),
		listGames: vi.fn(async () => [...state.games.values()]),
		listTags: vi.fn(async () => [...state.tags.values()]),
		getMediaAsset: vi.fn(
			async (_db: unknown, id: string) => state.media.get(id) ?? null,
		),
		listMediaAssets: vi.fn(async () => [...state.media.values()]),
		getArticle: vi.fn(
			async (_db: unknown, id: string) => state.articles.get(id) ?? null,
		),
		listArticles: vi.fn(async (_db: unknown, authorId?: string) =>
			[...state.articles.values()].filter(
				(article) => !authorId || article.article.authorId === authorId,
			),
		),
		createArticle: vi.fn(
			async (
				_db: unknown,
				input: ArticleDraftInput,
				projection: ArticleProjection,
				status: "draft" | "published" = "draft",
				publishedAt: number | null = null,
				now = Date.now(),
			) => {
				const article = buildArticle(
					state,
					input,
					projection,
					status,
					publishedAt,
					now,
				);
				state.articles.set(article.article.id, article);
				return article;
			},
		),
		saveArticle: vi.fn(
			async (
				_db: unknown,
				articleId: string,
				input: ArticleDraftInput,
				projection: ArticleProjection,
				status: "draft" | "published",
				publishedAt: number | null,
				now = Date.now(),
			) => {
				const current = state.articles.get(articleId);
				if (!current) throw new Error("fixture article missing");
				if (
					current.article.publishedAt !== null &&
					current.article.slug !== input.slug
				)
					state.redirects.push({ oldSlug: current.article.slug, articleId });
				const updated = buildArticle(
					state,
					input,
					projection,
					status,
					publishedAt,
					now,
					articleId,
				);
				updated.article.createdAt = current.article.createdAt;
				state.articles.set(articleId, updated);
				return updated;
			},
		),
		unpublishArticle: vi.fn(
			async (_db: unknown, articleId: string, now = Date.now()) => {
				const current = state.articles.get(articleId);
				if (!current) throw new Error("fixture article missing");
				current.article.status = "draft";
				current.article.featured = false;
				current.article.updatedAt = now;
				return current;
			},
		),
		notFound: vi.fn(() => {
			throw new Error("NOT_FOUND");
		}),
	};
});

vi.mock("../../server/db.js", () => ({ getDatabase: () => mocks.db }));
vi.mock("../runtime.server.js", () => ({
	getRuntimeEnv: () => ({ R2_PUBLIC_BASE_URL: "https://media.example.test" }),
}));
vi.mock("@jouzy/db/queries/admin", () => mocks);

import {
	articleFormOptions,
	createDraft,
	getArticleForIdentity,
	getPreviewForIdentity,
	listArticlesForIdentity,
	publish,
	unpublish,
} from "./article-service.server.js";

function reviewInput(
	overrides: Partial<ArticleDraftInput> = {},
): ArticleDraftInput {
	return {
		type: "review",
		title: "Review locale Jouzy",
		slug: "review-locale-jouzy",
		excerpt: "Une review de fixture refletant le modele editorial.",
		bodyMarkdown: `## Une review locale\n\nTexte de verification.\n\n::jouzy-image{assetId="${ids.media}"}\n\n::jouzy-embed{kind="video" provider="youtube" url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"}`,
		heroMediaId: ids.media,
		scoreHalfSteps: 17,
		verdict: "Une bonne verification.",
		featured: true,
		finalReviewId: null,
		hasMaterialBenefit: false,
		disclosure: "Lien affilié utilisé pour la vérification.",
		authorId: ids.author,
		gameIds: [ids.game],
		primaryGameId: ids.game,
		tagIds: [ids.tag],
		links: [
			{
				provider: "Jouzy Store",
				label: "Acheter la version de test",
				url: "https://example.test/jouzy-e2e",
				isAffiliate: true,
			},
		],
		...overrides,
	};
}

const admin = identity(ids.admin, "admin", "Administrateur Jouzy");
const author = identity(ids.author, "author", "Auteur Jouzy");

describe("editorial workflow E2E avec fixtures D1/R2 réalistes", () => {
	beforeEach(() => {
		mocks.reset();
		vi.clearAllMocks();
	});

	it("crée, prévisualise, publie, renomme puis dépublie une review complète", async () => {
		const draft = await createDraft(admin, reviewInput());
		const state = mocks.getState();

		expect(draft.article.status).toBe("draft");
		expect(draft.article.authorId).toBe(ids.author);
		expect(draft.games).toEqual([
			{ id: ids.game, title: "Jouzy E2E Game", isPrimary: true },
		]);
		expect(draft.mediaAssetIds).toEqual([ids.media]);
		expect(draft.embeds[0]).toMatchObject({
			type: "video",
			provider: "youtube",
			canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		});
		expect(draft.links[0]).toMatchObject({ isAffiliate: true });

		const preview = await getPreviewForIdentity(author, draft.article.id);
		expect(preview.assets[ids.media]).toMatchObject({
			publicUrl: "https://media.example.test/media/2026/cover-e2e.png",
			alt: "Couverture du jeu E2E",
			caption: "Une image de couverture de test",
			credit: "Jouzy E2E",
			width: 512,
			height: 256,
		});
		expect(preview.document.embeds).toHaveLength(1);

		const published = await publish(author, draft.article.id, reviewInput());
		expect(published.article.status).toBe("published");
		expect(published.article.publishedAt).not.toBeNull();
		expect(published.article.featured).toBe(false);
		const firstPublishedAt = published.article.publishedAt;

		const republished = await publish(author, draft.article.id, reviewInput());
		expect(republished.article.publishedAt).toBe(firstPublishedAt);

		const renamed = await publish(
			author,
			draft.article.id,
			reviewInput({ slug: "review-locale-jouzy-renommee" }),
		);
		expect(renamed.article.slug).toBe("review-locale-jouzy-renommee");
		expect(state.redirects).toContainEqual({
			oldSlug: "review-locale-jouzy",
			articleId: draft.article.id,
		});

		const unpublished = await unpublish(author, draft.article.id);
		expect(unpublished.article.status).toBe("draft");
		expect(unpublished.article.publishedAt).toBe(firstPublishedAt);
		expect(await listArticlesForIdentity(author)).toHaveLength(1);
	});

	it("isole les contenus d’un autre auteur et conserve les options cohérentes", async () => {
		const otherArticle = await createDraft(
			admin,
			reviewInput({
				authorId: ids.otherAuthor,
				slug: "review-autre-auteur",
				title: "Review d’un autre auteur",
			}),
		);

		await expect(
			getArticleForIdentity(author, otherArticle.article.id),
		).rejects.toThrow();
		await expect(unpublish(author, otherArticle.article.id)).rejects.toThrow();
		await expect(
			createDraft(
				author,
				reviewInput({
					authorId: ids.otherAuthor,
					slug: "attribution-interdite",
				}),
			),
		).rejects.toThrow("attribuer la publication");

		const options = await articleFormOptions(author);
		expect(options.authors).toHaveLength(1);
		expect(options.authors[0]?.id).toBe(ids.author);
		expect(options.games[0]?.id).toBe(ids.game);
		expect(options.media[0]?.id).toBe(ids.media);
	});
});
