CREATE TABLE `article_embeds` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`directive_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`canonical_url` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_embeds_article_directive_unique` ON `article_embeds` (`article_id`,`directive_id`);--> statement-breakpoint
CREATE INDEX `article_embeds_article_idx` ON `article_embeds` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_games` (
	`article_id` text NOT NULL,
	`game_id` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`article_id`, `game_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `article_games_article_idx` ON `article_games` (`article_id`);--> statement-breakpoint
CREATE INDEX `article_games_game_idx` ON `article_games` (`game_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `article_games_primary_unique` ON `article_games` (`article_id`) WHERE "article_games"."is_primary" = 1;--> statement-breakpoint
CREATE TABLE `article_links` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`provider` text NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`is_affiliate` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_links_article_idx` ON `article_links` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_media` (
	`article_id` text NOT NULL,
	`media_asset_id` text NOT NULL,
	PRIMARY KEY(`article_id`, `media_asset_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `article_media_article_idx` ON `article_media` (`article_id`);--> statement-breakpoint
CREATE INDEX `article_media_media_asset_idx` ON `article_media` (`media_asset_id`);--> statement-breakpoint
CREATE TABLE `article_slug_redirects` (
	`id` text PRIMARY KEY NOT NULL,
	`old_slug` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_slug_redirects_old_slug_unique` ON `article_slug_redirects` (`old_slug`);--> statement-breakpoint
CREATE INDEX `article_slug_redirects_article_idx` ON `article_slug_redirects` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_tags` (
	`article_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`article_id`, `tag_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `article_tags_article_idx` ON `article_tags` (`article_id`);--> statement-breakpoint
CREATE INDEX `article_tags_tag_idx` ON `article_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`author_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`body_markdown` text DEFAULT '' NOT NULL,
	`hero_media_id` text,
	`score_half_steps` integer,
	`verdict` text,
	`featured` integer DEFAULT false NOT NULL,
	`final_review_id` text,
	`has_material_benefit` integer DEFAULT false NOT NULL,
	`disclosure` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`hero_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`final_review_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "articles_type_check" CHECK("articles"."type" IN ('review', 'first_impression', 'article')),
	CONSTRAINT "articles_status_check" CHECK("articles"."status" IN ('draft', 'published')),
	CONSTRAINT "articles_score_check" CHECK("articles"."score_half_steps" IS NULL OR ("articles"."score_half_steps" BETWEEN 0 AND 20 AND "articles"."score_half_steps" = CAST("articles"."score_half_steps" AS INTEGER)))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `articles_status_published_at_idx` ON `articles` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `articles_author_status_updated_at_idx` ON `articles` (`author_id`,`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `articles_title_idx` ON `articles` (`title`);--> statement-breakpoint
CREATE TABLE `author_social_links` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`provider` text NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `author_social_links_author_idx` ON `author_social_links` (`author_id`);--> statement-breakpoint
CREATE TABLE `authors` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`slug` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`avatar_media_id` text,
	`public_email` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`avatar_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "authors_role_check" CHECK("authors"."role" IN ('admin', 'author')),
	CONSTRAINT "authors_status_check" CHECK("authors"."status" IN ('active', 'disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authors_email_unique` ON `authors` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `authors_slug_unique` ON `authors` (`slug`);--> statement-breakpoint
CREATE INDEX `authors_status_updated_at_idx` ON `authors` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `game_store_links` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`platform` text NOT NULL,
	`provider` text NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `game_store_links_game_idx` ON `game_store_links` (`game_id`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`cover_media_id` text,
	`developer` text,
	`publisher` text,
	`release_date` text,
	`release_date_precision` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "games_release_date_precision_check" CHECK("games"."release_date_precision" IS NULL OR "games"."release_date_precision" IN ('day', 'month', 'year', 'unknown'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_slug_unique` ON `games` (`slug`);--> statement-breakpoint
CREATE INDEX `games_title_idx` ON `games` (`title`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`alt_text` text NOT NULL,
	`caption` text,
	`credit` text,
	`uploaded_by_author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by_author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_r2_key_unique` ON `media_assets` (`r2_key`);--> statement-breakpoint
CREATE INDEX `media_assets_uploaded_by_author_idx` ON `media_assets` (`uploaded_by_author_id`);--> statement-breakpoint
CREATE TABLE `game_genres` (
	`game_id` text NOT NULL,
	`genre_id` text NOT NULL,
	PRIMARY KEY(`game_id`, `genre_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `game_genres_game_idx` ON `game_genres` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_genres_genre_idx` ON `game_genres` (`genre_id`);--> statement-breakpoint
CREATE TABLE `game_platforms` (
	`game_id` text NOT NULL,
	`platform_id` text NOT NULL,
	PRIMARY KEY(`game_id`, `platform_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `game_platforms_game_idx` ON `game_platforms` (`game_id`);--> statement-breakpoint
CREATE INDEX `game_platforms_platform_idx` ON `game_platforms` (`platform_id`);--> statement-breakpoint
CREATE TABLE `genres` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `genres_slug_unique` ON `genres` (`slug`);--> statement-breakpoint
CREATE TABLE `platforms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platforms_slug_unique` ON `platforms` (`slug`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);