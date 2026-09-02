import { z } from "zod";

import { normalizeEmail, normalizeSlug } from "./primitives.js";

const requiredText = (label: string) =>
	z.string().trim().min(1, `${label} est requis.`).max(500);

export const socialLinkInputSchema = z.object({
	provider: requiredText("Le fournisseur"),
	label: requiredText("Le libellé"),
	url: z
		.url("L’URL est invalide.")
		.refine(
			(value) => value.startsWith("https://"),
			"Seules les URL HTTPS sont acceptées.",
		),
	position: z.number().int().min(0).optional(),
});

export const authorInputSchema = z.object({
	email: z.string().trim().transform(normalizeEmail),
	role: z.enum(["admin", "author"]),
	status: z.enum(["active", "disabled"]),
	firstName: requiredText("Le prénom"),
	lastName: requiredText("Le nom"),
	displayName: requiredText("Le pseudo"),
	slug: z.string().trim().transform(normalizeSlug),
	bio: z.string().trim().max(10_000).default(""),
	publicEmail: z
		.string()
		.trim()
		.transform((value) => (value ? normalizeEmail(value) : null))
		.nullable()
		.optional(),
	avatarMediaId: z.string().min(1).nullable().optional(),
	socialLinks: z.array(socialLinkInputSchema).max(20).default([]),
});

export const taxonomyInputSchema = z.object({
	name: requiredText("Le nom"),
	slug: z.string().trim().transform(normalizeSlug),
	position: z.number().int().min(0).nullable().optional(),
});

export const gameStoreLinkInputSchema = z.object({
	platform: requiredText("La plateforme"),
	provider: requiredText("Le fournisseur"),
	label: requiredText("Le libellé"),
	url: z
		.url("L’URL est invalide.")
		.refine(
			(value) => value.startsWith("https://"),
			"Seules les URL HTTPS sont acceptées.",
		),
	position: z.number().int().min(0).optional(),
});

export const gameInputSchema = z.object({
	title: requiredText("Le titre"),
	slug: z.string().trim().transform(normalizeSlug),
	coverMediaId: z.string().min(1).nullable().optional(),
	developer: z.string().trim().max(300).nullable().optional(),
	publisher: z.string().trim().max(300).nullable().optional(),
	releaseDate: z.string().trim().max(10).nullable().optional(),
	releaseDatePrecision: z
		.enum(["day", "month", "year", "unknown"])
		.nullable()
		.optional(),
	platformIds: z.array(z.string().min(1)).max(30).default([]),
	genreIds: z.array(z.string().min(1)).max(30).default([]),
	storeLinks: z.array(gameStoreLinkInputSchema).max(30).default([]),
});

export type AuthorInput = z.infer<typeof authorInputSchema>;
export type TaxonomyInput = z.infer<typeof taxonomyInputSchema>;
export type GameInput = z.infer<typeof gameInputSchema>;
export type GameStoreLinkInput = z.infer<typeof gameStoreLinkInputSchema>;

export function parseAuthorInput(input: unknown): AuthorInput {
	return authorInputSchema.parse(input);
}

export function parseTaxonomyInput(input: unknown): TaxonomyInput {
	return taxonomyInputSchema.parse(input);
}

export function parseGameInput(input: unknown): GameInput {
	return gameInputSchema.parse(input);
}
