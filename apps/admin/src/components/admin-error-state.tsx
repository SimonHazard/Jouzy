import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@jouzy/ui/components/alert";
import { Button } from "@jouzy/ui/components/button";

export function AdminErrorState({ error }: { error: unknown }) {
	const code =
		typeof error === "object" && error !== null && "code" in error
			? String(error.code)
			: "";
	const title =
		code === "FORBIDDEN"
			? "Accès refusé"
			: code === "UNAUTHORIZED"
				? "Authentification requise"
				: code === "NOT_FOUND"
					? "Ressource introuvable"
					: "Le service est indisponible";
	const description =
		code === "FORBIDDEN"
			? "Votre profil ne permet pas d’effectuer cette action."
			: code === "UNAUTHORIZED"
				? "Ouvrez cet espace depuis l’adresse protégée par Cloudflare Access."
				: code === "NOT_FOUND"
					? "La ressource demandée n’existe pas ou n’est plus disponible."
					: "Réessayez. Si le problème persiste, vérifiez la disponibilité de D1.";
	return (
		<main
			className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-4 py-8"
			aria-live="polite"
		>
			<Alert variant="destructive">
				<AlertTitle>{title}</AlertTitle>
				<AlertDescription>{description}</AlertDescription>
			</Alert>
			<Button
				type="button"
				variant="outline"
				onClick={() => window.location.reload()}
			>
				Réessayer
			</Button>
		</main>
	);
}
