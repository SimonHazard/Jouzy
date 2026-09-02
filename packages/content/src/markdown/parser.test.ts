import { describe, expect, it } from "vitest";
import { normalizeEmbedUrl } from "../embeds/providers.js";
import { parseArticleMarkdown } from "./parser.js";
import { MarkdownValidationError } from "./types.js";

describe("safe article markdown", () => {
	it("parses GFM and canonical Jouzy directives", () => {
		const document = parseArticleMarkdown(
			`# Une review\n\nUn **texte** avec [un lien](https://example.com).\n\n- premier\n- second\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n::jouzy-image{assetId="asset-1"}\n\n::jouzy-embed{provider="youtube" url="https://youtu.be/abc123" kind="video"}`,
		);
		expect(document.media).toHaveLength(1);
		expect(document.media[0]?.assetId).toBe("asset-1");
		expect(document.embeds[0]).toMatchObject({
			provider: "youtube",
			canonicalUrl: "https://www.youtube.com/watch?v=abc123",
			embedUrl: "https://www.youtube-nocookie.com/embed/abc123",
		});
		expect(document.children.some((child) => child.type === "table")).toBe(
			true,
		);
	});

	it.each([
		["<script>alert(1)</script>", "HTML_REJECTED"],
		["[x](javascript:alert(1))", "INVALID_LINK"],
		["::jouzy-image{assetId=foo extra=bar}", "INVALID_DIRECTIVE"],
		["::unknown{value=foo}", "UNKNOWN_DIRECTIVE"],
		[
			"::jouzy-embed{kind=music provider=youtube url=https://youtu.be/abc123}",
			"INVALID_EMBED",
		],
	] as const)("rejects %s", (source, code) => {
		expect(() => parseArticleMarkdown(source)).toThrowError(
			MarkdownValidationError,
		);
		try {
			parseArticleMarkdown(source);
		} catch (error) {
			expect((error as MarkdownValidationError).issue.code).toBe(code);
		}
	});

	it("normalizes every approved provider and keeps providers distinct", () => {
		const cases = [
			["video", "youtube", "https://www.youtube.com/watch?v=abc123"],
			["video", "vimeo", "https://vimeo.com/123456"],
			["music", "spotify", "https://open.spotify.com/track/abc123"],
			["music", "apple_music", "https://music.apple.com/us/album/album/123456"],
			["music", "youtube_music", "https://music.youtube.com/watch?v=abc123"],
			["music", "bandcamp", "https://artist.bandcamp.com/track/song"],
			["music", "soundcloud", "https://soundcloud.com/artist/song"],
		] as const;
		for (const [kind, provider, url] of cases)
			expect(normalizeEmbedUrl(kind, provider, url).canonicalUrl).toMatch(
				/^https:\/\//,
			);
		expect(() =>
			normalizeEmbedUrl("music", "youtube", "https://youtu.be/abc123"),
		).toThrow();
		expect(() =>
			normalizeEmbedUrl("video", "youtube", "http://youtu.be/abc123"),
		).toThrow();
	});
});
