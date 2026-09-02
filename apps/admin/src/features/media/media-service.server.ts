import {
	createMediaAsset,
	deleteMediaAsset,
	getMediaAsset,
	listMediaAssets,
} from "@jouzy/db/queries/admin";
import {
	type AuthorizationIdentity,
	assertPermission,
	parseMediaUploadInput,
} from "@jouzy/domain";
import { getDatabase } from "../../server/db.js";
import { getRuntimeEnv } from "../runtime.server.js";
import { MAX_IMAGE_BYTES, validateImageBytes } from "./image-validation.js";

function publicUrl(key: string): string {
	const base = getRuntimeEnv().R2_PUBLIC_BASE_URL.replace(/\/$/, "");
	return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export type MediaAssetWithUrl = Awaited<
	ReturnType<typeof listMediaAssets>
>[number] & { publicUrl: string };

export async function listMedia(
	identity: AuthorizationIdentity,
): Promise<MediaAssetWithUrl[]> {
	assertPermission(identity.status === "active");
	return (await listMediaAssets(getDatabase())).map((media) => ({
		...media,
		publicUrl: publicUrl(media.r2Key),
	}));
}

export async function uploadMedia(
	identity: AuthorizationIdentity,
	file: File,
	metadata: unknown,
): Promise<MediaAssetWithUrl> {
	assertPermission(identity.status === "active");
	const input = parseMediaUploadInput(metadata);
	if (file.size > MAX_IMAGE_BYTES)
		throw new Error("L’image dépasse la limite de 10 Mio.");
	const bytes = new Uint8Array(await file.arrayBuffer());
	const image = validateImageBytes(bytes);
	const key = `media/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${image.extension}`;
	const bucket = getRuntimeEnv().MEDIA;
	await bucket.put(key, bytes, {
		httpMetadata: {
			contentType: image.mimeType,
			cacheControl: "public, max-age=31536000, immutable",
		},
		customMetadata: { altText: input.altText },
	});
	try {
		const media = await createMediaAsset(getDatabase(), {
			r2Key: key,
			originalFilename: file.name.slice(0, 255),
			mimeType: image.mimeType,
			sizeBytes: bytes.byteLength,
			width: image.width,
			height: image.height,
			altText: input.altText,
			caption: input.caption ?? null,
			credit: input.credit ?? null,
			uploadedByAuthorId: identity.authorId,
		});
		return { ...media, publicUrl: publicUrl(media.r2Key) };
	} catch (error) {
		await bucket.delete(key);
		throw new Error(
			"L’image a été téléversée mais n’a pas pu être enregistrée en base ; l’objet a été compensé.",
			{ cause: error },
		);
	}
}

export async function removeMedia(
	identity: AuthorizationIdentity,
	mediaAssetId: string,
): Promise<void> {
	assertPermission(
		identity.status === "active" &&
			(identity.role === "admin" ||
				(await getMediaAsset(getDatabase(), mediaAssetId))
					?.uploadedByAuthorId === identity.authorId),
	);
	const media = await getMediaAsset(getDatabase(), mediaAssetId);
	if (!media) throw new Error("L’image est introuvable.");
	const bucket = getRuntimeEnv().MEDIA;
	await (await import("@jouzy/db/queries/admin")).assertMediaAssetOrphaned(
		getDatabase(),
		mediaAssetId,
	);
	await bucket.delete(media.r2Key);
	try {
		await deleteMediaAsset(getDatabase(), mediaAssetId);
	} catch (error) {
		throw new Error(
			"L’objet R2 a été supprimé mais la ligne D1 n’a pas pu l’être ; vérifiez la bibliothèque média.",
			{ cause: error },
		);
	}
}
