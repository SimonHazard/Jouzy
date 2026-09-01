import { domainError } from "./errors.js";
import {
	type ArticleType,
	type AuthorStatus,
	articleTypeSchema,
	validateScoreAndVerdict,
} from "./primitives.js";

export interface FinalReviewReference {
	status: "published" | "draft";
	primaryGameId: string | null;
}

export interface ArticleLinkForValidation {
	isAffiliate: boolean;
}

export interface ArticleFormatInput {
	type: ArticleType;
	primaryGameId?: string | null;
	scoreHalfSteps: number | null;
	verdict?: string | null;
	finalReview?: FinalReviewReference | null;
}

export function validateArticleFormat(input: ArticleFormatInput): void {
	const type = articleTypeSchema.safeParse(input.type);
	if (!type.success) {
		throw domainError(
			"INVALID_FORMAT",
			"Le format de publication est invalide.",
			{
				field: "type",
			},
		);
	}
	validateScoreAndVerdict(input.scoreHalfSteps, input.verdict);

	if (
		(input.type === "review" || input.type === "first_impression") &&
		!input.primaryGameId
	) {
		throw domainError("INVALID_FORMAT", "Ce format exige un jeu principal.", {
			field: "primaryGameId",
		});
	}
	if (input.type !== "review" && input.scoreHalfSteps !== null) {
		throw domainError(
			"INVALID_FORMAT",
			"Seule une review peut avoir une note.",
			{
				field: "scoreHalfSteps",
			},
		);
	}
	if (
		input.type !== "first_impression" &&
		input.finalReview !== undefined &&
		input.finalReview !== null
	) {
		throw domainError(
			"INVALID_FORMAT",
			"La review finale ne concerne que les premières impressions.",
			{
				field: "finalReview",
			},
		);
	}
	if (input.type === "first_impression" && input.finalReview) {
		if (
			input.finalReview.status !== "published" ||
			input.finalReview.primaryGameId !== input.primaryGameId
		) {
			throw domainError(
				"INVALID_FORMAT",
				"La review finale doit être publiée et porter sur le même jeu.",
				{ field: "finalReview" },
			);
		}
	}
}

export interface PublicationValidationInput extends ArticleFormatInput {
	authorStatus: AuthorStatus;
	title: string;
	excerpt: string;
	bodyMarkdown: string;
	heroMediaId: string | null;
	hasMaterialBenefit: boolean;
	disclosure?: string | null;
	links?: readonly ArticleLinkForValidation[];
}

export function validatePublication(input: PublicationValidationInput): void {
	validateArticleFormat(input);
	if (input.authorStatus !== "active") {
		throw domainError(
			"INVALID_PUBLICATION",
			"Seul un auteur actif peut publier.",
			{
				field: "authorStatus",
			},
		);
	}
	if (input.title.trim().length === 0 || input.title.trim().length > 240) {
		throw domainError(
			"INVALID_PUBLICATION",
			"Le titre est requis et doit rester inférieur à 240 caractères.",
			{
				field: "title",
			},
		);
	}
	if (input.excerpt.trim().length === 0 || input.excerpt.trim().length > 500) {
		throw domainError(
			"INVALID_PUBLICATION",
			"Le chapô est requis et doit rester inférieur à 500 caractères.",
			{
				field: "excerpt",
			},
		);
	}
	if (input.bodyMarkdown.trim().length === 0) {
		throw domainError(
			"INVALID_PUBLICATION",
			"Le corps de la publication est requis.",
			{
				field: "bodyMarkdown",
			},
		);
	}
	if (!input.heroMediaId) {
		throw domainError(
			"INVALID_PUBLICATION",
			"Une couverture est requise pour publier.",
			{
				field: "heroMediaId",
			},
		);
	}
	const hasAffiliateLink =
		input.links?.some((link) => link.isAffiliate) ?? false;
	if (
		(input.hasMaterialBenefit || hasAffiliateLink) &&
		!input.disclosure?.trim()
	) {
		throw domainError(
			"INVALID_PUBLICATION",
			"Une divulgation est requise pour cet avantage ou lien affilié.",
			{
				field: "disclosure",
			},
		);
	}
}
