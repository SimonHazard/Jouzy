import type { ArticleType, EmbedProvider, EmbedType } from "@jouzy/domain";

export interface SourcePosition {
	line: number;
	column: number;
}

export interface MarkdownIssue {
	code: string;
	message: string;
	position: SourcePosition;
	field?: string;
}

export class MarkdownValidationError extends Error {
	readonly issue: MarkdownIssue;

	constructor(issue: MarkdownIssue) {
		super(
			`${issue.message} (ligne ${issue.position.line}, colonne ${issue.position.column})`,
		);
		this.name = "MarkdownValidationError";
		this.issue = issue;
	}
}

export type InlineNode =
	| { type: "text"; value: string }
	| { type: "strong"; children: InlineNode[] }
	| { type: "emphasis"; children: InlineNode[] }
	| { type: "delete"; children: InlineNode[] }
	| { type: "link"; url: string; title: string | null; children: InlineNode[] };

export type ArticleBlock =
	| { type: "heading"; depth: number; children: InlineNode[] }
	| { type: "paragraph"; children: InlineNode[] }
	| { type: "blockquote"; children: ArticleBlock[] }
	| {
			type: "list";
			ordered: boolean;
			start: number | null;
			children: ArticleBlock[][];
	  }
	| { type: "thematicBreak" }
	| {
			type: "table";
			align: Array<"left" | "right" | "center" | null>;
			rows: InlineNode[][][];
	  }
	| { type: "image"; assetId: string; directiveId: string }
	| { type: "embed"; embed: EmbedReference };

export interface MediaReference {
	assetId: string;
	directiveId: string;
	position: number;
}

export interface EmbedReference {
	directiveId: string;
	type: EmbedType;
	provider: EmbedProvider;
	canonicalUrl: string;
	embedUrl: string;
	label: string;
	iframe: { sandbox: string; allow: string; referrerPolicy: ReferrerPolicy };
	position: number;
}

export interface ArticleDocument {
	children: ArticleBlock[];
	media: MediaReference[];
	embeds: EmbedReference[];
}

export interface ArticleAsset {
	publicUrl: string;
	alt: string;
	caption: string | null;
	credit: string | null;
	width: number;
	height: number;
}

export type ArticleAssetMap = Readonly<Record<string, ArticleAsset>>;

export interface ArticleDraftInput {
	type: ArticleType;
	title: string;
	slug: string;
	excerpt: string;
	bodyMarkdown: string;
	heroMediaId: string | null;
	scoreHalfSteps: number | null;
	verdict: string | null;
	featured: boolean;
	finalReviewId: string | null;
	hasMaterialBenefit: boolean;
	disclosure: string | null;
	authorId?: string;
	gameIds: string[];
	primaryGameId: string | null;
	tagIds: string[];
	links: Array<{
		provider: string;
		label: string;
		url: string;
		isAffiliate: boolean;
	}>;
}
