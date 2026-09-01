import { describe, expect, it } from "vitest";

import {
	AdminQueryError,
	conflict,
	notFound,
	throwDatabaseConflict,
} from "./errors.js";

describe("admin query errors", () => {
	it("maps database uniqueness failures to a safe conflict", () => {
		expect(() =>
			throwDatabaseConflict(
				new Error("UNIQUE constraint failed: authors.email"),
				"email",
			),
		).toThrowError(AdminQueryError);
		expect(() =>
			throwDatabaseConflict(
				new Error("UNIQUE constraint failed: authors.email"),
				"email",
			),
		).toThrow("Cette valeur est déjà utilisée");
	});

	it("preserves application query errors", () => {
		const alreadyConflict = conflict("slug");
		const missing = notFound();

		expect(() => throwDatabaseConflict(alreadyConflict)).toThrow(
			alreadyConflict,
		);
		expect(() => throwDatabaseConflict(missing)).toThrow(missing);
	});
});
