import { describe, expect, it } from "vitest";

import {
	createEntityId,
	DomainValidationError,
	normalizeEmail,
	normalizeSearchText,
	normalizeSlug,
	validateArticleFormat,
	validateEmbedUrl,
	validatePublication,
	validateScoreAndVerdict,
} from "./index.js";

describe("domain package", () => {
	it("normalizes e-mail, slug and search text", () => {
		expect(normalizeEmail("  Équipe@Example.COM ")).toBe("équipe@example.com");
		expect(normalizeSlug("  L'été à Montréal ! ")).toBe("lete-a-montreal");
		expect(normalizeSearchText("Été — Jeu vidéo")).toBe("ete jeu video");
	});

	it("creates an application-generated UUID", () => {
		expect(createEntityId()).toMatch(/^[0-9a-f-]{36}$/);
	});

	it.each([-1, 21, 1.5, Number.NaN])("rejects invalid score %s", (score) => {
		expect(() => validateScoreAndVerdict(score, "Verdict")).toThrow(
			DomainValidationError,
		);
	});

	it("accepts score boundaries and requires a verdict", () => {
		expect(() => validateScoreAndVerdict(0, "Très mauvais")).not.toThrow();
		expect(() => validateScoreAndVerdict(20, "Excellent")).not.toThrow();
		expect(() => validateScoreAndVerdict(10, " ")).toThrow(/verdict/i);
		expect(() => validateScoreAndVerdict(null, null)).not.toThrow();
	});

	it("enforces publication formats", () => {
		expect(() =>
			validateArticleFormat({
				type: "review",
				primaryGameId: "g1",
				scoreHalfSteps: 15,
				verdict: "Bien",
			}),
		).not.toThrow();
		expect(() =>
			validateArticleFormat({ type: "review", scoreHalfSteps: null }),
		).toThrow(/jeu principal/i);
		expect(() =>
			validateArticleFormat({
				type: "first_impression",
				primaryGameId: "g1",
				scoreHalfSteps: 0,
			}),
		).toThrow(/seule une review/i);
		expect(() =>
			validateArticleFormat({
				type: "first_impression",
				primaryGameId: "g1",
				scoreHalfSteps: null,
				finalReview: { status: "published", primaryGameId: "g2" },
			}),
		).toThrow(/même jeu/i);
		expect(() =>
			validateArticleFormat({
				type: "first_impression",
				primaryGameId: "g1",
				scoreHalfSteps: null,
				finalReview: { status: "published", primaryGameId: "g1" },
			}),
		).not.toThrow();
	});

	it("accepts only HTTPS URLs from the embed allowlist", () => {
		expect(
			validateEmbedUrl("https://www.youtube.com/watch?v=abc", "youtube"),
		).toContain("youtube.com");
		expect(() =>
			validateEmbedUrl("http://youtube.com/watch?v=abc", "youtube"),
		).toThrow(/HTTPS/i);
		expect(() =>
			validateEmbedUrl("https://example.com/video", "youtube"),
		).toThrow(/fournisseur/i);
	});

	it("validates all publication prerequisites and disclosure", () => {
		const valid = {
			type: "review" as const,
			primaryGameId: "g1",
			scoreHalfSteps: 16,
			verdict: "Solide",
			authorStatus: "active" as const,
			title: "Une review",
			excerpt: "Un chapô",
			bodyMarkdown: "Un corps",
			heroMediaId: "m1",
			hasMaterialBenefit: false,
		};
		expect(() => validatePublication(valid)).not.toThrow();
		expect(() =>
			validatePublication({ ...valid, authorStatus: "disabled" }),
		).toThrow(/actif/i);
		expect(() => validatePublication({ ...valid, heroMediaId: null })).toThrow(
			/couverture/i,
		);
		expect(() =>
			validatePublication({ ...valid, hasMaterialBenefit: true }),
		).toThrow(/divulgation/i);
		expect(() =>
			validatePublication({ ...valid, links: [{ isAffiliate: true }] }),
		).toThrow(/divulgation/i);
	});
});
