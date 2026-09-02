import { createMiddleware, createServerFn } from "@tanstack/react-start";

export const authMiddleware = createMiddleware().server(
	async ({ request, next }) => {
		const { resolveRuntimeIdentity } = await import("./runtime.server.js");
		const identity = await resolveRuntimeIdentity(request);
		return next({ context: { identity } });
	},
);

export const getCurrentIdentity = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(({ context }) => context.identity);
