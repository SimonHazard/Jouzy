import { embedProviders, normalizeEmbedUrl } from "@jouzy/content";
import type { ArticleAdminDto } from "@jouzy/db/queries/admin";
import type {
	ArticleDraftInput,
	EmbedProvider,
	EmbedType,
} from "@jouzy/domain";
import { Button } from "@jouzy/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@jouzy/ui/components/card";
import { Checkbox } from "@jouzy/ui/components/checkbox";
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
import { Textarea } from "@jouzy/ui/components/textarea";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useEffect, useRef, useState } from "react";

export interface ArticleEditorOptions {
	authors: Array<{ id: string; displayName: string }>;
	games: Array<{ id: string; title: string }>;
	tags: Array<{ id: string; name: string }>;
	media: Array<{
		id: string;
		altText: string;
		r2Key: string;
		width: number;
		height: number;
	}>;
}

export function applyMarkdownCommand(
	source: string,
	selectionStart: number,
	selectionEnd: number,
	command: "heading" | "bold" | "italic" | "link" | "list" | "quote",
	value = "",
) {
	const selected = source.slice(selectionStart, selectionEnd);
	if (command === "heading") {
		const lineStart = source.lastIndexOf("\n", selectionStart - 1) + 1;
		const next = `${source.slice(0, lineStart)}## ${source.slice(lineStart)}`;
		return { source: next, start: selectionStart + 3, end: selectionEnd + 3 };
	}
	if (command === "list" || command === "quote") {
		const prefix = command === "list" ? "- " : "> ";
		const replacement = selected
			.split("\n")
			.map((line) => prefix + line)
			.join("\n");
		return {
			source:
				source.slice(0, selectionStart) +
				replacement +
				source.slice(selectionEnd),
			start: selectionStart + prefix.length,
			end: selectionStart + replacement.length,
		};
	}
	const [before, after] =
		command === "bold"
			? ["**", "**"]
			: command === "italic"
				? ["*", "*"]
				: ["[", `](${value || "https://"})`];
	return {
		source:
			source.slice(0, selectionStart) +
			before +
			selected +
			after +
			source.slice(selectionEnd),
		start: selectionStart + before.length,
		end: selectionEnd + before.length,
	};
}

function initialValues(
	article: ArticleAdminDto | null,
	options: ArticleEditorOptions,
): ArticleDraftInput {
	return article
		? {
				type: article.article.type,
				title: article.article.title,
				slug: article.article.slug,
				excerpt: article.article.excerpt,
				bodyMarkdown: article.article.bodyMarkdown,
				heroMediaId: article.article.heroMediaId,
				scoreHalfSteps: article.article.scoreHalfSteps,
				verdict: article.article.verdict,
				featured: article.article.featured,
				finalReviewId: article.article.finalReviewId,
				hasMaterialBenefit: article.article.hasMaterialBenefit,
				disclosure: article.article.disclosure,
				authorId: article.article.authorId,
				gameIds: article.games.map((game) => game.id),
				primaryGameId: article.games.find((game) => game.isPrimary)?.id ?? null,
				tagIds: article.tags.map((tag) => tag.id),
				links: article.links.map((link) => ({
					provider: link.provider,
					label: link.label,
					url: link.url,
					isAffiliate: link.isAffiliate,
				})),
			}
		: {
				type: "article",
				title: "",
				slug: "",
				excerpt: "",
				bodyMarkdown: "",
				heroMediaId: null,
				scoreHalfSteps: null,
				verdict: null,
				featured: false,
				finalReviewId: null,
				hasMaterialBenefit: false,
				disclosure: null,
				authorId: options.authors[0]?.id,
				gameIds: [],
				primaryGameId: null,
				tagIds: [],
				links: [],
			};
}

export function ArticleEditor({
	article,
	options,
	onSave,
	onPublish,
	onUnpublish,
	canFeature = false,
}: {
	article: ArticleAdminDto | null;
	options: ArticleEditorOptions;
	onSave: (values: ArticleDraftInput) => Promise<ArticleAdminDto>;
	onPublish: (values: ArticleDraftInput) => Promise<ArticleAdminDto>;
	onUnpublish?: () => Promise<ArticleAdminDto>;
	canFeature?: boolean;
}) {
	const [values, setValues] = useState(() => initialValues(article, options));
	const [error, setError] = useState<string | null>(null);
	const [savedAt, setSavedAt] = useState<number | null>(null);
	const [pending, setPending] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [embedKind, setEmbedKind] = useState<EmbedType>("video");
	const [embedProvider, setEmbedProvider] = useState<EmbedProvider>("youtube");
	const [embedUrl, setEmbedUrl] = useState("");
	const [embedError, setEmbedError] = useState<string | null>(null);
	const bodyRef = useRef<HTMLTextAreaElement>(null);
	useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (dirty) {
				event.preventDefault();
				event.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [dirty]);
	const update = <K extends keyof ArticleDraftInput>(
		key: K,
		value: ArticleDraftInput[K],
	) => {
		setDirty(true);
		setValues((current) => ({ ...current, [key]: value }));
	};
	const submit = async (action: "save" | "publish" | "unpublish") => {
		setPending(true);
		setError(null);
		try {
			const result =
				action === "save"
					? await onSave(values)
					: action === "publish"
						? await onPublish(values)
						: await onUnpublish?.();
			if (result) {
				setValues(initialValues(result, options));
				setDirty(false);
				setSavedAt(Date.now());
			}
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Impossible d’enregistrer la publication.",
			);
		} finally {
			setPending(false);
		}
	};
	const command = (name: Parameters<typeof applyMarkdownCommand>[3]) => {
		const element = bodyRef.current;
		if (!element) return;
		const next = applyMarkdownCommand(
			values.bodyMarkdown,
			element.selectionStart,
			element.selectionEnd,
			name,
		);
		update("bodyMarkdown", next.source);
		requestAnimationFrame(() => {
			element.focus();
			element.setSelectionRange(next.start, next.end);
		});
	};
	const addDirective = (directive: string) => {
		const element = bodyRef.current;
		if (!element) return;
		const start = element.selectionStart;
		const next =
			values.bodyMarkdown.slice(0, start) +
			`${start > 0 && !values.bodyMarkdown.slice(0, start).endsWith("\n") ? "\n\n" : ""}${directive}\n\n` +
			values.bodyMarkdown.slice(element.selectionEnd);
		update("bodyMarkdown", next);
		requestAnimationFrame(() => {
			element.focus();
			element.setSelectionRange(
				start + next.slice(start).indexOf(directive) + directive.length,
				start + next.slice(start).indexOf(directive) + directive.length,
			);
		});
	};
	const media = options.media.find((asset) => asset.id === values.heroMediaId);
	const insertEmbed = () => {
		try {
			const normalized = normalizeEmbedUrl(embedKind, embedProvider, embedUrl);
			addDirective(
				`::jouzy-embed{kind="${normalized.type}" provider="${normalized.provider}" url="${normalized.canonicalUrl}"}`,
			);
			setEmbedError(null);
			setEmbedUrl("");
		} catch (cause) {
			setEmbedError(
				cause instanceof Error ? cause.message : "URL d’embed invalide.",
			);
		}
	};
	const updateLink = <K extends keyof ArticleDraftInput["links"][number]>(
		index: number,
		key: K,
		value: ArticleDraftInput["links"][number][K],
	) => {
		update(
			"links",
			values.links.map((link, linkIndex) =>
				linkIndex === index ? { ...link, [key]: value } : link,
			),
		);
	};
	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(event: FormEvent) => {
				event.preventDefault();
				void submit("save");
			}}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-heading font-semibold text-2xl">
						{article ? "Modifier la publication" : "Nouvelle publication"}
					</h1>
					<p className="text-muted-foreground text-sm">
						{savedAt
							? `Enregistré à ${new Date(savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
							: "Brouillon non enregistré"}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button type="submit" disabled={pending}>
						Enregistrer le brouillon
					</Button>
					{article && (
						<Link
							to="/articles/$articleId/preview"
							params={{ articleId: article.article.id }}
						>
							<Button type="button" variant="outline">
								Prévisualiser
							</Button>
						</Link>
					)}
					{article?.article.status === "published" && onUnpublish ? (
						<Button
							type="button"
							variant="outline"
							disabled={pending}
							onClick={() => {
								if (window.confirm("Dépublier cette publication ?"))
									void submit("unpublish");
							}}
						>
							Dépublier
						</Button>
					) : (
						<Button
							type="button"
							disabled={pending}
							onClick={() => {
								if (window.confirm("Publier cette publication ?"))
									void submit("publish");
							}}
						>
							Publier
						</Button>
					)}
				</div>
			</div>
			{error && (
				<div
					role="alert"
					className="border border-destructive p-3 text-destructive text-sm"
				>
					{error}
				</div>
			)}
			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Contenu</CardTitle>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="article-title">Titre</FieldLabel>
									<Input
										id="article-title"
										value={values.title}
										onChange={(event) => update("title", event.target.value)}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-slug">Slug</FieldLabel>
									<Input
										id="article-slug"
										value={values.slug}
										onChange={(event) => update("slug", event.target.value)}
										required
									/>
									<FieldDescription>Normalisé côté serveur.</FieldDescription>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-excerpt">Chapô</FieldLabel>
									<Textarea
										id="article-excerpt"
										value={values.excerpt}
										onChange={(event) => update("excerpt", event.target.value)}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-body">Corps Markdown</FieldLabel>
									<div className="flex flex-wrap gap-1 border border-b-0 p-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => command("heading")}
										>
											Titre
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => command("bold")}
										>
											Gras
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => command("italic")}
										>
											Italique
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => command("link")}
										>
											Lien
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => command("list")}
										>
											Liste
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => command("quote")}
										>
											Citation
										</Button>
									</div>
									<Textarea
										ref={bodyRef}
										id="article-body"
										className="min-h-96 font-mono"
										value={values.bodyMarkdown}
										onChange={(event) =>
											update("bodyMarkdown", event.target.value)
										}
									/>
									<FieldError>
										HTML, MDX, code et iframes sont refusés à la sauvegarde.
									</FieldError>
								</Field>
							</FieldGroup>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Insertion contrôlée</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<Field>
								<FieldLabel htmlFor="insert-image">Image du corps</FieldLabel>
								<div className="flex gap-2">
									<Select
										onValueChange={(value) => {
											if (value)
												addDirective(`::jouzy-image{assetId="${value}"}`);
										}}
									>
										<SelectTrigger id="insert-image" className="w-full">
											<SelectValue placeholder="Choisir puis insérer" />
										</SelectTrigger>
										<SelectContent>
											{options.media.map((item) => (
												<SelectItem key={item.id} value={item.id}>
													{item.altText} ({item.width}×{item.height})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</Field>
							<Field>
								<FieldLabel htmlFor="embed-kind">Embed externe</FieldLabel>
								<div className="grid gap-2 sm:grid-cols-2">
									<Select
										value={embedKind}
										onValueChange={(value) => {
											if (value === "video" || value === "music")
												setEmbedKind(value);
										}}
									>
										<SelectTrigger id="embed-kind">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="video">Vidéo</SelectItem>
											<SelectItem value="music">Musique</SelectItem>
										</SelectContent>
									</Select>
									<Select
										value={embedProvider}
										onValueChange={(value) => {
											if (value && value in embedProviders)
												setEmbedProvider(value as EmbedProvider);
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.values(embedProviders)
												.filter((provider) =>
													provider.kinds.includes(embedKind),
												)
												.map((provider) => (
													<SelectItem
														key={provider.provider}
														value={provider.provider}
													>
														{provider.label}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<Input
									value={embedUrl}
									onChange={(event) => setEmbedUrl(event.target.value)}
									placeholder="https://…"
								/>
								{embedError && <FieldError>{embedError}</FieldError>}
								<Button type="button" variant="outline" onClick={insertEmbed}>
									Insérer l’embed validé
								</Button>
							</Field>
							<FieldDescription>
								Les images et embeds sont insérés comme directives canoniques ;
								aucune iframe n’est rendue dans l’éditeur.
							</FieldDescription>
						</CardContent>
					</Card>
				</div>
				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Format et auteur</CardTitle>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="article-type">Type</FieldLabel>
									<Select
										value={values.type}
										onValueChange={(value) => {
											if (
												value === "review" ||
												value === "first_impression" ||
												value === "article"
											)
												update("type", value);
										}}
									>
										<SelectTrigger id="article-type" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="article">Article</SelectItem>
											<SelectItem value="review">Review</SelectItem>
											<SelectItem value="first_impression">
												Premières impressions
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-author">Auteur</FieldLabel>
									<Select
										value={values.authorId}
										onValueChange={(value) =>
											update("authorId", value ?? undefined)
										}
										disabled={options.authors.length < 2}
									>
										<SelectTrigger id="article-author" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{options.authors.map((author) => (
												<SelectItem key={author.id} value={author.id}>
													{author.displayName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							</FieldGroup>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Jeux et tags</CardTitle>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="article-games">Jeux associés</FieldLabel>
									<select
										id="article-games"
										multiple
										className="min-h-28 border bg-transparent p-2 text-sm"
										value={values.gameIds}
										onChange={(event) =>
											update(
												"gameIds",
												[...event.currentTarget.selectedOptions].map(
													(option) => option.value,
												),
											)
										}
									>
										{options.games.map((game) => (
											<option key={game.id} value={game.id}>
												{game.title}
											</option>
										))}
									</select>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-primary-game">
										Jeu principal
									</FieldLabel>
									<Select
										value={values.primaryGameId ?? undefined}
										onValueChange={(value) => update("primaryGameId", value)}
									>
										<SelectTrigger id="article-primary-game" className="w-full">
											<SelectValue placeholder="Aucun" />
										</SelectTrigger>
										<SelectContent>
											{options.games
												.filter((game) => values.gameIds.includes(game.id))
												.map((game) => (
													<SelectItem key={game.id} value={game.id}>
														{game.title}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-tags">Tags</FieldLabel>
									<select
										id="article-tags"
										multiple
										className="min-h-24 border bg-transparent p-2 text-sm"
										value={values.tagIds}
										onChange={(event) =>
											update(
												"tagIds",
												[...event.currentTarget.selectedOptions].map(
													(option) => option.value,
												),
											)
										}
									>
										{options.tags.map((tag) => (
											<option key={tag.id} value={tag.id}>
												{tag.name}
											</option>
										))}
									</select>
								</Field>
							</FieldGroup>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Couverture</CardTitle>
						</CardHeader>
						<CardContent>
							<Select
								value={values.heroMediaId ?? undefined}
								onValueChange={(value) => update("heroMediaId", value)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Choisir une image" />
								</SelectTrigger>
								<SelectContent>
									{options.media.map((item) => (
										<SelectItem key={item.id} value={item.id}>
											{item.altText}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{media && (
								<p className="mt-2 text-muted-foreground text-xs">
									{media.width}×{media.height} — asset R2 sélectionné
								</p>
							)}
							<FieldDescription>
								Obligatoire avant publication.
							</FieldDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Review</CardTitle>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="article-final-review">
										Review finale liée
									</FieldLabel>
									<Input
										id="article-final-review"
										value={values.finalReviewId ?? ""}
										onChange={(event) =>
											update("finalReviewId", event.target.value || null)
										}
										disabled={values.type !== "first_impression"}
									/>
									<FieldDescription>
										Identifiant d’une review publiée, requis pour les premières
										impressions.
									</FieldDescription>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-score">
										Note (demi-points)
									</FieldLabel>
									<Input
										id="article-score"
										type="number"
										min="0"
										max="20"
										step="1"
										value={values.scoreHalfSteps ?? ""}
										onChange={(event) =>
											update(
												"scoreHalfSteps",
												event.target.value === ""
													? null
													: Number(event.target.value),
											)
										}
										disabled={values.type !== "review"}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-verdict">Verdict</FieldLabel>
									<Textarea
										id="article-verdict"
										value={values.verdict ?? ""}
										onChange={(event) =>
											update("verdict", event.target.value || null)
										}
										disabled={values.type !== "review"}
									/>
								</Field>
							</FieldGroup>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Liens</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							{values.links.map((link, index) => (
								<div
									key={`${index}-${link.url}`}
									className="flex flex-col gap-3 border p-3"
								>
									<div className="grid gap-3 sm:grid-cols-2">
										<Field>
											<FieldLabel htmlFor={`article-link-provider-${index}`}>
												Fournisseur
											</FieldLabel>
											<Input
												id={`article-link-provider-${index}`}
												value={link.provider}
												onChange={(event) =>
													updateLink(index, "provider", event.target.value)
												}
											/>
										</Field>
										<Field>
											<FieldLabel htmlFor={`article-link-label-${index}`}>
												Libellé
											</FieldLabel>
											<Input
												id={`article-link-label-${index}`}
												value={link.label}
												onChange={(event) =>
													updateLink(index, "label", event.target.value)
												}
											/>
										</Field>
									</div>
									<Field>
										<FieldLabel htmlFor={`article-link-url-${index}`}>
											URL HTTPS
										</FieldLabel>
										<Input
											id={`article-link-url-${index}`}
											type="url"
											value={link.url}
											onChange={(event) =>
												updateLink(index, "url", event.target.value)
											}
										/>
									</Field>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<label
											className="flex items-center gap-2 text-sm"
											htmlFor={`article-link-affiliate-${index}`}
										>
											<Checkbox
												id={`article-link-affiliate-${index}`}
												checked={link.isAffiliate}
												onCheckedChange={(checked) =>
													updateLink(index, "isAffiliate", checked === true)
												}
											/>
											Lien affilié
										</label>
										<Button
											type="button"
											variant="ghost"
											onClick={() =>
												update(
													"links",
													values.links.filter(
														(_, linkIndex) => linkIndex !== index,
													),
												)
											}
										>
											Supprimer
										</Button>
									</div>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									update("links", [
										...values.links,
										{
											provider: "",
											label: "",
											url: "https://",
											isAffiliate: false,
										},
									])
								}
							>
								Ajouter un lien
							</Button>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Divulgation</CardTitle>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel
										htmlFor="article-benefit"
										className="flex items-center gap-2 text-sm"
									>
										<Checkbox
											id="article-benefit"
											checked={values.hasMaterialBenefit}
											onCheckedChange={(checked) =>
												update("hasMaterialBenefit", checked === true)
											}
										/>
										Avantage matériel reçu
									</FieldLabel>
								</Field>
								<Field>
									<FieldLabel htmlFor="article-disclosure">
										Texte de divulgation
									</FieldLabel>
									<Textarea
										id="article-disclosure"
										value={values.disclosure ?? ""}
										onChange={(event) =>
											update("disclosure", event.target.value || null)
										}
									/>
								</Field>
								{canFeature && (
									<Field>
										<FieldLabel
											htmlFor="article-featured"
											className="flex items-center gap-2 text-sm"
										>
											<Checkbox
												id="article-featured"
												checked={values.featured}
												onCheckedChange={(checked) =>
													update("featured", checked === true)
												}
											/>
											Mettre en avant
										</FieldLabel>
									</Field>
								)}
							</FieldGroup>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
