export type AdminAuthErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "AUTH_UNAVAILABLE";

export class AdminAuthError extends Error {
	readonly name = "AdminAuthError";

	constructor(
		readonly code: AdminAuthErrorCode,
		message: string,
		readonly status: 401 | 403 | 503,
	) {
		super(message);
	}
}
