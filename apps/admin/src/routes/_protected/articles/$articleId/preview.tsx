import { ArticleContent } from "@jouzy/content";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@jouzy/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { AdminErrorState } from "../../../../components/admin-error-state.js";
import { getArticlePreviewFn } from "../../../../features/articles/server-functions.js";

export const Route = createFileRoute("/_protected/articles/$articleId/preview")(
	{
		loader: ({ params }) =>
			getArticlePreviewFn({ data: { articleId: params.articleId } }),
		errorComponent: ({ error }) => <AdminErrorState error={error} />,
		component: PreviewPage,
	},
);

function PreviewPage() {
	const { article, document, assets } = Route.useLoaderData();
	return (
		<main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
			<Card>
				<CardHeader>
					<p className="text-muted-foreground text-sm">
						Aperçu privé ·{" "}
						{article.article.status === "published" ? "Publié" : "Brouillon"}
					</p>
					<CardTitle className="font-heading text-3xl">
						{article.article.title || "Sans titre"}
					</CardTitle>
					{article.article.excerpt && (
						<p className="text-muted-foreground">{article.article.excerpt}</p>
					)}
				</CardHeader>
				<CardContent>
					<ArticleContent document={document} assets={assets} />
				</CardContent>
			</Card>
		</main>
	);
}
