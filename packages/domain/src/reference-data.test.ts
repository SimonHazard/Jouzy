import { describe, expect, it } from "vitest";

import {
	parseAuthorInput,
	parseGameInput,
	parseTaxonomyInput,
} from "./reference-data.js";

describe("reference-data validation", () => {
	it("normalizes author e-mails and slugs", () => {
		const author = parseAuthorInput({
			email: "  Auteur@Example.com ",
			role: "author",
			status: "active",
			firstName: "Élodie",
			lastName: "Durand",
			displayName: "Élodie",
			slug: " Élodie Durand ",
		});
		expect(author.email).toBe("auteur@example.com");
		expect(author.slug).toBe("elodie-durand");
	});

	it("validates bounded taxonomy and game inputs", () => {
		expect(parseTaxonomyInput({ name: "RPG", slug: "rpg" })).toMatchObject({
			name: "RPG",
			slug: "rpg",
		});
		expect(parseGameInput({ title: "Jeu", slug: "jeu" })).toMatchObject({
			title: "Jeu",
			slug: "jeu",
			platformIds: [],
			genreIds: [],
		});
		expect(() => parseTaxonomyInput({ name: "", slug: "" })).toThrow();
	});
});
