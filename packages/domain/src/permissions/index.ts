import { applicationError } from "../errors.js";
import type { AuthorRole, AuthorStatus } from "../primitives.js";

export interface AuthorizationIdentity {
	authorId: string;
	email: string;
	role: AuthorRole;
	status: AuthorStatus;
	displayName: string;
}

function isActive(identity: AuthorizationIdentity): boolean {
	return identity.status === "active";
}

export function canManageAuthors(identity: AuthorizationIdentity): boolean {
	return isActive(identity) && identity.role === "admin";
}

export function canManageReferenceData(
	identity: AuthorizationIdentity,
): boolean {
	return isActive(identity) && identity.role === "admin";
}

export function canReadArticle(
	identity: AuthorizationIdentity,
	articleAuthorId: string,
): boolean {
	return (
		isActive(identity) &&
		(identity.role === "admin" || identity.authorId === articleAuthorId)
	);
}

export function canMutateArticle(
	identity: AuthorizationIdentity,
	articleAuthorId: string,
): boolean {
	return canReadArticle(identity, articleAuthorId);
}

export function assertPermission(
	allowed: boolean,
	message = "Vous n’avez pas les droits nécessaires pour cette action.",
): void {
	if (!allowed) throw applicationError("FORBIDDEN", message);
}

export function assertCanManageAuthors(identity: AuthorizationIdentity): void {
	assertPermission(canManageAuthors(identity));
}

export function assertCanManageReferenceData(
	identity: AuthorizationIdentity,
): void {
	assertPermission(canManageReferenceData(identity));
}

export function assertCanReadArticle(
	identity: AuthorizationIdentity,
	articleAuthorId: string,
): void {
	assertPermission(canReadArticle(identity, articleAuthorId));
}

export function assertCanMutateArticle(
	identity: AuthorizationIdentity,
	articleAuthorId: string,
): void {
	assertPermission(canMutateArticle(identity, articleAuthorId));
}
