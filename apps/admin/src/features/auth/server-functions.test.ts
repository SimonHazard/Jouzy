import { describe, expect, it } from "vitest";

import { getCurrentIdentity } from "./server-functions.js";

describe("protected auth server functions", () => {
	it("is exported as a TanStack server function", () => {
		expect(typeof getCurrentIdentity).toBe("function");
	});
});
