import { parseArticleMarkdown } from "@jouzy/content";
import {
	type ArticleAdminDto,
	createArticle,
	findAuthorById,
	getArticle,
	getAuthorForAdmin,
	getGame,
	getMediaAsset,
	listArticles,
	listAuthors,
	listGames,
	listMediaAssets,
	listTags,
	notFound,
	saveArticle,
	unpublishArticle,
} from "@jouzy/db/queries/admin";
import {
	type ArticleDraftInput,
	type AuthorizationIdentity,
	assertCanMutateArticle,
	assertCanReadArticle,
	domainError,
	parseArticleDraftInput,
	validateArticleFormat,
	validatePublication,
} from "@jouzy/domain";
import { getDatabase } from "../../server/db.js";
import { getRuntimeEnv } from "../runtime.server.js";

function database() {
	return getDatabase();
}

async function validateAndProject(
	input: ArticleDraftInput,
	status: "draft" | "published",
	current?: ArticleAdminDto,
): Promise<{
	input: ArticleDraftInput;
	projection: {
		mediaAssetIds: string[];
		embeds: ReturnType<typeof parseArticleMarkdown>["embeds"];
	};
}> {
	const normalizedInput = {
		...input,
		primaryGameId: input.type === "article" ? null : input.primaryGameId,
		scoreHalfSteps: input.type === "review" ? input.scoreHalfSteps : null,
		verdict: input.type === "review" ? input.verdict : null,
		finalReviewId:
			input.type === "first_impression" ? input.finalReviewId : null,
	};
	const parsed = parseArticleMarkdown(normalizedInput.bodyMarkdown);
	const db = database();
	const authorId = normalizedInput.authorId ?? current?.article.authorId;
	if (!authorId)
		throw domainError("INVALID_VALUE", "Un auteur est requis.", {
			field: "authorId",
		});
	const author = await findAuthorById(db, authorId);
	if (!author)
		throw domainError(
			"INVALID_VALUE",
			"L’auteur sélectionné est introuvable.",
			{ field: "authorId" },
		);
	validateArticleFormat({
		type: normalizedInput.type,
		primaryGameId: normalizedInput.primaryGameId,
		scoreHalfSteps: normalizedInput.scoreHalfSteps,
		verdict: normalizedInput.verdict,
		finalReview: null,
	});
	const gameIds = [...new Set(normalizedInput.gameIds)];
	if (
		normalizedInput.primaryGameId &&
		!gameIds.includes(normalizedInput.primaryGameId)
	)
		throw domainError(
			"INVALID_FORMAT",
			"Le jeu principal doit faire partie des jeux associés.",
			{ field: "primaryGameId" },
		);
	for (const gameId of gameIds)
		if (!(await getGame(db, gameId)))
			throw domainError("INVALID_VALUE", "Un jeu associé est introuvable.", {
				field: "gameIds",
			});
	for (const tag of normalizedInput.tagIds)
		if (!(await listTags(db)).some((item) => item.id === tag))
			throw domainError("INVALID_VALUE", "Un tag associé est introuvable.", {
				field: "tagIds",
			});
	for (const assetId of [
		...new Set([
			...(normalizedInput.heroMediaId ? [normalizedInput.heroMediaId] : []),
			...parsed.media.map((item) => item.assetId),
		]),
	])
		if (!(await getMediaAsset(db, assetId)))
			throw domainError(
				"INVALID_VALUE",
				"Une image référencée est introuvable.",
				{ field: "heroMediaId" },
			);
	let finalReview: {
		status: "published" | "draft";
		primaryGameId: string | null;
	} | null = null;
	if (normalizedInput.finalReviewId) {
		const review = await getArticle(db, normalizedInput.finalReviewId);
		if (!review)
			throw domainError("INVALID_VALUE", "La review finale est introuvable.", {
				field: "finalReviewId",
			});
		finalReview = {
			status: review.article.status,
			primaryGameId: review.games.find((game) => game.isPrimary)?.id ?? null,
		};
	}
	validateArticleFormat({
		type: normalizedInput.type,
		primaryGameId: normalizedInput.primaryGameId,
		scoreHalfSteps: normalizedInput.scoreHalfSteps,
		verdict: normalizedInput.verdict,
		finalReview,
	});
	if (status === "published")
		validatePublication({
			type: normalizedInput.type,
			primaryGameId: normalizedInput.primaryGameId,
			scoreHalfSteps: normalizedInput.scoreHalfSteps,
			verdict: normalizedInput.verdict,
			finalReview,
			authorStatus: author.status,
			title: normalizedInput.title,
			excerpt: normalizedInput.excerpt,
			bodyMarkdown: normalizedInput.bodyMarkdown,
			heroMediaId: normalizedInput.heroMediaId,
			hasMaterialBenefit: normalizedInput.hasMaterialBenefit,
			disclosure: normalizedInput.disclosure,
			links: normalizedInput.links,
		});
	return {
		input: { ...normalizedInput, authorId },
		projection: {
			mediaAssetIds: parsed.media.map((item) => item.assetId),
			embeds: parsed.embeds,
		},
	};
}

function checkOwnership(
	identity: AuthorizationIdentity,
	article: ArticleAdminDto,
): void {
	assertCanReadArticle(identity, article.article.authorId);
}

export async function listArticlesForIdentity(
	identity: AuthorizationIdentity,
): Promise<ArticleAdminDto[]> {
	return listArticles(
		database(),
		identity.role === "admin" ? undefined : identity.authorId,
	);
}

export async function getArticleForIdentity(
	identity: AuthorizationIdentity,
	articleId: string,
): Promise<ArticleAdminDto> {
	const article = await getArticle(database(), articleId);
	if (!article) throw notFound();
	checkOwnership(identity, article);
	return article;
}

export async function createDraft(
	identity: AuthorizationIdentity,
	rawInput: unknown,
): Promise<ArticleAdminDto> {
	const parsed = parseArticleDraftInput(rawInput);
	if (
		identity.role !== "admin" &&
		parsed.authorId &&
		parsed.authorId !== identity.authorId
	)
		throw new Error(
			"Un auteur ne peut pas attribuer la publication à un autre profil.",
		);
	const { input, projection } = await validateAndProject(
		{
			...parsed,
			authorId: parsed.authorId ?? identity.authorId,
			featured: identity.role === "admin" && parsed.featured,
		},
		"draft",
	);
	return createArticle(database(), input, projection);
}

export async function createPublished(
	identity: AuthorizationIdentity,
	rawInput: unknown,
): Promise<ArticleAdminDto> {
	const parsed = parseArticleDraftInput(rawInput);
	if (
		identity.role !== "admin" &&
		parsed.authorId &&
		parsed.authorId !== identity.authorId
	)
		throw new Error(
			"Un auteur ne peut pas attribuer la publication à un autre profil.",
		);
	const { input, projection } = await validateAndProject(
		{
			...parsed,
			authorId: parsed.authorId ?? identity.authorId,
			featured: identity.role === "admin" && parsed.featured,
		},
		"published",
	);
	return createArticle(database(), input, projection, "published", Date.now());
}

export async function saveDraft(
	identity: AuthorizationIdentity,
	articleId: string,
	rawInput: unknown,
): Promise<ArticleAdminDto> {
	const current = await getArticleForIdentity(identity, articleId);
	assertCanMutateArticle(identity, current.article.authorId);
	const parsed = parseArticleDraftInput(rawInput);
	if (
		identity.role !== "admin" &&
		parsed.authorId &&
		parsed.authorId !== current.article.authorId
	)
		throw new Error(
			"Un auteur ne peut pas attribuer la publication à un autre profil.",
		);
	const { input, projection } = await validateAndProject(
		{
			...parsed,
			authorId:
				identity.role === "admin"
					? (parsed.authorId ?? current.article.authorId)
					: current.article.authorId,
			featured: identity.role === "admin" && parsed.featured,
		},
		"draft",
		current,
	);
	return saveArticle(
		database(),
		articleId,
		input,
		projection,
		"draft",
		current.article.publishedAt,
	);
}

export async function publish(
	identity: AuthorizationIdentity,
	articleId: string,
	rawInput: unknown,
): Promise<ArticleAdminDto> {
	const current = await getArticleForIdentity(identity, articleId);
	assertCanMutateArticle(identity, current.article.authorId);
	const parsed = parseArticleDraftInput(rawInput);
	if (
		identity.role !== "admin" &&
		parsed.authorId &&
		parsed.authorId !== current.article.authorId
	)
		throw new Error(
			"Un auteur ne peut pas attribuer la publication à un autre profil.",
		);
	const { input, projection } = await validateAndProject(
		{
			...parsed,
			authorId:
				identity.role === "admin"
					? (parsed.authorId ?? current.article.authorId)
					: current.article.authorId,
			featured: identity.role === "admin" && parsed.featured,
		},
		"published",
		current,
	);
	return saveArticle(
		database(),
		articleId,
		input,
		projection,
		"published",
		current.article.publishedAt ?? Date.now(),
	);
}

export async function unpublish(
	identity: AuthorizationIdentity,
	articleId: string,
): Promise<ArticleAdminDto> {
	const current = await getArticleForIdentity(identity, articleId);
	assertCanMutateArticle(identity, current.article.authorId);
	return unpublishArticle(database(), articleId);
}

export async function articleFormOptions(identity: AuthorizationIdentity) {
	const db = database();
	return {
		authors:
			identity.role === "admin"
				? await listAuthors(db)
				: [await getAuthorForAdmin(db, identity.authorId)],
		games: await listGames(db),
		tags: await listTags(db),
		media: await listMediaAssets(db),
	};
}

export async function getPreviewForIdentity(
	identity: AuthorizationIdentity,
	articleId: string,
) {
	const article = await getArticleForIdentity(identity, articleId);
	const document = parseArticleMarkdown(article.article.bodyMarkdown);
	const baseUrl = getRuntimeEnv().R2_PUBLIC_BASE_URL.replace(/\/$/, "");
	const assets = Object.fromEntries(
		await Promise.all(
			document.media.map(async (reference) => {
				const media = await getMediaAsset(database(), reference.assetId);
				return media
					? [
							reference.assetId,
							{
								publicUrl: `${baseUrl}/${media.r2Key.split("/").map(encodeURIComponent).join("/")}`,
								alt: media.altText,
								caption: media.caption,
								credit: media.credit,
								width: media.width,
								height: media.height,
							},
						]
					: [];
			}),
		),
	) as Record<
		string,
		{
			publicUrl: string;
			alt: string;
			caption: string | null;
			credit: string | null;
			width: number;
			height: number;
		}
	>;
	return { article, document, assets };
}
