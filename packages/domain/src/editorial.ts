import { z } from "zod";
import { normalizeSlug } from "./primitives.js";

const editorialText = (label: string, max: number) =>
	z.string().trim().min(1, `${label} est requis.`).max(max);

export const articleLinkInputSchema = z.object({
	provider: editorialText("Le fournisseur", 100),
	label: editorialText("Le libellé", 200),
	url: z
		.string()
		.trim()
		.url("L’URL est invalide.")
		.refine(
			(value) => value.startsWith("https://"),
			"Seules les URL HTTPS sont acceptées.",
		),
	isAffiliate: z.boolean().default(false),
});

export const articleDraftInputSchema = z.object({
	type: z.enum(["review", "first_impression", "article"]),
	title: editorialText("Le titre", 240),
	slug: z.string().trim().transform(normalizeSlug),
	excerpt: z.string().trim().max(500),
	bodyMarkdown: z.string().max(500_000),
	heroMediaId: z.string().min(1).nullable(),
	scoreHalfSteps: z.number().int().min(0).max(20).nullable(),
	verdict: z.string().trim().max(5_000).nullable(),
	featured: z.boolean().default(false),
	finalReviewId: z.string().min(1).nullable(),
	hasMaterialBenefit: z.boolean().default(false),
	disclosure: z.string().trim().max(2_000).nullable(),
	authorId: z.string().min(1).optional(),
	gameIds: z.array(z.string().min(1)).max(20).default([]),
	primaryGameId: z.string().min(1).nullable(),
	tagIds: z.array(z.string().min(1)).max(30).default([]),
	links: z.array(articleLinkInputSchema).max(30).default([]),
});

export type ArticleDraftInput = z.infer<typeof articleDraftInputSchema>;

export function parseArticleDraftInput(input: unknown): ArticleDraftInput {
	return articleDraftInputSchema.parse(input);
}

export const mediaUploadInputSchema = z.object({
	altText: editorialText("Le texte alternatif", 500),
	caption: z.string().trim().max(500).nullable().optional(),
	credit: z.string().trim().max(300).nullable().optional(),
});

export type MediaUploadInput = z.infer<typeof mediaUploadInputSchema>;

export function parseMediaUploadInput(input: unknown): MediaUploadInput {
	return mediaUploadInputSchema.parse(input);
}
