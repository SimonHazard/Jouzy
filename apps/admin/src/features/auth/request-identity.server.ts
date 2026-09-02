import type {
	AdminDatabase,
	AuthorIdentityRecord,
} from "@jouzy/db/queries/admin";
import type { AuthorizationIdentity } from "@jouzy/domain";
import { normalizeEmail } from "@jouzy/domain";

import {
	type AccessJwtConfig,
	type AccessJwtIdentity,
	verifyAccessJwt,
} from "./access-jwt.server.js";
import { AdminAuthError } from "./errors.js";

export interface AdminAuthEnvironment {
	ENVIRONMENT: string;
	ACCESS_TEAM_DOMAIN?: string;
	ACCESS_AUD?: string;
	DEV_AUTH_EMAIL?: string;
}

export type AuthorLookup = (
	db: AdminDatabase,
	email: string,
) => Promise<AuthorIdentityRecord | null>;

export interface RequestIdentityOptions {
	request: Request;
	database: AdminDatabase;
	environment: AdminAuthEnvironment;
	findAuthor: AuthorLookup;
	verifyToken?: (
		token: string,
		config: AccessJwtConfig,
	) => Promise<AccessJwtIdentity>;
}

export async function resolveRequestIdentity({
	request,
	database,
	environment,
	findAuthor,
	verifyToken = verifyAccessJwt,
}: RequestIdentityOptions): Promise<AuthorizationIdentity> {
	const devEmail = environment.DEV_AUTH_EMAIL?.trim();
	if (devEmail && environment.ENVIRONMENT !== "development") {
		throw new AdminAuthError(
			"AUTH_UNAVAILABLE",
			"La configuration d’authentification locale est interdite dans cet environnement.",
			503,
		);
	}

	const token = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
	let email: string;
	if (token) {
		if (!environment.ACCESS_TEAM_DOMAIN || !environment.ACCESS_AUD) {
			throw new AdminAuthError(
				"AUTH_UNAVAILABLE",
				"La configuration Cloudflare Access est indisponible.",
				503,
			);
		}
		const identity = await verifyToken(token, {
			teamDomain: environment.ACCESS_TEAM_DOMAIN,
			audience: environment.ACCESS_AUD,
		});
		try {
			email = normalizeEmail(identity.email);
		} catch {
			throw new AdminAuthError(
				"UNAUTHORIZED",
				"Le jeton Cloudflare Access contient une identité invalide.",
				401,
			);
		}
	} else if (environment.ENVIRONMENT === "development" && devEmail) {
		try {
			email = normalizeEmail(devEmail);
		} catch {
			throw new AdminAuthError(
				"AUTH_UNAVAILABLE",
				"La configuration de l’identité locale est invalide.",
				503,
			);
		}
	} else {
		throw new AdminAuthError(
			"UNAUTHORIZED",
			"Une authentification Cloudflare Access est requise.",
			401,
		);
	}

	const author = await findAuthor(database, email);
	if (author?.status !== "active") {
		throw new AdminAuthError(
			"FORBIDDEN",
			"Votre profil Jouzy n’est pas autorisé à accéder à cet espace.",
			403,
		);
	}
	return {
		authorId: author.id,
		email: author.email,
		role: author.role,
		status: author.status,
		displayName: author.displayName,
	};
}
