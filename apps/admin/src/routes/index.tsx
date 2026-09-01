import { createFileRoute } from "@tanstack/react-router";

import { m } from "../paraglide/messages.js";

export const Route = createFileRoute("/")({
	component: AdminHomeComponent,
});

export function AdminHomeComponent() {
	return (
		<main aria-labelledby="admin-title">
			<h1 id="admin-title">{m.admin_app_marker()}</h1>
		</main>
	);
}
