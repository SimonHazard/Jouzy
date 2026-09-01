import type { AuthorIdentityRecord } from "@jouzy/db/queries/admin";
import { describe, expect, it, vi } from "vitest";

import { AdminAuthError } from "./errors.js";
import { resolveRequestIdentity } from "./request-identity.server.js";

const author: AuthorIdentityRecord = {
	id: "author-1",
	email: "author@example.com",
	role: "author",
	status: "active",
	displayName: "Auteur",
};
const database = {} as never;
const request = (headers?: HeadersInit) =>
	new Request("https://admin.example.com/", { headers });

describe("request identity resolution", () => {
	it("rejects a missing production header", async () => {
		await expect(
			resolveRequestIdentity({
				request: request(),
				database,
				environment: { ENVIRONMENT: "production" },
				findAuthor: vi.fn(),
			}),
		).rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
	});

	it("resolves active authors and admins through the D1 lookup", async () => {
		const findAuthor = vi.fn(async () => author);
		const result = await resolveRequestIdentity({
			request: request({ "Cf-Access-Jwt-Assertion": "opaque-token" }),
			database,
			environment: {
				ENVIRONMENT: "production",
				ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
				ACCESS_AUD: "aud",
			},
			findAuthor,
			verifyToken: vi.fn(async () => ({ email: "AUTHOR@example.com" })),
		});
		expect(result).toEqual({
			authorId: author.id,
			email: author.email,
			role: author.role,
			status: author.status,
			displayName: author.displayName,
		});
		expect(findAuthor).toHaveBeenCalledWith(database, "author@example.com");
	});

	it("rejects absent and disabled profiles", async () => {
		for (const profile of [null, { ...author, status: "disabled" as const }]) {
			await expect(
				resolveRequestIdentity({
					request: request({ "Cf-Access-Jwt-Assertion": "token" }),
					database,
					environment: {
						ENVIRONMENT: "production",
						ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
						ACCESS_AUD: "aud",
					},
					findAuthor: vi.fn(async () => profile),
					verifyToken: vi.fn(async () => ({ email: author.email })),
				}),
			).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
		}
	});

	it("allows the explicit development bypass and forbids it elsewhere", async () => {
		const findAuthor = vi.fn(async () => author);
		await expect(
			resolveRequestIdentity({
				request: request(),
				database,
				environment: {
					ENVIRONMENT: "development",
					DEV_AUTH_EMAIL: " Author@Example.com ",
				},
				findAuthor,
			}),
		).resolves.toEqual({
			authorId: author.id,
			email: author.email,
			role: author.role,
			status: author.status,
			displayName: author.displayName,
		});
		const error = await resolveRequestIdentity({
			request: request(),
			database,
			environment: {
				ENVIRONMENT: "production",
				DEV_AUTH_EMAIL: "author@example.com",
			},
			findAuthor,
		}).catch((value: unknown) => value);
		expect(error).toBeInstanceOf(AdminAuthError);
		expect(error).toMatchObject({ code: "AUTH_UNAVAILABLE", status: 503 });
	});
});
