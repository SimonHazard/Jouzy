import { generateKeyPair, type KeyInput, SignJWT } from "jose";
import { describe, expect, it } from "vitest";

import { verifyAccessJwt } from "./access-jwt.server.js";

const config = {
	teamDomain: "https://jouzy.cloudflareaccess.com",
	audience: "jouzy-admin-audience",
};

async function makeToken(
	privateKey: KeyInput,
	claims: { expiration?: string } = {},
): Promise<string> {
	return new SignJWT({ email: " Writer@Example.com", ...claims })
		.setProtectedHeader({ alg: "RS256", typ: "JWT" })
		.setIssuer(config.teamDomain)
		.setAudience(config.audience)
		.setIssuedAt()
		.setExpirationTime(claims.expiration ?? "10m")
		.sign(privateKey);
}

describe("Cloudflare Access JWT", () => {
	it("validates a token with an injected local JWKS without network access", async () => {
		const { privateKey, publicKey } = await generateKeyPair("RS256");
		const identity = await verifyAccessJwt(await makeToken(privateKey), {
			...config,
			jwks: publicKey,
		});
		expect(identity).toEqual({ email: "writer@example.com" });
	});

	it.each([
		["expired", { expiration: "0s" }],
		["wrong issuer", { issuer: "https://other.cloudflareaccess.com" }],
		["wrong audience", { audience: "other-audience" }],
	])("rejects a token with %s claims", async (_label, changes) => {
		const { privateKey, publicKey } = await generateKeyPair("RS256");
		let builder = new SignJWT({ email: "writer@example.com" })
			.setProtectedHeader({ alg: "RS256" })
			.setIssuedAt();
		builder = builder
			.setIssuer("issuer" in changes ? changes.issuer : config.teamDomain)
			.setAudience("audience" in changes ? changes.audience : config.audience);
		const token = await builder
			.setExpirationTime("expiration" in changes ? changes.expiration : "10m")
			.sign(privateKey);
		await expect(
			verifyAccessJwt(token, { ...config, jwks: publicKey }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("rejects a bad signature and a missing e-mail claim", async () => {
		const first = await generateKeyPair("RS256");
		const second = await generateKeyPair("RS256");
		await expect(
			verifyAccessJwt(await makeToken(first.privateKey), {
				...config,
				jwks: second.publicKey,
			}),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
		const token = await new SignJWT({})
			.setProtectedHeader({ alg: "RS256" })
			.setIssuer(config.teamDomain)
			.setAudience(config.audience)
			.setIssuedAt()
			.setExpirationTime("10m")
			.sign(first.privateKey);
		await expect(
			verifyAccessJwt(token, { ...config, jwks: first.publicKey }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});
