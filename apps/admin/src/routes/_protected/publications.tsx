import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/publications")({
	component: PublicationsPlaceholder,
});

function PublicationsPlaceholder() {
	return (
		<main className="px-4 py-8 lg:px-8" aria-labelledby="publications-title">
			<h1
				id="publications-title"
				className="font-heading font-semibold text-2xl"
			>
				Publications
			</h1>
			<p className="mt-2 text-muted-foreground text-sm">
				L’éditeur arrive dans le prochain plan.
			</p>
		</main>
	);
}
