type SchemaObject = {
	type: "table" | "index";
	name: string;
};

type WranglerResult = {
	results?: SchemaObject[];
};

const expectedTables = [
	"authors",
	"author_social_links",
	"articles",
	"article_slug_redirects",
	"article_games",
	"article_tags",
	"article_links",
	"games",
	"game_store_links",
	"platforms",
	"genres",
	"tags",
	"game_platforms",
	"game_genres",
	"media_assets",
	"article_media",
	"article_embeds",
	"d1_migrations",
] as const;

const expectedIndexes = [
	"authors_email_unique",
	"authors_slug_unique",
	"articles_slug_unique",
	"articles_status_published_at_idx",
	"articles_author_status_updated_at_idx",
	"article_slug_redirects_old_slug_unique",
	"article_games_primary_unique",
	"games_slug_unique",
	"media_assets_r2_key_unique",
] as const;

const query = `SELECT type, name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY type, name`;

async function run(): Promise<void> {
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
			`--command=${query}`,
		],
		{ stdout: "pipe", stderr: "pipe" },
	);
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
		process.exited,
	]);
	if (exitCode !== 0) {
		throw new Error(
			`Le contrôle D1 local a échoué (${exitCode}). ${stderr.trim()}`,
		);
	}

	const jsonStart = stdout.indexOf("[");
	if (jsonStart < 0) {
		throw new Error("La sortie JSON du contrôle D1 local est introuvable.");
	}
	const payload = JSON.parse(stdout.slice(jsonStart)) as WranglerResult[];
	const objects = payload[0]?.results ?? [];
	const tables = new Set(
		objects
			.filter((object) => object.type === "table")
			.map((object) => object.name),
	);
	const indexes = new Set(
		objects
			.filter((object) => object.type === "index")
			.map((object) => object.name),
	);
	const missingTables = expectedTables.filter((name) => !tables.has(name));
	const missingIndexes = expectedIndexes.filter((name) => !indexes.has(name));
	if (missingTables.length > 0 || missingIndexes.length > 0) {
		throw new Error(
			`Schéma D1 local incomplet. Tables manquantes: ${missingTables.join(", ") || "aucune"}. Index manquants: ${missingIndexes.join(", ") || "aucun"}.`,
		);
	}
	console.log(
		`Local D1 schema OK: ${expectedTables.length} tables, ${expectedIndexes.length} indexes.`,
	);
}

await run();
