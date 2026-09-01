import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminErrorState } from "../components/admin-error-state.js";
import { AdminShell } from "../components/admin-shell.js";
import { getCurrentIdentity } from "../features/auth/server-functions.js";

export const Route = createFileRoute("/_protected")({
	beforeLoad: () => getCurrentIdentity(),
	errorComponent: ({ error }) => <AdminErrorState error={error} />,
	component: ProtectedLayout,
});

function ProtectedLayout() {
	const identity = Route.useRouteContext();
	return (
		<AdminShell identity={identity}>
			<Outlet />
		</AdminShell>
	);
}
