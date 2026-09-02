import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminErrorState } from "../../../components/admin-error-state.js";
import {
	ArticleEditor,
	type ArticleEditorOptions,
} from "../../../features/articles/ArticleEditor.js";
import {
	articleFormOptionsFn,
	createArticleFn,
	createPublishedArticleFn,
} from "../../../features/articles/server-functions.js";

export const Route = createFileRoute("/_protected/articles/new")({
	loader: () => articleFormOptionsFn(),
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: NewArticlePage,
});

function NewArticlePage() {
	const raw = Route.useLoaderData();
	const navigate = useNavigate();
	const identity = Route.useRouteContext();
	const options = {
		...raw,
		authors: raw.authors.filter(
			(author): author is NonNullable<typeof author> => Boolean(author),
		),
	} satisfies ArticleEditorOptions;
	return (
		<main className="px-4 py-8 lg:px-8">
			<ArticleEditor
				canFeature={identity.role === "admin"}
				article={null}
				options={options}
				onSave={async (values) => {
					const article = await createArticleFn({ data: values });
					await navigate({
						to: "/articles/$articleId",
						params: { articleId: article.article.id },
					});
					return article;
				}}
				onPublish={async (values) => {
					const article = await createPublishedArticleFn({ data: values });
					await navigate({
						to: "/articles/$articleId",
						params: { articleId: article.article.id },
					});
					return article;
				}}
			/>
		</main>
	);
}
