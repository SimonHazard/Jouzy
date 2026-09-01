import { describe, expect, it } from "vitest";

import { getNavigationItems } from "./admin-shell.js";

const identity = (role: "admin" | "author") => ({
	authorId: "id",
	email: "person@example.com",
	role,
	status: "active" as const,
	displayName: "Personne",
});

describe("admin navigation", () => {
	it("shows author management to admins only", () => {
		expect(
			getNavigationItems(identity("admin")).map((item) => item.label),
		).toContain("Auteurs");
		expect(
			getNavigationItems(identity("author")).map((item) => item.label),
		).not.toContain("Auteurs");
	});
});
