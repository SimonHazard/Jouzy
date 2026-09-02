import type { EmbedProvider, EmbedType } from "@jouzy/domain";
import { validateHttpsUrl } from "@jouzy/domain";

export interface EmbedProviderDefinition {
	provider: EmbedProvider;
	label: string;
	kinds: readonly EmbedType[];
	inputDomains: readonly string[];
	parse: (url: URL) => string | null;
	canonical: (url: URL, id: string) => string;
	embed: (url: URL, id: string, kind: EmbedType) => string;
	iframe: { sandbox: string; allow: string; referrerPolicy: ReferrerPolicy };
}

const id = (value: string | undefined): string | null =>
	value && /^[A-Za-z0-9_-]{2,160}$/.test(value) ? value : null;

const host = (value: string, ...domains: string[]) =>
	domains.some((domain) => value === domain || value.endsWith(`.${domain}`));

const baseIframe = {
	sandbox: "allow-scripts allow-same-origin allow-popups allow-presentation",
	allow:
		"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
	referrerPolicy: "strict-origin-when-cross-origin" as ReferrerPolicy,
};

export const embedProviders: Readonly<
	Record<EmbedProvider, EmbedProviderDefinition>
> = {
	youtube: {
		provider: "youtube",
		label: "YouTube",
		kinds: ["video"],
		inputDomains: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
		parse: (url) => {
			if (url.hostname === "youtu.be") return id(url.pathname.slice(1));
			return id(
				url.searchParams.get("v") ??
					url.pathname.match(/\/(?:shorts|embed)\/([^/]+)/)?.[1],
			);
		},
		canonical: (_url, videoId) => `https://www.youtube.com/watch?v=${videoId}`,
		embed: (_url, videoId) =>
			`https://www.youtube-nocookie.com/embed/${videoId}`,
		iframe: baseIframe,
	},
	vimeo: {
		provider: "vimeo",
		label: "Vimeo",
		kinds: ["video"],
		inputDomains: ["vimeo.com", "player.vimeo.com"],
		parse: (url) => id(url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1]),
		canonical: (_url, videoId) => `https://vimeo.com/${videoId}`,
		embed: (_url, videoId) => `https://player.vimeo.com/video/${videoId}`,
		iframe: baseIframe,
	},
	spotify: {
		provider: "spotify",
		label: "Spotify",
		kinds: ["music"],
		inputDomains: ["spotify.com", "open.spotify.com"],
		parse: (url) =>
			id(
				url.pathname.match(
					/\/(track|album|playlist|episode|show)\/([^/]+)/,
				)?.[2],
			),
		canonical: (url, itemId) =>
			`https://open.spotify.com${url.pathname.replace(/\/$/, "") || `/track/${itemId}`}`,
		embed: (url, itemId) => {
			const kind =
				url.pathname.match(/\/(track|album|playlist|episode|show)\//)?.[1] ??
				"track";
			return `https://open.spotify.com/embed/${kind}/${itemId}`;
		},
		iframe: {
			...baseIframe,
			allow:
				"autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
		},
	},
	apple_music: {
		provider: "apple_music",
		label: "Apple Music",
		kinds: ["music"],
		inputDomains: ["music.apple.com"],
		parse: (url) =>
			id(
				url.pathname.match(
					/\/(?:album|playlist|song)\/[^/]+\/(?:id)?(\d+)/,
				)?.[1],
			),
		canonical: (url) => `https://music.apple.com${url.pathname}`,
		embed: (url) => `https://embed.music.apple.com${url.pathname}`,
		iframe: {
			...baseIframe,
			allow: "autoplay; encrypted-media; fullscreen; picture-in-picture",
		},
	},
	youtube_music: {
		provider: "youtube_music",
		label: "YouTube Music",
		kinds: ["music"],
		inputDomains: ["music.youtube.com"],
		parse: (url) => id(url.searchParams.get("v") ?? undefined),
		canonical: (_url, videoId) =>
			`https://music.youtube.com/watch?v=${videoId}`,
		embed: (_url, videoId) =>
			`https://www.youtube-nocookie.com/embed/${videoId}`,
		iframe: baseIframe,
	},
	bandcamp: {
		provider: "bandcamp",
		label: "Bandcamp",
		kinds: ["music"],
		inputDomains: ["bandcamp.com"],
		parse: (url) => id(url.pathname.match(/\/(?:track|album)\/([^/]+)/)?.[1]),
		canonical: (url) =>
			`https://${url.hostname}${url.pathname.replace(/\/$/, "")}`,
		embed: (url, itemId) =>
			`https://bandcamp.com/EmbeddedPlayer/${url.pathname.includes("/album/") ? "album" : "track"}=${itemId}/size=large/bgcol=ffffff/linkcol=0687f5/transparent=true/`,
		iframe: {
			...baseIframe,
			allow: "autoplay; fullscreen; picture-in-picture",
		},
	},
	soundcloud: {
		provider: "soundcloud",
		label: "SoundCloud",
		kinds: ["music"],
		inputDomains: ["soundcloud.com"],
		parse: (url) => {
			const parts = url.pathname.split("/").filter(Boolean);
			return parts.length >= 2 && parts.length <= 3 ? id(parts.at(-1)) : null;
		},
		canonical: (url) =>
			`https://${url.hostname}${url.pathname.replace(/\/$/, "")}`,
		embed: (url) =>
			`https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://${url.hostname}${url.pathname}`)}`,
		iframe: { ...baseIframe, allow: "autoplay" },
	},
};

export interface NormalizedEmbed {
	provider: EmbedProvider;
	type: EmbedType;
	canonicalUrl: string;
	embedUrl: string;
	label: string;
	iframe: EmbedProviderDefinition["iframe"];
}

export function normalizeEmbedUrl(
	type: EmbedType,
	provider: EmbedProvider,
	value: string,
): NormalizedEmbed {
	const definition = embedProviders[provider];
	if (!definition.kinds.includes(type))
		throw new Error("Le type ne correspond pas au fournisseur.");
	const url = new URL(validateHttpsUrl(value));
	if (!host(url.hostname.toLowerCase(), ...definition.inputDomains))
		throw new Error("Le domaine ne correspond pas au fournisseur.");
	const parsedId = definition.parse(url);
	if (!parsedId)
		throw new Error("L’URL du média ne contient pas un identifiant reconnu.");
	return {
		provider,
		type,
		canonicalUrl: definition.canonical(url, parsedId),
		embedUrl: definition.embed(url, parsedId, type),
		label: definition.label,
		iframe: definition.iframe,
	};
}
