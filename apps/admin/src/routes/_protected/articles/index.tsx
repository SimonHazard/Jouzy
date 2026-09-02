import { Badge } from "@jouzy/ui/components/badge";
import { Button } from "@jouzy/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@jouzy/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminErrorState } from "../../../components/admin-error-state.js";
import { listArticlesFn } from "../../../features/articles/server-functions.js";

export const Route = createFileRoute("/_protected/articles/")({
	loader: () => listArticlesFn(),
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: ArticlesPage,
});

function ArticlesPage() {
	const articles = Route.useLoaderData();
	return (
		<main
			className="flex flex-col gap-6 px-4 py-8 lg:px-8"
			aria-labelledby="articles-title"
		>
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1
						id="articles-title"
						className="font-heading font-semibold text-2xl"
					>
						Publications
					</h1>
					<p className="text-muted-foreground text-sm">
						Brouillons et publications selon vos droits.
					</p>
				</div>
				<Link to="/articles/new">
					<Button>Nouvelle publication</Button>
				</Link>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{articles.length} publication(s)</CardTitle>
				</CardHeader>
				<CardContent>
					{articles.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Aucune publication pour le moment.
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead>
									<tr className="border-b">
										<th className="p-2">Titre</th>
										<th className="p-2">Statut</th>
										<th className="p-2">Auteur</th>
										<th className="p-2">Mise à jour</th>
										<th className="p-2">
											<span className="sr-only">Action</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{articles.map((item) => (
										<tr
											key={item.article.id}
											className="border-b last:border-0"
										>
											<td className="p-2 font-medium">
												{item.article.title || "Sans titre"}
												<span className="block text-muted-foreground text-xs">
													{item.article.type} · /{item.article.slug}
												</span>
											</td>
											<td className="p-2">
												<Badge
													variant={
														item.article.status === "published"
															? "secondary"
															: "outline"
													}
												>
													{item.article.status === "published"
														? "Publié"
														: "Brouillon"}
												</Badge>
											</td>
											<td className="p-2">{item.author.displayName}</td>
											<td className="p-2 text-muted-foreground">
												{new Date(item.article.updatedAt).toLocaleString(
													"fr-FR",
													{ timeZone: "Europe/Paris" },
												)}
											</td>
											<td className="p-2">
												<Link
													to="/articles/$articleId"
													params={{ articleId: item.article.id }}
												>
													<Button variant="outline" size="sm">
														Ouvrir
													</Button>
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
