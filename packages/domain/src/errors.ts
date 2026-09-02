export type DomainErrorCode =
	| "INVALID_VALUE"
	| "INVALID_SCORE"
	| "INVALID_FORMAT"
	| "INVALID_URL"
	| "INVALID_PUBLICATION"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "CONFLICT"
	| "UNAUTHORIZED"
	| "AUTH_UNAVAILABLE";

export class DomainValidationError extends Error {
	readonly name = "DomainValidationError";

	constructor(
		readonly code: DomainErrorCode,
		message: string,
		readonly details: Readonly<Record<string, unknown>> = {},
	) {
		super(message);
	}
}

export function domainError(
	code: DomainErrorCode,
	message: string,
	details: Readonly<Record<string, unknown>> = {},
): DomainValidationError {
	return new DomainValidationError(code, message, details);
}

export class JouzyApplicationError extends Error {
	readonly name = "JouzyApplicationError";

	constructor(
		readonly code: Extract<
			DomainErrorCode,
			| "FORBIDDEN"
			| "NOT_FOUND"
			| "CONFLICT"
			| "UNAUTHORIZED"
			| "AUTH_UNAVAILABLE"
		>,
		message: string,
		readonly details: Readonly<Record<string, unknown>> = {},
	) {
		super(message);
	}
}

export function applicationError(
	code: JouzyApplicationError["code"],
	message: string,
	details: Readonly<Record<string, unknown>> = {},
): JouzyApplicationError {
	return new JouzyApplicationError(code, message, details);
}
