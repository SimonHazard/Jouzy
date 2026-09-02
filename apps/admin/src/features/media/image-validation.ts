export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface ValidatedImage {
	mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
	extension: "jpg" | "png" | "webp" | "avif";
	width: number;
	height: number;
}

function u32(view: DataView, offset: number): number {
	return view.getUint32(offset, false);
}

function byte(bytes: Uint8Array, offset: number): number {
	return bytes[offset] ?? 0;
}

function dimensionsPng(bytes: Uint8Array): [number, number] | null {
	if (
		bytes.length < 24 ||
		u32(new DataView(bytes.buffer, bytes.byteOffset), 16) === 0
	)
		return null;
	const view = new DataView(bytes.buffer, bytes.byteOffset);
	return [view.getUint32(16, false), view.getUint32(20, false)];
}

function dimensionsJpeg(bytes: Uint8Array): [number, number] | null {
	let offset = 2;
	const view = new DataView(bytes.buffer, bytes.byteOffset);
	while (offset + 9 < bytes.length) {
		if (bytes[offset] !== 0xff) {
			offset += 1;
			continue;
		}
		const marker = bytes[offset + 1] ?? 0;
		if (
			marker === 0xd8 ||
			marker === 0xd9 ||
			(marker >= 0xd0 && marker <= 0xd7)
		) {
			offset += 2;
			continue;
		}
		const length = view.getUint16(offset + 2, false);
		if (length < 2 || offset + 2 + length > bytes.length) return null;
		const isFrame =
			(marker >= 0xc0 && marker <= 0xc3) ||
			(marker >= 0xc5 && marker <= 0xc7) ||
			(marker >= 0xc9 && marker <= 0xcb) ||
			(marker >= 0xcd && marker <= 0xcf);
		if (isFrame)
			return [
				view.getUint16(offset + 7, false),
				view.getUint16(offset + 5, false),
			];
		offset += 2 + length;
	}
	return null;
}

function dimensionsWebp(bytes: Uint8Array): [number, number] | null {
	if (bytes.length < 30) return null;
	const view = new DataView(bytes.buffer, bytes.byteOffset);
	const chunk = String.fromCharCode(...bytes.subarray(12, 16));
	if (chunk === "VP8X")
		return [
			1 + byte(bytes, 24) + (byte(bytes, 25) << 8) + (byte(bytes, 26) << 16),
			1 + byte(bytes, 27) + (byte(bytes, 28) << 8) + (byte(bytes, 29) << 16),
		];
	if (chunk === "VP8 ")
		return [
			view.getUint16(26, true) & 0x3fff,
			view.getUint16(28, true) & 0x3fff,
		];
	if (chunk === "VP8L")
		return [
			1 + ((byte(bytes, 21) & 0x3f) | ((byte(bytes, 22) & 0x3f) << 8)),
			1 +
				((byte(bytes, 22) >> 6) |
					(byte(bytes, 23) << 2) |
					((byte(bytes, 24) & 0x0f) << 10)),
		];
	return null;
}

function dimensionsAvif(bytes: Uint8Array): [number, number] | null {
	const view = new DataView(bytes.buffer, bytes.byteOffset);
	for (let offset = 4; offset + 20 <= bytes.length; offset += 1) {
		if (
			bytes[offset] === 0x69 &&
			bytes[offset + 1] === 0x73 &&
			bytes[offset + 2] === 0x70 &&
			bytes[offset + 3] === 0x65
		)
			return [
				view.getUint32(offset + 8, false),
				view.getUint32(offset + 12, false),
			];
	}
	return null;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
	return String.fromCharCode(...bytes.subarray(start, start + length));
}

export function validateImageBytes(bytes: Uint8Array): ValidatedImage {
	if (bytes.byteLength > MAX_IMAGE_BYTES)
		throw new Error("L’image dépasse la limite de 10 Mio.");
	let result: ValidatedImage | null = null;
	if (bytes.length >= 24 && ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") {
		const dimensions = dimensionsPng(bytes);
		if (dimensions)
			result = {
				mimeType: "image/png",
				extension: "png",
				width: dimensions[0],
				height: dimensions[1],
			};
	} else if (
		bytes.length >= 3 &&
		bytes[0] === 0xff &&
		bytes[1] === 0xd8 &&
		bytes[2] === 0xff
	) {
		const dimensions = dimensionsJpeg(bytes);
		if (dimensions)
			result = {
				mimeType: "image/jpeg",
				extension: "jpg",
				width: dimensions[0],
				height: dimensions[1],
			};
	} else if (
		bytes.length >= 16 &&
		ascii(bytes, 0, 4) === "RIFF" &&
		ascii(bytes, 8, 4) === "WEBP"
	) {
		const dimensions = dimensionsWebp(bytes);
		if (dimensions)
			result = {
				mimeType: "image/webp",
				extension: "webp",
				width: dimensions[0],
				height: dimensions[1],
			};
	} else if (
		bytes.length >= 16 &&
		ascii(bytes, 4, 4) === "ftyp" &&
		["avif", "avis"].includes(ascii(bytes, 8, 4))
	) {
		const dimensions = dimensionsAvif(bytes);
		if (dimensions)
			result = {
				mimeType: "image/avif",
				extension: "avif",
				width: dimensions[0],
				height: dimensions[1],
			};
	}
	if (!result || result.width < 1 || result.height < 1)
		throw new Error(
			"Le fichier n’est pas une image JPEG, PNG, WebP ou AVIF valide.",
		);
	return result;
}
