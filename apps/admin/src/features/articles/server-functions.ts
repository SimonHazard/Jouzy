import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "../auth/server-functions.js";
import {
	articleFormOptions,
	createDraft,
	createPublished,
	getArticleForIdentity,
	getPreviewForIdentity,
	listArticlesForIdentity,
	publish,
	saveDraft,
	unpublish,
} from "./article-service.server.js";

const protectedArticles = createServerFn().middleware([authMiddleware]);

export const listArticlesFn = protectedArticles.handler(({ context }) =>
	listArticlesForIdentity(context.identity),
);
export const articleFormOptionsFn = protectedArticles.handler(({ context }) =>
	articleFormOptions(context.identity),
);
export const getArticleFn = protectedArticles
	.validator((input: { articleId: string }) => input)
	.handler(({ data, context }) =>
		getArticleForIdentity(context.identity, data.articleId),
	);
export const getArticlePreviewFn = protectedArticles
	.validator((input: { articleId: string }) => input)
	.handler(({ data, context }) =>
		getPreviewForIdentity(context.identity, data.articleId),
	);
export const createArticleFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => input)
	.handler(({ data, context }) => createDraft(context.identity, data));
export const createPublishedArticleFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => input)
	.handler(({ data, context }) => createPublished(context.identity, data));
export const saveArticleFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: { articleId: string; values: unknown }) => input)
	.handler(({ data, context }) =>
		saveDraft(context.identity, data.articleId, data.values),
	);
export const publishArticleFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: { articleId: string; values: unknown }) => input)
	.handler(({ data, context }) =>
		publish(context.identity, data.articleId, data.values),
	);
export const unpublishArticleFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: { articleId: string }) => input)
	.handler(({ data, context }) => unpublish(context.identity, data.articleId));
