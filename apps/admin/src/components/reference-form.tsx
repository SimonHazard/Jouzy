import { Button } from "@jouzy/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@jouzy/ui/components/field";
import { Input } from "@jouzy/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jouzy/ui/components/select";
import { useState } from "react";

export function TaxonomyCreateForm({
	onSubmit,
}: {
	onSubmit: (values: { name: string; slug: string }) => Promise<void>;
}) {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	return (
		<form
			onSubmit={async (event) => {
				event.preventDefault();
				setPending(true);
				setError(null);
				try {
					await onSubmit({ name, slug });
					setName("");
					setSlug("");
				} catch {
					setError("Impossible d’enregistrer cette taxonomie.");
				} finally {
					setPending(false);
				}
			}}
		>
			<FieldGroup>
				<Field data-invalid={Boolean(error)}>
					<FieldLabel htmlFor="taxonomy-name">Nom</FieldLabel>
					<Input
						id="taxonomy-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
						aria-invalid={Boolean(error)}
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="taxonomy-slug">Slug</FieldLabel>
					<Input
						id="taxonomy-slug"
						value={slug}
						onChange={(event) => setSlug(event.target.value)}
						required
					/>
					<FieldDescription>
						Le slug est normalisé côté serveur.
					</FieldDescription>
				</Field>
				{error && <FieldError>{error}</FieldError>}
				<Button type="submit" disabled={pending}>
					{pending ? "Enregistrement…" : "Ajouter"}
				</Button>
			</FieldGroup>
		</form>
	);
}

export function AuthorCreateForm({
	onSubmit,
	media = [],
}: {
	onSubmit: (values: {
		email: string;
		firstName: string;
		lastName: string;
		displayName: string;
		slug: string;
		avatarMediaId: string | null;
	}) => Promise<void>;
	media?: Array<{ id: string; altText: string }>;
}) {
	const [values, setValues] = useState({
		email: "",
		firstName: "",
		lastName: "",
		displayName: "",
		slug: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [avatarMediaId, setAvatarMediaId] = useState<string | null>(null);
	const update = (key: keyof typeof values, value: string) =>
		setValues((current) => ({ ...current, [key]: value }));
	return (
		<form
			onSubmit={async (event) => {
				event.preventDefault();
				setPending(true);
				setError(null);
				try {
					await onSubmit({ ...values, avatarMediaId });
					setValues({
						email: "",
						firstName: "",
						lastName: "",
						displayName: "",
						slug: "",
					});
					setAvatarMediaId(null);
				} catch {
					setError(
						"Vérifiez les champs et les éventuels conflits d’e-mail ou de slug.",
					);
				} finally {
					setPending(false);
				}
			}}
		>
			<FieldGroup>
				{(
					["email", "firstName", "lastName", "displayName", "slug"] as const
				).map((key) => (
					<Field key={key} data-invalid={Boolean(error)}>
						<FieldLabel htmlFor={`author-${key}`}>
							{key === "email"
								? "E-mail privé"
								: key === "firstName"
									? "Prénom"
									: key === "lastName"
										? "Nom"
										: key === "displayName"
											? "Pseudo public"
											: "Slug"}
						</FieldLabel>
						<Input
							id={`author-${key}`}
							type={key === "email" ? "email" : "text"}
							value={values[key]}
							onChange={(event) => update(key, event.target.value)}
							required
							aria-invalid={Boolean(error)}
						/>
					</Field>
				))}
				<FieldDescription>
					L’e-mail doit aussi être ajouté manuellement à la politique Cloudflare
					Access.
				</FieldDescription>
				{media.length > 0 && (
					<Field>
						<FieldLabel htmlFor="author-avatar">Avatar</FieldLabel>
						<Select
							value={avatarMediaId ?? undefined}
							onValueChange={setAvatarMediaId}
						>
							<SelectTrigger id="author-avatar" className="w-full">
								<SelectValue placeholder="Choisir une image" />
							</SelectTrigger>
							<SelectContent>
								{media.map((asset) => (
									<SelectItem key={asset.id} value={asset.id}>
										{asset.altText}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				)}
				{error && <FieldError>{error}</FieldError>}
				<Button type="submit" disabled={pending}>
					{pending ? "Enregistrement…" : "Créer l’auteur"}
				</Button>
			</FieldGroup>
		</form>
	);
}

export function GameCreateForm({
	onSubmit,
	media = [],
}: {
	onSubmit: (values: {
		title: string;
		slug: string;
		coverMediaId: string | null;
	}) => Promise<void>;
	media?: Array<{ id: string; altText: string }>;
}) {
	const [values, setValues] = useState({ title: "", slug: "" });
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
	return (
		<form
			onSubmit={async (event) => {
				event.preventDefault();
				setPending(true);
				setError(null);
				try {
					await onSubmit({ ...values, coverMediaId });
					setValues({ title: "", slug: "" });
					setCoverMediaId(null);
				} catch (cause) {
					setError(
						cause instanceof Error
							? cause.message
							: "Vérifiez les champs et le conflit de slug.",
					);
				} finally {
					setPending(false);
				}
			}}
		>
			<FieldGroup>
				<Field data-invalid={Boolean(error)}>
					<FieldLabel htmlFor="game-title">Titre</FieldLabel>
					<Input
						id="game-title"
						value={values.title}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								title: event.target.value,
							}))
						}
						required
						aria-invalid={Boolean(error)}
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="game-slug">Slug</FieldLabel>
					<Input
						id="game-slug"
						value={values.slug}
						onChange={(event) =>
							setValues((current) => ({ ...current, slug: event.target.value }))
						}
						required
					/>
					<FieldDescription>
						Les plateformes, genres et liens boutique peuvent être ajoutés
						depuis le même modèle serveur.
					</FieldDescription>
					{media.length > 0 && (
						<Field>
							<FieldLabel htmlFor="game-cover">Couverture</FieldLabel>
							<Select
								value={coverMediaId ?? undefined}
								onValueChange={setCoverMediaId}
							>
								<SelectTrigger id="game-cover" className="w-full">
									<SelectValue placeholder="Choisir une image" />
								</SelectTrigger>
								<SelectContent>
									{media.map((asset) => (
										<SelectItem key={asset.id} value={asset.id}>
											{asset.altText}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					)}
				</Field>
				{error && <FieldError>{error}</FieldError>}
				<Button type="submit" disabled={pending}>
					{pending ? "Enregistrement…" : "Créer le jeu"}
				</Button>
			</FieldGroup>
		</form>
	);
}
