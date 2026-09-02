import type { EmbedProvider, EmbedType } from "@jouzy/domain";
import type { Content, PhrasingContent, Root } from "mdast";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { normalizeEmbedUrl } from "../embeds/providers.js";
import type {
	ArticleBlock,
	ArticleDocument,
	InlineNode,
	MarkdownIssue,
} from "./types.js";
import { MarkdownValidationError } from "./types.js";

interface DirectiveNode {
	type: "leafDirective" | "containerDirective" | "textDirective";
	name?: string;
	attributes?: Record<string, string | null>;
	children?: Content[];
	position?: { start?: { line?: number; column?: number } };
}

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);

function issue(
	node: { position?: DirectiveNode["position"] },
	code: string,
	message: string,
	field?: string,
): never {
	const position = node.position?.start;
	throw new MarkdownValidationError({
		code,
		message,
		field,
		position: { line: position?.line ?? 1, column: position?.column ?? 1 },
	});
}

function asDirective(node: Content): DirectiveNode | null {
	return node.type === "leafDirective" ||
		node.type === "containerDirective" ||
		node.type === "textDirective"
		? (node as unknown as DirectiveNode)
		: null;
}

function validateLink(node: {
	url?: string;
	position?: DirectiveNode["position"];
}): string {
	if (typeof node.url !== "string")
		issue(node, "INVALID_LINK", "Le lien est invalide.", "url");
	let url: URL;
	try {
		url = new URL(node.url);
	} catch {
		issue(node, "INVALID_LINK", "Le lien doit être une URL absolue.", "url");
	}
	if (
		!["http:", "https:", "mailto:"].includes(url.protocol) ||
		url.username ||
		url.password ||
		[...node.url].some((character) => character.charCodeAt(0) < 32)
	) {
		issue(
			node,
			"INVALID_LINK",
			"Seuls les liens HTTP(S) et mailto sûrs sont acceptés.",
			"url",
		);
	}
	return url.toString();
}

function inline(
	nodes: PhrasingContent[],
	refs: ArticleDocument,
	directiveCount: { value: number },
): InlineNode[] {
	return nodes.map((node) => {
		switch (node.type) {
			case "text":
				return { type: "text", value: node.value };
			case "strong":
				return {
					type: "strong",
					children: inline(node.children, refs, directiveCount),
				};
			case "emphasis":
				return {
					type: "emphasis",
					children: inline(node.children, refs, directiveCount),
				};
			case "delete":
				return {
					type: "delete",
					children: inline(node.children, refs, directiveCount),
				};
			case "link":
				return {
					type: "link",
					url: validateLink(node),
					title: node.title ?? null,
					children: inline(node.children, refs, directiveCount),
				};
			case "inlineCode":
				return issue(
					node,
					"UNSUPPORTED_NODE",
					"Le code inline n’est pas autorisé dans le contenu éditorial.",
				);
			case "image":
				return issue(
					node,
					"UNSUPPORTED_NODE",
					"Utilisez la commande image de l’éditeur.",
				);
			case "html":
				return issue(node, "HTML_REJECTED", "Le HTML brut n’est pas autorisé.");
			case "break":
				return { type: "text", value: "\n" };
			default:
				return issue(
					node,
					"UNSUPPORTED_NODE",
					"Ce nœud Markdown n’est pas autorisé.",
				);
		}
	});
}

function block(
	node: Content,
	document: ArticleDocument,
	directiveCount: { value: number },
): ArticleBlock {
	const directive = asDirective(node);
	if (directive) {
		if (directive.type !== "leafDirective")
			issue(
				node,
				"DIRECTIVE_NESTED",
				"Les directives doivent être des blocs Jouzy autonomes.",
			);
		const name = directive.name;
		const attrs = directive.attributes ?? {};
		const directiveId = `directive-${directiveCount.value++}`;
		if (name === "jouzy-image") {
			if (
				Object.keys(attrs).length !== 1 ||
				typeof attrs.assetId !== "string" ||
				!attrs.assetId.trim()
			)
				issue(
					node,
					"INVALID_DIRECTIVE",
					"La directive image exige uniquement un assetId.",
				);
			const assetId = attrs.assetId.trim();
			document.media.push({
				assetId,
				directiveId,
				position: document.media.length,
			});
			return { type: "image", assetId, directiveId };
		}
		if (name === "jouzy-embed") {
			if (
				Object.keys(attrs).length !== 3 ||
				typeof attrs.kind !== "string" ||
				typeof attrs.provider !== "string" ||
				typeof attrs.url !== "string"
			)
				issue(
					node,
					"INVALID_DIRECTIVE",
					"La directive embed exige exactement kind, provider et url.",
				);
			try {
				const normalized = normalizeEmbedUrl(
					attrs.kind as EmbedType,
					attrs.provider as EmbedProvider,
					attrs.url,
				);
				const embed = {
					directiveId,
					type: normalized.type,
					provider: normalized.provider,
					canonicalUrl: normalized.canonicalUrl,
					embedUrl: normalized.embedUrl,
					label: normalized.label,
					iframe: normalized.iframe,
					position: document.embeds.length,
				};
				document.embeds.push(embed);
				return { type: "embed", embed };
			} catch (error) {
				issue(
					node,
					"INVALID_EMBED",
					error instanceof Error ? error.message : "L’embed est invalide.",
				);
			}
		}
		issue(node, "UNKNOWN_DIRECTIVE", "Cette directive n’est pas autorisée.");
	}
	switch (node.type) {
		case "heading":
			return {
				type: "heading",
				depth: node.depth,
				children: inline(node.children, document, directiveCount),
			};
		case "paragraph":
			return {
				type: "paragraph",
				children: inline(node.children, document, directiveCount),
			};
		case "blockquote":
			return {
				type: "blockquote",
				children: node.children.map((child) =>
					block(child, document, directiveCount),
				),
			};
		case "list":
			return {
				type: "list",
				ordered: node.ordered ?? false,
				start: node.start ?? null,
				children: node.children.map((item) =>
					item.children.map((child) => block(child, document, directiveCount)),
				),
			};
		case "thematicBreak":
			return { type: "thematicBreak" };
		case "table":
			return {
				type: "table",
				align: node.align ?? [],
				rows: node.children.map((row) =>
					row.children.map((cell) =>
						inline(cell.children, document, directiveCount),
					),
				),
			};
		case "code":
			return issue(
				node,
				"UNSUPPORTED_NODE",
				"Le code n’est pas autorisé dans le contenu éditorial.",
			);
		case "html":
			return issue(node, "HTML_REJECTED", "Le HTML brut n’est pas autorisé.");
		case "definition":
			return issue(
				node,
				"UNSUPPORTED_NODE",
				"Les définitions de lien ne sont pas autorisées.",
			);
		default:
			return issue(
				node,
				"UNSUPPORTED_NODE",
				"Ce nœud Markdown n’est pas autorisé.",
			);
	}
}

export function parseArticleMarkdown(source: string): ArticleDocument {
	const tree = parser.parse(source) as Root;
	const document: ArticleDocument = { children: [], media: [], embeds: [] };
	const directiveCount = { value: 0 };
	for (const child of tree.children)
		document.children.push(block(child, document, directiveCount));
	return document;
}

export function issueFromUnknown(error: unknown): MarkdownIssue | null {
	return error instanceof MarkdownValidationError ? error.issue : null;
}
