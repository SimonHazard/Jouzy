import { createFileRoute } from "@tanstack/react-router";
import { AdminErrorState } from "../components/admin-error-state.js";
import { AdminShell } from "../components/admin-shell.js";
import { getCurrentIdentity } from "../features/auth/server-functions.js";
import { m } from "../paraglide/messages.js";
import { DashboardContent } from "./-dashboard-content.js";

export const Route = createFileRoute("/")({
	beforeLoad: () => getCurrentIdentity(),
	component: AdminHomeRoute,
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
});

export function AdminHomeComponent() {
	return (
		<main aria-labelledby="admin-title">
			<h1 id="admin-title">{m.admin_app_marker()}</h1>
		</main>
	);
}

function AdminHomeRoute() {
	const identity = Route.useRouteContext();
	return (
		<AdminShell identity={identity}>
			<DashboardContent identity={identity} />
		</AdminShell>
	);
}
