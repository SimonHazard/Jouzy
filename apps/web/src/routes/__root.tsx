import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import appCss from "../index.css?url";
import { getLocale } from "../paraglide/runtime.js";

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Jouzy — site public",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: RootDocument,
});

export const ROOT_DOCUMENT_LANG = getLocale();

export function RootDocument() {
	return (
		<html lang={ROOT_DOCUMENT_LANG}>
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Scripts />
			</body>
		</html>
	);
}
