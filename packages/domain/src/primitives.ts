import { z } from "zod";

import { domainError } from "./errors.js";

export const authorRoles = ["admin", "author"] as const;
export const authorStatuses = ["active", "disabled"] as const;
export const articleTypes = ["review", "first_impression", "article"] as const;
export const publicationStatuses = ["draft", "published"] as const;
export const releaseDatePrecisions = [
	"day",
	"month",
	"year",
	"unknown",
] as const;
export const embedTypes = ["video", "music"] as const;
export const embedProviders = [
	"youtube",
	"vimeo",
	"spotify",
	"apple_music",
	"youtube_music",
	"bandcamp",
	"soundcloud",
] as const;

export const authorRoleSchema = z.enum(authorRoles);
export const authorStatusSchema = z.enum(authorStatuses);
export const articleTypeSchema = z.enum(articleTypes);
export const publicationStatusSchema = z.enum(publicationStatuses);
export const releaseDatePrecisionSchema = z.enum(releaseDatePrecisions);
export const embedTypeSchema = z.enum(embedTypes);
export const embedProviderSchema = z.enum(embedProviders);

export type AuthorRole = z.infer<typeof authorRoleSchema>;
export type AuthorStatus = z.infer<typeof authorStatusSchema>;
export type ArticleType = z.infer<typeof articleTypeSchema>;
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;
export type ReleaseDatePrecision = z.infer<typeof releaseDatePrecisionSchema>;
export type EmbedType = z.infer<typeof embedTypeSchema>;
export type EmbedProvider = z.infer<typeof embedProviderSchema>;
export type EntityId = string & { readonly __brand: "JouzyEntityId" };

export const scoreHalfStepsSchema = z.number().int().min(0).max(20).nullable();

export function createEntityId(): EntityId {
	return crypto.randomUUID() as EntityId;
}

export function normalizeEmail(value: string): string {
	const normalized = value.trim().toLowerCase();
	if (
		!z.email({ pattern: z.regexes.unicodeEmail }).safeParse(normalized).success
	) {
		throw domainError("INVALID_VALUE", "L’adresse e-mail est invalide.", {
			field: "email",
		});
	}
	return normalized;
}

function stripDiacritics(value: string): string {
	return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeSlug(value: string): string {
	const normalized = stripDiacritics(value.trim().toLowerCase())
		.replace(/['’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	if (normalized.length === 0) {
		throw domainError("INVALID_VALUE", "Le slug ne peut pas être vide.", {
			field: "slug",
		});
	}
	return normalized;
}

export function normalizeSearchText(value: string): string {
	return stripDiacritics(value)
		.toLocaleLowerCase("fr-FR")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim()
		.replace(/\s+/g, " ");
}

export function validateScoreAndVerdict(
	scoreHalfSteps: number | null,
	verdict: string | null | undefined,
): void {
	const parsed = scoreHalfStepsSchema.safeParse(scoreHalfSteps);
	if (!parsed.success) {
		throw domainError(
			"INVALID_SCORE",
			"La note doit être nulle ou comprise entre 0 et 20 demi-points.",
			{
				field: "scoreHalfSteps",
			},
		);
	}
	if (scoreHalfSteps !== null && verdict?.trim().length === 0) {
		throw domainError("INVALID_SCORE", "Une note exige un verdict non vide.", {
			field: "verdict",
		});
	}
}

const providerHosts: Readonly<Record<EmbedProvider, readonly string[]>> = {
	youtube: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
	vimeo: ["vimeo.com", "player.vimeo.com"],
	spotify: ["spotify.com", "open.spotify.com"],
	apple_music: ["music.apple.com"],
	youtube_music: ["music.youtube.com"],
	bandcamp: ["bandcamp.com"],
	soundcloud: ["soundcloud.com"],
};

function hostMatches(hostname: string, host: string): boolean {
	return hostname === host || hostname.endsWith(`.${host}`);
}

export function validateHttpsUrl(value: string): string {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw domainError("INVALID_URL", "L’URL est invalide.", { field: "url" });
	}
	if (url.protocol !== "https:" || url.username || url.password) {
		throw domainError(
			"INVALID_URL",
			"Seules les URL HTTPS publiques sont acceptées.",
			{
				field: "url",
			},
		);
	}
	return url.toString();
}

export function validateEmbedUrl(
	value: string,
	provider: EmbedProvider,
): string {
	const canonicalUrl = validateHttpsUrl(value);
	const hostname = new URL(canonicalUrl).hostname.toLowerCase();
	if (!providerHosts[provider].some((host) => hostMatches(hostname, host))) {
		throw domainError(
			"INVALID_URL",
			"L’URL ne correspond pas au fournisseur autorisé.",
			{
				field: "url",
				provider,
			},
		);
	}
	return canonicalUrl;
}
