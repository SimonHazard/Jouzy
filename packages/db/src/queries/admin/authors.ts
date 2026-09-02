import type { AuthorInput } from "@jouzy/domain";
import { asc, eq } from "drizzle-orm";
import type { D1Transaction, JouzyDatabase } from "../../client.js";
import { authorSocialLinks, authors } from "../../schema/index.js";
import { notFound, throwDatabaseConflict } from "./errors.js";

export type AdminDatabase = JouzyDatabase | D1Transaction;

export type AuthorPublicDto = Omit<typeof authors.$inferSelect, "email"> & {
	socialLinks: Array<typeof authorSocialLinks.$inferSelect>;
};

export type AuthorIdentityRecord = Pick<
	typeof authors.$inferSelect,
	"id" | "email" | "role" | "status" | "displayName"
>;

export type AuthorAdminDto = Omit<AuthorPublicDto, "socialLinks"> & {
	email: string;
	socialLinks: Array<typeof authorSocialLinks.$inferSelect>;
};

const publicAuthorColumns = {
	id: authors.id,
	role: authors.role,
	status: authors.status,
	slug: authors.slug,
	firstName: authors.firstName,
	lastName: authors.lastName,
	displayName: authors.displayName,
	bio: authors.bio,
	avatarMediaId: authors.avatarMediaId,
	publicEmail: authors.publicEmail,
	createdAt: authors.createdAt,
	updatedAt: authors.updatedAt,
};

async function getSocialLinks(
	db: AdminDatabase,
	authorId: string,
): Promise<Array<typeof authorSocialLinks.$inferSelect>> {
	return db
		.select()
		.from(authorSocialLinks)
		.where(eq(authorSocialLinks.authorId, authorId))
		.orderBy(asc(authorSocialLinks.position));
}

export async function findAuthorByEmail(
	db: AdminDatabase,
	email: string,
): Promise<AuthorIdentityRecord | null> {
	const result = await db
		.select({
			id: authors.id,
			email: authors.email,
			role: authors.role,
			status: authors.status,
			displayName: authors.displayName,
		})
		.from(authors)
		.where(eq(authors.email, email))
		.limit(1);
	return result[0] ?? null;
}

export async function findAuthorById(
	db: AdminDatabase,
	authorId: string,
): Promise<AuthorIdentityRecord | null> {
	const result = await db
		.select({
			id: authors.id,
			email: authors.email,
			role: authors.role,
			status: authors.status,
			displayName: authors.displayName,
		})
		.from(authors)
		.where(eq(authors.id, authorId))
		.limit(1);
	return result[0] ?? null;
}

export async function listAuthors(
	db: AdminDatabase,
): Promise<AuthorPublicDto[]> {
	const rows = await db
		.select(publicAuthorColumns)
		.from(authors)
		.orderBy(asc(authors.lastName), asc(authors.firstName));
	return Promise.all(
		rows.map(async (row) => ({
			...row,
			socialLinks: await getSocialLinks(db, row.id),
		})),
	);
}

export async function getAuthor(
	db: AdminDatabase,
	authorId: string,
): Promise<AuthorPublicDto | null> {
	const rows = await db
		.select(publicAuthorColumns)
		.from(authors)
		.where(eq(authors.id, authorId))
		.limit(1);
	const row = rows[0];
	if (!row) return null;
	return { ...row, socialLinks: await getSocialLinks(db, row.id) };
}

export async function getAuthorForAdmin(
	db: AdminDatabase,
	authorId: string,
): Promise<AuthorAdminDto | null> {
	const rows = await db
		.select({ ...publicAuthorColumns, email: authors.email })
		.from(authors)
		.where(eq(authors.id, authorId))
		.limit(1);
	const row = rows[0];
	if (!row) return null;
	return { ...row, socialLinks: await getSocialLinks(db, row.id) };
}

async function insertAuthor(
	db: AdminDatabase,
	input: AuthorInput,
	authorId: string,
	now: number,
): Promise<void> {
	await db.insert(authors).values({
		id: authorId,
		email: input.email,
		role: input.role,
		status: input.status,
		slug: input.slug,
		firstName: input.firstName,
		lastName: input.lastName,
		displayName: input.displayName,
		bio: input.bio,
		avatarMediaId: input.avatarMediaId ?? null,
		publicEmail: input.publicEmail ?? null,
		createdAt: now,
		updatedAt: now,
	});
	if (input.socialLinks.length > 0) {
		await db.insert(authorSocialLinks).values(
			input.socialLinks.map((link, index) => ({
				id: crypto.randomUUID(),
				authorId,
				provider: link.provider,
				label: link.label,
				url: link.url,
				position: link.position ?? index,
			})),
		);
	}
}

export async function createAuthor(
	db: AdminDatabase,
	input: AuthorInput,
	now = Date.now(),
): Promise<AuthorPublicDto> {
	const authorId = crypto.randomUUID();
	try {
		await db.transaction((tx) => insertAuthor(tx, input, authorId, now));
	} catch (error) {
		throwDatabaseConflict(error, "email");
	}
	const author = await getAuthor(db, authorId);
	if (!author) throw notFound();
	return author;
}

export async function updateAuthor(
	db: AdminDatabase,
	authorId: string,
	input: AuthorInput,
	now = Date.now(),
): Promise<AuthorPublicDto> {
	try {
		await db.transaction(async (tx) => {
			const existing = await tx
				.select({ id: authors.id })
				.from(authors)
				.where(eq(authors.id, authorId))
				.limit(1);
			if (!existing[0]) throw notFound();
			await tx
				.update(authors)
				.set({
					email: input.email,
					role: input.role,
					status: input.status,
					slug: input.slug,
					firstName: input.firstName,
					lastName: input.lastName,
					displayName: input.displayName,
					bio: input.bio,
					avatarMediaId: input.avatarMediaId ?? null,
					publicEmail: input.publicEmail ?? null,
					updatedAt: now,
				})
				.where(eq(authors.id, authorId));
			await tx
				.delete(authorSocialLinks)
				.where(eq(authorSocialLinks.authorId, authorId));
			if (input.socialLinks.length > 0) {
				await tx.insert(authorSocialLinks).values(
					input.socialLinks.map((link, index) => ({
						id: crypto.randomUUID(),
						authorId,
						provider: link.provider,
						label: link.label,
						url: link.url,
						position: link.position ?? index,
					})),
				);
			}
		});
	} catch (error) {
		throwDatabaseConflict(error, "email");
	}
	const author = await getAuthor(db, authorId);
	if (!author) throw notFound();
	return author;
}

export async function disableAuthor(
	db: JouzyDatabase,
	authorId: string,
	now = Date.now(),
): Promise<void> {
	const result = await db
		.update(authors)
		.set({ status: "disabled", updatedAt: now })
		.where(eq(authors.id, authorId))
		.returning({ id: authors.id });
	if (!result[0]) throw notFound();
}
