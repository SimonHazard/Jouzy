import {
	createGenre,
	createPlatform,
	createTag,
	listGenres,
	listPlatforms,
	listTags,
	updateGenre,
	updatePlatform,
	updateTag,
} from "@jouzy/db/queries/admin";
import {
	assertCanManageReferenceData,
	parseTaxonomyInput,
} from "@jouzy/domain";
import { createServerFn } from "@tanstack/react-start";
import { getDatabase } from "../../server/db.js";
import { authMiddleware } from "../auth/server-functions.js";

export const listTaxonomiesFn = createServerFn()
	.middleware([authMiddleware])
	.handler(async () =>
		Promise.all([
			listPlatforms(getDatabase()),
			listGenres(getDatabase()),
			listTags(getDatabase()),
		]),
	);

export const createTaxonomyFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		(input: { kind: "platform" | "genre" | "tag"; values: unknown }) => ({
			kind: input.kind,
			values: parseTaxonomyInput(input.values),
		}),
	)
	.handler(async ({ data, context }) => {
		assertCanManageReferenceData(context.identity);
		const db = getDatabase();
		if (data.kind === "platform") return createPlatform(db, data.values);
		if (data.kind === "genre") return createGenre(db, data.values);
		return createTag(db, data.values);
	});

export const updateTaxonomyFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		(input: {
			kind: "platform" | "genre" | "tag";
			id: string;
			values: unknown;
		}) => ({
			kind: input.kind,
			id: input.id,
			values: parseTaxonomyInput(input.values),
		}),
	)
	.handler(async ({ data, context }) => {
		assertCanManageReferenceData(context.identity);
		const db = getDatabase();
		if (data.kind === "platform")
			return updatePlatform(db, data.id, data.values);
		if (data.kind === "genre") return updateGenre(db, data.id, data.values);
		return updateTag(db, data.id, data.values);
	});
