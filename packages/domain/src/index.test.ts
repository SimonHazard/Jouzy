import { describe, expect, it } from "vitest";

describe("domain package", () => {
	it("is importable", async () => {
		await expect(import("./index")).resolves.toBeDefined();
	});
});
