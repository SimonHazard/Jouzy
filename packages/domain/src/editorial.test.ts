import { describe, expect, it } from "vitest";
import { parseArticleDraftInput } from "./editorial.js";
import { validateArticleFormat, validatePublication } from "./publication.js";

describe("editorial invariants", () => {
	it("normalizes conditional fields server-side at the service boundary", () => {
		expect(
			parseArticleDraftInput({
				type: "article",
				title: "Titre",
				slug: "Titre",
				excerpt: "",
				bodyMarkdown: "",
				heroMediaId: null,
				scoreHalfSteps: 10,
				verdict: "oui",
				featured: false,
				finalReviewId: null,
				hasMaterialBenefit: false,
				disclosure: null,
				gameIds: [],
				primaryGameId: null,
				tagIds: [],
				links: [],
			}).type,
		).toBe("article");
	});

	it("requires a disclosure for material benefit or affiliate links", () => {
		expect(() =>
			validatePublication({
				type: "article",
				scoreHalfSteps: null,
				primaryGameId: null,
				authorStatus: "active",
				title: "Titre",
				excerpt: "Chapô",
				bodyMarkdown: "Corps",
				heroMediaId: "hero",
				hasMaterialBenefit: true,
				disclosure: null,
				links: [],
			}),
		).toThrow();
		expect(() =>
			validatePublication({
				type: "article",
				scoreHalfSteps: null,
				primaryGameId: null,
				authorStatus: "active",
				title: "Titre",
				excerpt: "Chapô",
				bodyMarkdown: "Corps",
				heroMediaId: "hero",
				hasMaterialBenefit: false,
				disclosure: null,
				links: [{ isAffiliate: true }],
			}),
		).toThrow();
	});

	it("keeps review rules strict", () => {
		expect(() =>
			validateArticleFormat({
				type: "review",
				primaryGameId: null,
				scoreHalfSteps: null,
			}),
		).toThrow();
		expect(() =>
			validateArticleFormat({
				type: "article",
				primaryGameId: null,
				scoreHalfSteps: 10,
			}),
		).toThrow();
	});
});
