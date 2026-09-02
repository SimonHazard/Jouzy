import {
	createFileRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { AdminErrorState } from "../../../components/admin-error-state.js";
import {
	ArticleEditor,
	type ArticleEditorOptions,
} from "../../../features/articles/ArticleEditor.js";
import {
	articleFormOptionsFn,
	getArticleFn,
	publishArticleFn,
	saveArticleFn,
	unpublishArticleFn,
} from "../../../features/articles/server-functions.js";

export const Route = createFileRoute("/_protected/articles/$articleId")({
	loader: async ({ params }) => {
		const [article, options] = await Promise.all([
			getArticleFn({ data: { articleId: params.articleId } }),
			articleFormOptionsFn(),
		]);
		return { article, options };
	},
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: EditArticlePage,
});

function EditArticlePage() {
	const { article, options: raw } = Route.useLoaderData();
	const identity = Route.useRouteContext();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	if (pathname.endsWith("/preview")) return <Outlet />;
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
				article={article}
				options={options}
				onSave={(values) =>
					saveArticleFn({ data: { articleId: article.article.id, values } })
				}
				onPublish={(values) =>
					publishArticleFn({ data: { articleId: article.article.id, values } })
				}
				onUnpublish={() =>
					unpublishArticleFn({ data: { articleId: article.article.id } })
				}
			/>
		</main>
	);
}
