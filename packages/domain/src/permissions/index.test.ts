import { describe, expect, it } from "vitest";

import {
	type AuthorizationIdentity,
	canManageAuthors,
	canManageReferenceData,
	canMutateArticle,
	canReadArticle,
} from "./index.js";

const admin: AuthorizationIdentity = {
	authorId: "admin-1",
	email: "admin@example.com",
	role: "admin",
	status: "active",
	displayName: "Admin",
};
const author: AuthorizationIdentity = {
	authorId: "author-1",
	email: "author@example.com",
	role: "author",
	status: "active",
	displayName: "Auteur",
};
const disabled = { ...author, status: "disabled" as const };

describe("authorization policy", () => {
	it("keeps reference data and author management admin-only", () => {
		expect(canManageAuthors(admin)).toBe(true);
		expect(canManageReferenceData(admin)).toBe(true);
		expect(canManageAuthors(author)).toBe(false);
		expect(canManageReferenceData(author)).toBe(false);
		expect(canManageAuthors(disabled)).toBe(false);
	});

	it("enforces article ownership for authors and permits every article to admins", () => {
		expect(canReadArticle(admin, "someone")).toBe(true);
		expect(canMutateArticle(admin, "someone")).toBe(true);
		expect(canReadArticle(author, "author-1")).toBe(true);
		expect(canMutateArticle(author, "author-1")).toBe(true);
		expect(canReadArticle(author, "someone")).toBe(false);
		expect(canMutateArticle(author, "someone")).toBe(false);
		expect(canReadArticle(disabled, "author-1")).toBe(false);
	});
});
