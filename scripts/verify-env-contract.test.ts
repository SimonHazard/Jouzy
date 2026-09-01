import { describe, expect, it } from "vitest";

import { EXPECTED_ENV_KEYS, validateEnvExample } from "./verify-env-contract";

const fixture = EXPECTED_ENV_KEYS.map((key) => `${key}="replace-me"`).join(
	"\n",
);

describe("environment contract", () => {
	it("accepts the fake example values", () => {
		expect(validateEnvExample(fixture)).toEqual([]);
	});

	it("rejects a missing key", () => {
		expect(
			validateEnvExample(
				fixture.replace('CLOUDFLARE_ZONE_ID="replace-me"\n', ""),
			),
		).toContain("missing key: CLOUDFLARE_ZONE_ID");
	});

	it("rejects a plausible secret without exposing it", () => {
		expect(
			validateEnvExample(
				fixture.replace(
					'CLOUDFLARE_API_TOKEN="replace-me"',
					'CLOUDFLARE_API_TOKEN="ghp_123456789012345678901234567890"',
				),
			),
		).toContain("secret-like value: CLOUDFLARE_API_TOKEN");
	});
});
