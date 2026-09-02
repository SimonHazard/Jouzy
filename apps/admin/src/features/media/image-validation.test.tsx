import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, validateImageBytes } from "./image-validation.js";

const png = () => {
	const bytes = new Uint8Array(24);
	bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	bytes.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8);
	bytes.set([0, 0, 2, 0], 16);
	bytes.set([0, 0, 1, 0], 20);
	return bytes;
};
const webp = () => {
	const bytes = new Uint8Array(30);
	bytes.set(
		[..."RIFF"].map((value) => value.charCodeAt(0)),
		0,
	);
	bytes.set(
		[..."WEBP"].map((value) => value.charCodeAt(0)),
		8,
	);
	bytes.set(
		[..."VP8X"].map((value) => value.charCodeAt(0)),
		12,
	);
	bytes[24] = 199;
	bytes[27] = 99;
	return bytes;
};
const avif = () => {
	const bytes = new Uint8Array(36);
	bytes.set(
		[..."ftypavif"].map((value) => value.charCodeAt(0)),
		4,
	);
	bytes.set(
		[..."ispe"].map((value) => value.charCodeAt(0)),
		16,
	);
	bytes.set([0, 0, 4, 0], 24);
	bytes.set([0, 0, 2, 0], 28);
	return bytes;
};
const jpeg = () =>
	new Uint8Array([
		0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0, 2, 0, 3, 3, 1, 0, 2, 17, 0, 3, 17, 0,
		0xff, 0xd9,
	]);

describe("image validation", () => {
	it("detects real signatures and dimensions", () => {
		expect(validateImageBytes(png())).toMatchObject({
			mimeType: "image/png",
			width: 512,
			height: 256,
		});
		expect(validateImageBytes(jpeg())).toMatchObject({
			mimeType: "image/jpeg",
			width: 3,
			height: 2,
		});
		expect(validateImageBytes(webp())).toMatchObject({
			mimeType: "image/webp",
			width: 200,
			height: 100,
		});
		expect(validateImageBytes(avif())).toMatchObject({
			mimeType: "image/avif",
			width: 1024,
			height: 512,
		});
	});

	it("accepts exactly 10 Mio only when the bytes are a valid image", () => {
		const bytes = png();
		const padded = new Uint8Array(MAX_IMAGE_BYTES);
		padded.set(bytes);
		expect(() => validateImageBytes(padded)).not.toThrow();
		expect(() =>
			validateImageBytes(new Uint8Array(MAX_IMAGE_BYTES + 1)),
		).toThrow("10 Mio");
		expect(() => validateImageBytes(new Uint8Array([0, 1, 2]))).toThrow();
	});
});
