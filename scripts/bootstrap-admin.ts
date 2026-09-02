import { normalizeEmail } from "@jouzy/domain";

type BootstrapRow = {
	id: string;
	role: "admin" | "author";
	status: "active" | "disabled";
};

type WranglerPayload = Array<{ results?: BootstrapRow[] }>;

function sqlString(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

async function executeLocal(sql: string): Promise<BootstrapRow[]> {
	const process = Bun.spawn(
		[
			"bun",
			"run",
			"--cwd",
			"apps/admin",
			"wrangler",
			"d1",
			"execute",
			"jouzy",
			"--local",
			"--json",
			"--config",
			"wrangler.jsonc",
			`--command=${sql}`,
		],
		{ stdout: "pipe", stderr: "pipe" },
	);
	const [stdout, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		process.exited,
	]);
	if (exitCode !== 0) {
		throw new Error("La commande D1 locale a échoué.");
	}
	const jsonStart = stdout.indexOf("[");
	if (jsonStart < 0) throw new Error("La sortie D1 locale est invalide.");
	const payload = JSON.parse(stdout.slice(jsonStart)) as WranglerPayload;
	return payload[0]?.results ?? [];
}

async function run(): Promise<void> {
	const configuredEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
	if (!configuredEmail) {
		throw new Error(
			"BOOTSTRAP_ADMIN_EMAIL est requis ; aucun administrateur n’a été créé.",
		);
	}
	const email = normalizeEmail(configuredEmail);
	const existing = await executeLocal(
		`SELECT id, role, status FROM authors WHERE email = ${sqlString(email)} LIMIT 1`,
	);
	const profile = existing[0];
	if (profile) {
		if (profile.role === "admin" && profile.status === "active") {
			console.log("Bootstrap admin déjà configuré ; aucune mutation.");
			return;
		}
		throw new Error(
			"Un profil existe déjà avec cette identité mais n’est pas un administrateur actif ; décision opérateur requise.",
		);
	}

	const id = crypto.randomUUID();
	const now = Date.now();
	await executeLocal(
		[
			"INSERT INTO authors (id, email, role, status, slug, first_name, last_name, display_name, bio, public_email, created_at, updated_at)",
			`VALUES (${sqlString(id)}, ${sqlString(email)}, 'admin', 'active', 'administrateur-jouzy', 'Administrateur', 'Jouzy', 'Administrateur Jouzy', '', NULL, ${now}, ${now})`,
		].join(" "),
	);
	console.log(
		"Bootstrap admin créé localement. Ajoutez aussi cette identité à la politique Cloudflare Access.",
	);
}

await run();
