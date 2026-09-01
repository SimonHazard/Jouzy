import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@jouzy/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { AdminErrorState } from "../../components/admin-error-state.js";
import { TaxonomyCreateForm } from "../../components/reference-form.js";
import {
	createTaxonomyFn,
	listTaxonomiesFn,
} from "../../features/taxonomies/server-functions.js";

export const Route = createFileRoute("/_protected/taxonomies")({
	loader: () => listTaxonomiesFn(),
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: TaxonomiesPage,
});

function TaxonomiesPage() {
	const [platforms, genres, tags] = Route.useLoaderData();
	const identity = Route.useRouteContext();
	const sections = [
		["Plateformes", platforms],
		["Genres", genres],
		["Tags", tags],
	] as const;
	return (
		<main
			className="flex flex-col gap-6 px-4 py-8 lg:px-8"
			aria-labelledby="taxonomies-title"
		>
			<div>
				<h1
					id="taxonomies-title"
					className="font-heading font-semibold text-2xl"
				>
					Taxonomies
				</h1>
				<p className="text-muted-foreground text-sm">
					Lecture pour tous les profils ; édition réservée à l’administrateur.
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				{sections.map(([title, entries]) => (
					<Card key={title}>
						<CardHeader>
							<CardTitle>{title}</CardTitle>
							<CardDescription>{entries.length} entrée(s)</CardDescription>
						</CardHeader>
						<CardContent>
							{entries.length === 0 ? (
								<p className="text-muted-foreground text-sm">Aucune entrée.</p>
							) : (
								<ul className="flex flex-col gap-2">
									{entries.map((entry) => (
										<li key={entry.id} className="flex justify-between text-sm">
											<span>{entry.name}</span>
											<span className="text-muted-foreground">
												{entry.slug}
											</span>
										</li>
									))}
								</ul>
							)}
						</CardContent>
					</Card>
				))}
			</div>
			{identity.role === "admin" && (
				<Card>
					<CardHeader>
						<CardTitle>Ajouter un tag</CardTitle>
						<CardDescription>
							Les conflits de slug sont refusés côté serveur.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<TaxonomyCreateForm
							onSubmit={async (values) => {
								await createTaxonomyFn({ data: { kind: "tag", values } });
							}}
						/>
					</CardContent>
				</Card>
			)}
		</main>
	);
}
