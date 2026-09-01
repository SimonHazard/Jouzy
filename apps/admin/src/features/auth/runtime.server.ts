import { env } from "cloudflare:workers";

import { findAuthorByEmail } from "@jouzy/db/queries/admin";

import { getDatabase } from "../../server/db.js";
import {
	type AdminAuthEnvironment,
	resolveRequestIdentity,
} from "./request-identity.server.js";

type RuntimeEnvironment = Cloudflare.Env & AdminAuthEnvironment;

export async function resolveRuntimeIdentity(request: Request) {
	return resolveRequestIdentity({
		request,
		database: getDatabase(),
		environment: env as RuntimeEnvironment,
		findAuthor: findAuthorByEmail,
	});
}
