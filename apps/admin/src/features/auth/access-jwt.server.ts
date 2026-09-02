import { normalizeEmail } from "@jouzy/domain";
import {
	createRemoteJWKSet,
	type JWTPayload,
	type JWTVerifyGetKey,
	jwtVerify,
	type KeyInput,
} from "jose";

import { AdminAuthError } from "./errors.js";

export interface AccessJwtIdentity {
	email: string;
}

export interface AccessJwtConfig {
	teamDomain: string;
	audience: string;
	jwks?: KeyInput | JWTVerifyGetKey;
}

interface AccessJwtClaims extends JWTPayload {
	email?: unknown;
}

type RemoteJwks = ReturnType<typeof createRemoteJWKSet>;
const remoteJwksByDomain = new Map<string, RemoteJwks>();

function issuerFromTeamDomain(teamDomain: string): string {
	try {
		const url = new URL(teamDomain);
		if (url.protocol !== "https:" || url.username || url.password) {
			throw new Error("invalid team domain");
		}
		return url.origin;
	} catch {
		throw new AdminAuthError(
			"AUTH_UNAVAILABLE",
			"La configuration Cloudflare Access est indisponible.",
			503,
		);
	}
}

function getRemoteJwks(issuer: string): RemoteJwks {
	const cached = remoteJwksByDomain.get(issuer);
	if (cached) return cached;
	const created = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", issuer));
	remoteJwksByDomain.set(issuer, created);
	return created;
}

export async function verifyAccessJwt(
	token: string,
	config: AccessJwtConfig,
): Promise<AccessJwtIdentity> {
	if (!token.trim() || !config.audience.trim()) {
		throw new AdminAuthError(
			"UNAUTHORIZED",
			"Le jeton Cloudflare Access est invalide.",
			401,
		);
	}

	const issuer = issuerFromTeamDomain(config.teamDomain);
	const key = config.jwks ?? getRemoteJwks(issuer);
	try {
		const { payload } = await jwtVerify<AccessJwtClaims>(token, key, {
			issuer,
			audience: config.audience,
			algorithms: ["RS256"],
			requiredClaims: ["exp", "iss", "aud"],
		});
		if (
			typeof payload.email !== "string" ||
			payload.email.trim().length === 0
		) {
			throw new AdminAuthError(
				"UNAUTHORIZED",
				"Le jeton Cloudflare Access ne contient pas d’identité exploitable.",
				401,
			);
		}
		return { email: normalizeEmail(payload.email) };
	} catch (error) {
		if (error instanceof AdminAuthError) throw error;
		throw new AdminAuthError(
			"UNAUTHORIZED",
			"Le jeton Cloudflare Access est invalide ou expiré.",
			401,
		);
	}
}
