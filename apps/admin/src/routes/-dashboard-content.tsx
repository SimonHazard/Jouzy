import type { AuthorizationIdentity } from "@jouzy/domain";
import { Badge } from "@jouzy/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@jouzy/ui/components/card";
import { Skeleton } from "@jouzy/ui/components/skeleton";

export function DashboardContent({
	identity,
}: {
	identity: AuthorizationIdentity;
}) {
	return (
		<main
			className="flex flex-col gap-6 px-4 py-8 lg:px-8"
			aria-labelledby="dashboard-title"
		>
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-xs uppercase tracking-wide">
					Espace protégé
				</p>
				<h1
					id="dashboard-title"
					className="font-heading font-semibold text-2xl"
				>
					Tableau de bord
				</h1>
				<p className="text-muted-foreground text-sm">
					Bienvenue, {identity.displayName}.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				{["Brouillons", "Publications", "Jeux"].map((label) => (
					<Card key={label}>
						<CardHeader>
							<CardTitle>{label}</CardTitle>
							<CardDescription>Compteur du référentiel</CardDescription>
						</CardHeader>
						<CardContent>
							<Skeleton
								className="h-7 w-12"
								aria-label={`Chargement du compteur ${label}`}
							/>
						</CardContent>
					</Card>
				))}
			</div>
			<Card>
				<CardHeader>
					<CardTitle>État de l’espace</CardTitle>
					<CardDescription>
						Les publications seront disponibles dans un prochain plan.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Badge variant="outline">Référentiels prêts</Badge>
				</CardContent>
			</Card>
		</main>
	);
}
