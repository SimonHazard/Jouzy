import { describe, expect, it } from "vitest";

describe("config package", () => {
	it("is importable", async () => {
		await expect(import("./index")).resolves.toBeDefined();
	});
});
