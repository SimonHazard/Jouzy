import { Badge } from "@jouzy/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@jouzy/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { AdminErrorState } from "../../components/admin-error-state.js";
import { AuthorCreateForm } from "../../components/reference-form.js";
import {
	createAuthorFn,
	listAuthorsFn,
} from "../../features/authors/server-functions.js";
import { listMediaFn } from "../../features/media/server-functions.js";

export const Route = createFileRoute("/_protected/authors")({
	loader: async () => {
		const [authors, media] = await Promise.all([
			listAuthorsFn(),
			listMediaFn(),
		]);
		return { authors, media };
	},
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: AuthorsPage,
});

function AuthorsPage() {
	const { authors, media } = Route.useLoaderData();
	const identity = Route.useRouteContext();
	if (identity.role !== "admin")
		return <AdminErrorState error={{ code: "FORBIDDEN" }} />;
	return <AuthorsContent authors={authors} media={media} />;
}

export function AuthorsContent({
	authors,
	media = [],
}: {
	authors: Awaited<ReturnType<typeof listAuthorsFn>>;
	media?: Awaited<ReturnType<typeof listMediaFn>>;
}) {
	return (
		<main
			className="flex flex-col gap-6 px-4 py-8 lg:px-8"
			aria-labelledby="authors-title"
		>
			<div>
				<h1 id="authors-title" className="font-heading font-semibold text-2xl">
					Auteurs
				</h1>
				<p className="text-muted-foreground text-sm">
					Gestion réservée aux administrateurs.
				</p>
			</div>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
				<Card>
					<CardHeader>
						<CardTitle>Auteurs existants</CardTitle>
						<CardDescription>
							L’e-mail privé n’est jamais affiché dans cette liste.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{authors.length === 0 ? (
							<p className="text-muted-foreground text-sm">Aucun auteur.</p>
						) : (
							<ul className="flex flex-col gap-3">
								{authors.map((author) => (
									<li
										key={author.id}
										className="flex items-center justify-between border-b pb-3 last:border-0"
									>
										<span>
											<span className="font-medium">{author.displayName}</span>
											<span className="block text-muted-foreground text-xs">
												{author.slug}
											</span>
										</span>
										<Badge
											variant={
												author.status === "active" ? "secondary" : "outline"
											}
										>
											{author.status}
										</Badge>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Nouvel auteur</CardTitle>
						<CardDescription>
							Cloudflare Access doit être configuré séparément.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<AuthorCreateForm
							media={media}
							onSubmit={async (values) => {
								await createAuthorFn({
									data: {
										...values,
										avatarMediaId: values.avatarMediaId,
										role: "author",
										status: "active",
										bio: "",
										publicEmail: null,
										socialLinks: [],
									},
								});
							}}
						/>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
