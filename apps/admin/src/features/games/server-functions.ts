import {
	createGame,
	getGame,
	listGames,
	updateGame,
} from "@jouzy/db/queries/admin";
import { assertCanManageReferenceData, parseGameInput } from "@jouzy/domain";
import { createServerFn } from "@tanstack/react-start";
import { getDatabase } from "../../server/db.js";
import { authMiddleware } from "../auth/server-functions.js";

export const listGamesFn = createServerFn()
	.middleware([authMiddleware])
	.handler(async () => listGames(getDatabase()));

export const getGameFn = createServerFn()
	.middleware([authMiddleware])
	.validator((input: { gameId: string }) => input)
	.handler(async ({ data }) => getGame(getDatabase(), data.gameId));

export const createGameFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(parseGameInput)
	.handler(async ({ data, context }) => {
		assertCanManageReferenceData(context.identity);
		return createGame(getDatabase(), data);
	});

export const updateGameFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: { gameId: string; values: unknown }) => ({
		...input,
		values: parseGameInput(input.values),
	}))
	.handler(async ({ data, context }) => {
		assertCanManageReferenceData(context.identity);
		return updateGame(getDatabase(), data.gameId, data.values);
	});
