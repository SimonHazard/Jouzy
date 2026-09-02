import type { EmbedProvider, EmbedType } from "@jouzy/domain";

export function serializeImageDirective(assetId: string): string {
	if (!assetId.trim()) throw new Error("Un assetId est requis.");
	return `::jouzy-image{assetId="${assetId.trim()}"}`;
}

export function serializeEmbedDirective(
	kind: EmbedType,
	provider: EmbedProvider,
	url: string,
): string {
	return `::jouzy-embed{kind="${kind}" provider="${provider}" url="${url}"}`;
}
