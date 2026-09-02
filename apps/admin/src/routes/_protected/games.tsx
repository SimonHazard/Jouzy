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
import { GameCreateForm } from "../../components/reference-form.js";
import {
	createGameFn,
	listGamesFn,
} from "../../features/games/server-functions.js";
import { listMediaFn } from "../../features/media/server-functions.js";

export const Route = createFileRoute("/_protected/games")({
	loader: async () => {
		const [games, media] = await Promise.all([listGamesFn(), listMediaFn()]);
		return { games, media };
	},
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: GamesPage,
});

function GamesPage() {
	const { games, media } = Route.useLoaderData();
	const identity = Route.useRouteContext();
	return (
		<main
			className="flex flex-col gap-6 px-4 py-8 lg:px-8"
			aria-labelledby="games-title"
		>
			<div>
				<h1 id="games-title" className="font-heading font-semibold text-2xl">
					Jeux
				</h1>
				<p className="text-muted-foreground text-sm">
					Lecture pour tous les profils ; mutations réservées à
					l’administrateur.
				</p>
			</div>
			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
				<Card>
					<CardHeader>
						<CardTitle>Catalogue</CardTitle>
						<CardDescription>
							{games.length} jeu(x) enregistré(s).
						</CardDescription>
					</CardHeader>
					<CardContent>
						{games.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								Aucun jeu pour le moment.
							</p>
						) : (
							<ul className="flex flex-col gap-3">
								{games.map((game) => (
									<li
										key={game.id}
										className="flex items-center justify-between border-b pb-3 last:border-0"
									>
										<span>
											<span className="font-medium">{game.title}</span>
											<span className="block text-muted-foreground text-xs">
												{game.slug}
											</span>
										</span>
										{identity.role === "admin" && (
											<Badge variant="secondary">Administrable</Badge>
										)}
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
				{identity.role === "admin" && (
					<Card>
						<CardHeader>
							<CardTitle>Nouveau jeu</CardTitle>
							<CardDescription>
								La couverture sera ajoutée avec la bibliothèque média.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<GameCreateForm
								media={media}
								onSubmit={async (values) => {
									await createGameFn({
										data: {
											...values,
											coverMediaId: values.coverMediaId,
											developer: null,
											publisher: null,
											releaseDate: null,
											releaseDatePrecision: null,
											platformIds: [],
											genreIds: [],
											storeLinks: [],
										},
									});
								}}
							/>
						</CardContent>
					</Card>
				)}
			</div>
		</main>
	);
}
