import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () =>
	createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: {},
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: () => <div>Page introuvable</div>,
	});

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
