import { describe, expect, it } from "vitest";

describe("ui package", () => {
	it("is importable", async () => {
		await expect(import("./index")).resolves.toBeDefined();
	});
});
