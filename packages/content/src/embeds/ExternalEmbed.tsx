"use client";

import type { EmbedProvider } from "@jouzy/domain";
import { useState } from "react";
import type { NormalizedEmbed } from "./providers.js";

export function ExternalEmbed({ embed }: { embed: NormalizedEmbed }) {
	const [loaded, setLoaded] = useState(false);
	return loaded ? (
		<figure className="my-8 overflow-hidden border bg-muted/20">
			<iframe
				title={`${embed.label} — contenu externe`}
				src={embed.embedUrl}
				className="aspect-video w-full border-0"
				loading="lazy"
				referrerPolicy={embed.iframe.referrerPolicy}
				sandbox={embed.iframe.sandbox}
				allow={embed.iframe.allow}
				allowFullScreen
			/>
			<figcaption className="flex items-center justify-between gap-3 p-3 text-muted-foreground text-xs">
				<span>
					{embed.label} — {embed.type === "video" ? "vidéo" : "musique"}
				</span>
				<a href={embed.canonicalUrl} target="_blank" rel="noopener noreferrer">
					Ouvrir chez le fournisseur
				</a>
			</figcaption>
		</figure>
	) : (
		<div
			className="my-8 flex flex-col gap-3 border p-4 text-sm"
			data-embed-placeholder
		>
			<p className="font-medium">
				Contenu {embed.type === "video" ? "vidéo" : "musical"} externe —{" "}
				{embed.label}
			</p>
			<p className="text-muted-foreground">
				Le clic ci-dessous contacte ce fournisseur pour cet élément uniquement.
			</p>
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					className="min-h-11 border px-3 py-2 font-medium hover:bg-accent"
					onClick={() => setLoaded(true)}
				>
					Charger ce contenu externe
				</button>
				<a href={embed.canonicalUrl} target="_blank" rel="noopener noreferrer">
					Ouvrir le lien
				</a>
			</div>
		</div>
	);
}

export function providerLabel(provider: EmbedProvider): string {
	return provider === "apple_music"
		? "Apple Music"
		: provider === "youtube_music"
			? "YouTube Music"
			: provider.charAt(0).toUpperCase() + provider.slice(1);
}
