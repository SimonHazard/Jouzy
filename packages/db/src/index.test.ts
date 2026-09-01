import { describe, expect, it } from "vitest";

describe("db package", () => {
	it("is importable", async () => {
		await expect(import("./index")).resolves.toBeDefined();
	});
});
