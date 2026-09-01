export type AdminQueryErrorCode = "CONFLICT" | "NOT_FOUND";

export class AdminQueryError extends Error {
	readonly name = "AdminQueryError";

	constructor(
		readonly code: AdminQueryErrorCode,
		message: string,
		readonly field?: string,
	) {
		super(message);
	}
}

export function conflict(field?: string): AdminQueryError {
	return new AdminQueryError(
		"CONFLICT",
		"Cette valeur est déjà utilisée ou cette ressource est encore référencée.",
		field,
	);
}

export function notFound(): AdminQueryError {
	return new AdminQueryError(
		"NOT_FOUND",
		"La ressource demandée est introuvable.",
	);
}

export function throwDatabaseConflict(error: unknown, field?: string): never {
	if (
		error instanceof AdminQueryError &&
		(error.code === "CONFLICT" || error.code === "NOT_FOUND")
	) {
		throw error;
	}
	const message = error instanceof Error ? error.message.toLowerCase() : "";
	if (message.includes("unique") || message.includes("constraint")) {
		throw conflict(field);
	}
	throw error;
}
