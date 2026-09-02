import type { JSX } from "react";
import { ExternalEmbed } from "../embeds/ExternalEmbed.js";
import type {
	ArticleAssetMap,
	ArticleBlock,
	ArticleDocument,
	InlineNode,
} from "./types.js";

export function ArticleContent({
	document,
	assets,
}: {
	document: ArticleDocument;
	assets: ArticleAssetMap;
}) {
	return (
		<article className="jouzy-content">
			{document.children.map((node) => (
				<Block
					key={JSON.stringify(node)}
					node={node}
					assets={assets}
					document={document}
				/>
			))}
		</article>
	);
}

function Inline({ nodes }: { nodes: InlineNode[] }) {
	return (
		<>
			{nodes.map((node) => {
				switch (node.type) {
					case "text":
						return <span key={JSON.stringify(node)}>{node.value}</span>;
					case "strong":
						return (
							<strong key={JSON.stringify(node)}>
								<Inline nodes={node.children} />
							</strong>
						);
					case "emphasis":
						return (
							<em key={JSON.stringify(node)}>
								<Inline nodes={node.children} />
							</em>
						);
					case "delete":
						return (
							<del key={JSON.stringify(node)}>
								<Inline nodes={node.children} />
							</del>
						);
					case "link":
						return (
							<a
								key={JSON.stringify(node)}
								href={node.url}
								title={node.title ?? undefined}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Inline nodes={node.children} />
							</a>
						);
				}
				return null;
			})}
		</>
	);
}

function Block({
	node,
	assets,
	document,
}: {
	node: ArticleBlock;
	assets: ArticleAssetMap;
	document: ArticleDocument;
}) {
	switch (node.type) {
		case "heading": {
			const Tag = `h${node.depth}` as keyof JSX.IntrinsicElements;
			return (
				<Tag>
					<Inline nodes={node.children} />
				</Tag>
			);
		}
		case "paragraph":
			return (
				<p>
					<Inline nodes={node.children} />
				</p>
			);
		case "blockquote":
			return (
				<blockquote>
					{node.children.map((child) => (
						<Block
							key={JSON.stringify(child)}
							node={child}
							assets={assets}
							document={document}
						/>
					))}
				</blockquote>
			);
		case "thematicBreak":
			return <hr />;
		case "list": {
			const Tag = node.ordered ? "ol" : "ul";
			return (
				<Tag start={node.ordered ? (node.start ?? undefined) : undefined}>
					{node.children.map((children) => (
						<li key={JSON.stringify(children)}>
							{children.map((child) => (
								<Block
									key={JSON.stringify(child)}
									node={child}
									assets={assets}
									document={document}
								/>
							))}
						</li>
					))}
				</Tag>
			);
		}
		case "table":
			return (
				<table>
					<tbody>
						{node.rows.map((row, rowIndex) => (
							<tr key={JSON.stringify(row)}>
								{row.map((cell) =>
									rowIndex === 0 ? (
										<th key={JSON.stringify(cell)}>
											<Inline nodes={cell} />
										</th>
									) : (
										<td key={JSON.stringify(cell)}>
											<Inline nodes={cell} />
										</td>
									),
								)}
							</tr>
						))}
					</tbody>
				</table>
			);
		case "image": {
			const asset = assets[node.assetId];
			return asset ? (
				<figure>
					<img
						src={asset.publicUrl}
						alt={asset.alt}
						width={asset.width}
						height={asset.height}
					/>
					<figcaption>
						{asset.caption && <span>{asset.caption}</span>}
						{asset.credit && <small>Crédit : {asset.credit}</small>}
					</figcaption>
				</figure>
			) : (
				<div role="alert" data-missing-asset>
					Asset média introuvable : {node.assetId}
				</div>
			);
		}
		case "embed":
			return <ExternalEmbed embed={node.embed} />;
	}
}
