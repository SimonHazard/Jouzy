import { readFileSync } from "node:fs";

export const EXPECTED_ENV_KEYS = [
	"CLOUDFLARE_ACCOUNT_ID",
	"CLOUDFLARE_API_TOKEN",
	"CLOUDFLARE_ZONE_ID",
	"CLOUDFLARE_D1_DATABASE_ID",
	"CLOUDFLARE_R2_BUCKET_NAME",
	"PUBLIC_SITE_URL",
	"ADMIN_SITE_URL",
	"R2_PUBLIC_BASE_URL",
	"PUBLIC_WEB_ANALYTICS_TOKEN",
	"ACCESS_TEAM_DOMAIN",
	"ACCESS_AUD",
	"DEV_AUTH_EMAIL",
	"BOOTSTRAP_ADMIN_EMAIL",
	"LEGAL_PUBLISHER_NAME",
	"LEGAL_PUBLISHER_STATUS",
	"LEGAL_PUBLISHER_ADDRESS",
	"LEGAL_CONTACT_EMAIL",
	"LEGAL_CONTACT_PHONE",
	"LEGAL_REGISTRATION",
	"LEGAL_VAT_NUMBER",
	"LEGAL_PUBLICATION_DIRECTOR",
	"LEGAL_HOST_NAME",
	"LEGAL_HOST_ADDRESS",
	"LEGAL_HOST_PHONE",
] as const;

const SECRET_KEYS = new Set([
	"CLOUDFLARE_API_TOKEN",
	"PUBLIC_WEB_ANALYTICS_TOKEN",
	"ACCESS_AUD",
]);

function parseEnvExample(source: string): Map<string, string> {
	const values = new Map<string, string>();

	for (const line of source.split(/\r?\n/u)) {
		const match = line.match(/^([A-Z][A-Z0-9_]*)=(?:"([^"]*)"|([^\s#]+))$/u);
		if (match) values.set(match[1], match[2] ?? match[3] ?? "");
	}

	return values;
}

function looksLikeRealSecret(key: string, value: string): boolean {
	if (!SECRET_KEYS.has(key)) return false;
	if (value === "replace-me" || value === "replace-me-if-applicable")
		return false;
	if (value.includes("example.com") || value.includes("example.cloudflare.com"))
		return false;
	return value.length >= 24 || /^(?:eyJ|sk_|cf_|ghp_)/u.test(value);
}

export function validateEnvExample(source: string): string[] {
	const values = parseEnvExample(source);
	const errors: string[] = [];

	for (const key of EXPECTED_ENV_KEYS) {
		if (!values.has(key)) errors.push(`missing key: ${key}`);
	}

	for (const [key, value] of values) {
		if (looksLikeRealSecret(key, value))
			errors.push(`secret-like value: ${key}`);
	}

	return errors;
}

if (import.meta.main) {
	const source = readFileSync(
		new URL("../.env.example", import.meta.url),
		"utf8",
	);
	const errors = validateEnvExample(source);
	if (errors.length > 0) {
		throw new Error(`Environment contract failed: ${errors.join(", ")}`);
	}
	console.log("Environment example contract is valid.");
}
