import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import * as schema from "./index.js";

const requiredTables = [
	"authors",
	"authorSocialLinks",
	"articles",
	"articleSlugRedirects",
	"articleGames",
	"articleTags",
	"articleLinks",
	"games",
	"gameStoreLinks",
	"platforms",
	"genres",
	"tags",
	"gamePlatforms",
	"gameGenres",
	"mediaAssets",
	"articleMedia",
	"articleEmbeds",
] as const;

describe("D1 schema", () => {
	it("exports every normalized V1 table", () => {
		for (const table of requiredTables) {
			expect(schema).toHaveProperty(table);
		}
	});

	it("uses SQLite table names and no Postgres-only columns", () => {
		expect(getTableName(schema.articles)).toBe("articles");
		expect(getTableName(schema.mediaAssets)).toBe("media_assets");
		expect(schema.articles).not.toHaveProperty("jsonb");
	});
});
