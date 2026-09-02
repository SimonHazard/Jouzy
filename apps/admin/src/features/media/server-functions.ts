import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "../auth/server-functions.js";
import { listMedia, removeMedia, uploadMedia } from "./media-service.server.js";

const protectedMedia = createServerFn().middleware([authMiddleware]);

export const listMediaFn = protectedMedia.handler(({ context }) =>
	listMedia(context.identity),
);

export const uploadMediaFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: unknown) => input)
	.handler(async ({ data, context }) => {
		if (!(data instanceof FormData))
			throw new Error("Le formulaire média est invalide.");
		const file = data.get("file");
		if (!(file instanceof File))
			throw new Error("Un fichier image est requis.");
		return uploadMedia(context.identity, file, {
			altText: data.get("altText"),
			caption: data.get("caption") || null,
			credit: data.get("credit") || null,
		});
	});

export const removeMediaFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: { mediaAssetId: string }) => input)
	.handler(({ data, context }) =>
		removeMedia(context.identity, data.mediaAssetId),
	);
