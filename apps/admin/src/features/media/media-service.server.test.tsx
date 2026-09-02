import type { MediaAssetDto } from "@jouzy/db/queries/admin";
import type { AuthorizationIdentity } from "@jouzy/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
	const media: MediaAssetDto = {
		id: "media-uploaded-0001",
		r2Key: "media/2026/uploaded.png",
		originalFilename: "fixture.png",
		mimeType: "image/png",
		sizeBytes: 24,
		width: 512,
		height: 256,
		altText: "Fixture uploadée",
		caption: "Légende de fixture",
		credit: "Jouzy test",
		uploadedByAuthorId: "author-admin-0001",
		createdAt: 1_757_000_000_000,
	};
	const bucket = {
		put: vi.fn(async (..._args: [string, Uint8Array, unknown?]) => undefined),
		delete: vi.fn(async (_key: string) => undefined),
	};
	return {
		db: {} as never,
		bucket,
		media,
		createMediaAsset: vi.fn(async () => media),
		getMediaAsset: vi.fn(async () => null),
		listMediaAssets: vi.fn(async () => [media]),
		deleteMediaAsset: vi.fn(async () => undefined),
		assertMediaAssetOrphaned: vi.fn(async () => undefined),
	};
});

vi.mock("../../server/db.js", () => ({ getDatabase: () => state.db }));
vi.mock("../runtime.server.js", () => ({
	getRuntimeEnv: () => ({
		R2_PUBLIC_BASE_URL: "https://media.example.test/",
		MEDIA: state.bucket,
	}),
}));
vi.mock("@jouzy/db/queries/admin", () => state);

import { uploadMedia } from "./media-service.server.js";

const admin: AuthorizationIdentity = {
	authorId: "author-admin-0001",
	email: "admin@example.test",
	role: "admin",
	status: "active",
	displayName: "Administrateur Jouzy",
};

function pngFixture(): Uint8Array {
	return new Uint8Array([
		137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 2, 0, 0,
		0, 1, 0,
	]);
}

describe("uploadMedia avec un bucket R2 mocké", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		state.createMediaAsset.mockResolvedValue(state.media);
	});

	it("valide le contenu puis écrit une ligne media_assets cohérente", async () => {
		const bytes = pngFixture();
		const result = await uploadMedia(
			admin,
			new File([bytes.buffer as ArrayBuffer], "fixture.png", {
				type: "text/plain",
			}),
			{
				altText: "Fixture uploadée",
				caption: "Légende de fixture",
				credit: "Jouzy test",
			},
		);

		expect(state.bucket.put).toHaveBeenCalledTimes(1);
		const firstPut = state.bucket.put.mock.calls[0];
		expect(firstPut).toBeDefined();
		if (!firstPut) throw new Error("R2 put fixture missing");
		const [key, storedBytes, options] = firstPut;
		expect(key).toMatch(/^media\/2026\/[0-9a-f-]+\.png$/);
		expect(storedBytes).toEqual(bytes);
		expect(options).toMatchObject({
			httpMetadata: {
				contentType: "image/png",
				cacheControl: "public, max-age=31536000, immutable",
			},
			customMetadata: { altText: "Fixture uploadée" },
		});
		expect(state.createMediaAsset).toHaveBeenCalledWith(state.db, {
			r2Key: key,
			originalFilename: "fixture.png",
			mimeType: "image/png",
			sizeBytes: 24,
			width: 512,
			height: 256,
			altText: "Fixture uploadée",
			caption: "Légende de fixture",
			credit: "Jouzy test",
			uploadedByAuthorId: admin.authorId,
		});
		expect(result.publicUrl).toBe(
			"https://media.example.test/media/2026/uploaded.png",
		);
	});

	it("compense l’objet R2 si l’écriture D1 échoue", async () => {
		state.createMediaAsset.mockRejectedValueOnce(new Error("D1 indisponible"));
		const bytes = pngFixture();

		await expect(
			uploadMedia(
				admin,
				new File([bytes.buffer as ArrayBuffer], "fixture.png", {
					type: "image/png",
				}),
				{ altText: "Fixture à compenser" },
			),
		).rejects.toThrow("objet a été compensé");
		expect(state.bucket.put).toHaveBeenCalledTimes(1);
		const firstPut = state.bucket.put.mock.calls[0];
		expect(firstPut).toBeDefined();
		if (!firstPut) throw new Error("R2 put fixture missing");
		expect(state.bucket.delete).toHaveBeenCalledWith(firstPut[0]);
	});
});
