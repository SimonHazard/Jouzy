import type { D1Database } from "@cloudflare/workers-types";

import type { D1Transaction } from "./client.js";

export type EntityId = string;
export type UtcMilliseconds = number;
export type D1Binding = D1Database;
export type { D1Transaction };
