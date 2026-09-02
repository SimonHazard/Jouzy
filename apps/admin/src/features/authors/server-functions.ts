import {
	createAuthor,
	disableAuthor,
	getAuthorForAdmin,
	listAuthors,
	updateAuthor,
} from "@jouzy/db/queries/admin";
import { assertCanManageAuthors, parseAuthorInput } from "@jouzy/domain";
import { createServerFn } from "@tanstack/react-start";
import { getDatabase } from "../../server/db.js";
import { authMiddleware } from "../auth/server-functions.js";

const protectedAuthors = createServerFn().middleware([authMiddleware]);

export const listAuthorsFn = protectedAuthors.handler(async ({ context }) => {
	assertCanManageAuthors(context.identity);
	return listAuthors(getDatabase());
});

export const getAuthorFn = protectedAuthors
	.validator((input: { authorId: string }) => input)
	.handler(async ({ data, context }) => {
		assertCanManageAuthors(context.identity);
		return getAuthorForAdmin(getDatabase(), data.authorId);
	});

export const createAuthorFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(parseAuthorInput)
	.handler(async ({ data, context }) => {
		assertCanManageAuthors(context.identity);
		return createAuthor(getDatabase(), data);
	});

export const updateAuthorFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: { authorId: string; values: unknown }) => ({
		...input,
		values: parseAuthorInput(input.values),
	}))
	.handler(async ({ data, context }) => {
		assertCanManageAuthors(context.identity);
		return updateAuthor(getDatabase(), data.authorId, data.values);
	});

export const disableAuthorFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: { authorId: string }) => input)
	.handler(async ({ data, context }) => {
		assertCanManageAuthors(context.identity);
		await disableAuthor(getDatabase(), data.authorId);
		return { ok: true };
	});
