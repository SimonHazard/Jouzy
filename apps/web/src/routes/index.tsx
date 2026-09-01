import { createFileRoute } from "@tanstack/react-router";

import { m } from "../paraglide/messages.js";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

export function HomeComponent() {
	return (
		<main aria-labelledby="public-title">
			<h1 id="public-title">{m.public_app_marker()}</h1>
		</main>
	);
}
