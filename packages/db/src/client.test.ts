import type {
	D1Database,
	D1PreparedStatement,
} from "@cloudflare/workers-types";
import { describe, expect, it, vi } from "vitest";

import { createDb, healthCheck } from "./client.js";

function rawRows<T = unknown[]>(options?: {
	columnNames?: boolean;
}): Promise<T[] | [string[], ...T[]]> {
	if (options?.columnNames) {
		return Promise.resolve([[]] as [string[], ...T[]]);
	}
	return Promise.resolve([] as T[]);
}

function createStubD1(): D1Database {
	const statement = {
		bind: vi.fn(() => statement),
		first: vi.fn(async () => ({ ok: 1 })),
		run: vi.fn(async () => ({
			success: true as const,
			results: [],
			meta: {} as never,
		})),
		all: vi.fn(async () => ({
			success: true as const,
			results: [],
			meta: {} as never,
		})),
		raw: rawRows,
	} as D1PreparedStatement;
	return {
		prepare: vi.fn(() => statement),
		batch: vi.fn(async () => []),
		exec: vi.fn(async () => ({ count: 1, duration: 0 })),
		dump: vi.fn(async () => new ArrayBuffer(0)),
		withSession: vi.fn(() => {
			throw new Error("Not implemented in stub");
		}),
	} as D1Database;
}

describe("D1 client", () => {
	it("requires an explicit binding and does not share instances", () => {
		const first = createStubD1();
		const second = createStubD1();
		expect(createDb(first).$client).toBe(first);
		expect(createDb(second)).not.toBe(createDb(first));
		expect(() => createDb(undefined as never)).toThrow(/binding D1/i);
	});

	it("runs a SELECT 1 health check through the client", async () => {
		expect(await healthCheck(createDb(createStubD1()))).toBe(true);
	});
});
