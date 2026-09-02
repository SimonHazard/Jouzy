import { createFileRoute } from "@tanstack/react-router";
import { AdminErrorState } from "../../components/admin-error-state.js";
import { MediaLibrary } from "../../features/media/MediaLibrary.js";
import {
	listMediaFn,
	removeMediaFn,
	uploadMediaFn,
} from "../../features/media/server-functions.js";

export const Route = createFileRoute("/_protected/media")({
	loader: () => listMediaFn(),
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: MediaPage,
});

function MediaPage() {
	const media = Route.useLoaderData();
	return (
		<main
			className="flex flex-col gap-6 px-4 py-8 lg:px-8"
			aria-labelledby="media-title"
		>
			<div>
				<h1 id="media-title" className="font-heading font-semibold text-2xl">
					Bibliothèque média
				</h1>
				<p className="text-muted-foreground text-sm">
					Images R2 locales, vérifiées avant enregistrement.
				</p>
			</div>
			<MediaLibrary
				initial={media}
				onUpload={(data) => uploadMediaFn({ data })}
				onDelete={(mediaAssetId) => removeMediaFn({ data: { mediaAssetId } })}
			/>
		</main>
	);
}
