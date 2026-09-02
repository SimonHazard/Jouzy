import { Button } from "@jouzy/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@jouzy/ui/components/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@jouzy/ui/components/field";
import { Input } from "@jouzy/ui/components/input";
import { useState } from "react";
import type { MediaAssetWithUrl } from "./media-service.server.js";

export function MediaLibrary({
	initial,
	onUpload,
	onDelete,
}: {
	initial: MediaAssetWithUrl[];
	onUpload: (data: FormData) => Promise<MediaAssetWithUrl>;
	onDelete: (id: string) => Promise<void>;
}) {
	const [assets, setAssets] = useState(initial);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
			<Card>
				<CardHeader>
					<CardTitle>{assets.length} image(s)</CardTitle>
				</CardHeader>
				<CardContent>
					{assets.length === 0 ? (
						<p className="text-muted-foreground text-sm">Aucune image.</p>
					) : (
						<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{assets.map((asset) => (
								<li key={asset.id} className="flex flex-col gap-2 border p-2">
									<img
										src={asset.publicUrl}
										alt={asset.altText}
										width={asset.width}
										height={asset.height}
										className="aspect-video h-auto w-full object-contain"
									/>
									<p className="truncate font-medium text-sm">
										{asset.altText}
									</p>
									<p className="text-muted-foreground text-xs">
										{asset.width}×{asset.height} · {asset.sizeBytes} octets
									</p>
									<Button
										variant="outline"
										size="sm"
										onClick={async () => {
											try {
												await onDelete(asset.id);
												setAssets((current) =>
													current.filter((item) => item.id !== asset.id),
												);
											} catch {
												setError(
													"Cette image est encore utilisée ou n’a pas pu être supprimée.",
												);
											}
										}}
									>
										Supprimer
									</Button>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Téléverser une image</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={async (event) => {
							event.preventDefault();
							setPending(true);
							setError(null);
							const formElement = event.currentTarget;
							const form = new FormData(formElement);
							try {
								const asset = await onUpload(form);
								setAssets((current) => [asset, ...current]);
								formElement.reset();
							} catch (cause) {
								setError(
									cause instanceof Error ? cause.message : "Upload refusé.",
								);
							} finally {
								setPending(false);
							}
						}}
					>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="media-file">Fichier</FieldLabel>
								<Input
									id="media-file"
									name="file"
									type="file"
									accept="image/jpeg,image/png,image/webp,image/avif"
									required
								/>
								<FieldDescription>
									JPEG, PNG, WebP ou AVIF, 10 Mio maximum.
								</FieldDescription>
							</Field>
							<Field>
								<FieldLabel htmlFor="media-alt">Texte alternatif</FieldLabel>
								<Input id="media-alt" name="altText" required />
							</Field>
							<Field>
								<FieldLabel htmlFor="media-caption">Légende</FieldLabel>
								<Input id="media-caption" name="caption" />
							</Field>
							<Field>
								<FieldLabel htmlFor="media-credit">Crédit</FieldLabel>
								<Input id="media-credit" name="credit" />
							</Field>
							{error && (
								<p role="alert" className="text-destructive text-sm">
									{error}
								</p>
							)}
							<Button type="submit" disabled={pending}>
								{pending ? "Téléversement…" : "Téléverser"}
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
