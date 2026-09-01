export type DomainErrorCode =
	| "INVALID_VALUE"
	| "INVALID_SCORE"
	| "INVALID_FORMAT"
	| "INVALID_URL"
	| "INVALID_PUBLICATION";

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
