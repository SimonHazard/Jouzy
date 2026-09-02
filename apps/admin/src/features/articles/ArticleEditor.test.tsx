import { describe, expect, it } from "vitest";
import { applyMarkdownCommand } from "./ArticleEditor.js";

describe("textarea markdown commands", () => {
	it("wraps a selection and keeps its selected range", () => {
		expect(applyMarkdownCommand("Bonjour", 0, 7, "bold")).toEqual({
			source: "**Bonjour**",
			start: 2,
			end: 9,
		});
		expect(
			applyMarkdownCommand("texte", 0, 5, "link", "https://example.com"),
		).toEqual({ source: "[texte](https://example.com)", start: 1, end: 6 });
	});

	it("prefixes multiple lines for lists and quotes", () => {
		expect(applyMarkdownCommand("un\ndeux", 0, 7, "list").source).toBe(
			"- un\n- deux",
		);
		expect(applyMarkdownCommand("un\ndeux", 0, 7, "quote").source).toBe(
			"> un\n> deux",
		);
	});
});
