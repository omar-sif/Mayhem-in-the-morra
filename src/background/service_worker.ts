import { Message } from "@/types";
import z from "zod";
import { GameStreamGameSchema, MoveStreamEntrySchema } from "./schemas";

type Game = z.infer<typeof GameStreamGameSchema>;
type MoveStreamEntry = z.infer<typeof MoveStreamEntrySchema>;

// TODO this might not be enough as you can transpose or get to in from a different move order at a later stage
const SMITH_MORRA = "rnbqkbnr/pp2pppp/8/2p5/3PP3/2P5/PP3PPP/RNBQKBNR";

const readStream =
	<T, K>(processLine) =>
	(response: T): K => {
		const stream = response.body.getReader();
		const matcher = /\r?\n/;
		const decoder = new TextDecoder();
		let buf = "";

		const loop = () =>
			stream.read().then(({ done, value }) => {
				if (done) {
					if (buf.length > 0) processLine(JSON.parse(buf));
				} else {
					const chunk = decoder.decode(value, {
						stream: true,
					});
					buf += chunk;

					const parts = buf.split(matcher);
					buf = parts.pop();
					for (const i of parts.filter((p) => p)) processLine(JSON.parse(i));
					return loop();
				}
			});

		return loop();
	};

const messageHandler = (message: Message, sender: chrome.runtime.MessageSender, sendResponse) => {
	switch (message.cmd) {
		case "STREAM_GAME":
			const { player1, player2 } = message.payload;
			const response = fetch(
				"https://lichess.org/api/stream/games-by-users?withCurrentGames=true",
				{
					method: "POST",
					headers: {
						"Content-Type": "text/plain",
					},
					body: `${player1},${player2}`,
				},
			).then(readGamesStream);

			sendResponse({
				cmd: "STOP_AUDIO",
			});
			break;
		case "GET_SITE":
			getCurrentTab()
				.then((tab) => {
					if (!tab.url) {
						sendResponse({
							error: "Undefined tab url",
						});
					} else {
						sendResponse({
							response: tab.url,
						});
					}
				})
				.catch((e) =>
					sendResponse({
						error: e,
					}),
				);

			return true;
			break;
		default:
			console.log(`Unknown message, found : ${message.cmd}`);
	}
};

chrome.runtime.onMessage.addListener(messageHandler);
const processGame = (game: Game): "FINISHED" | "ONGOING" => {
	if (game.statusName !== "created" && game.statusName !== "started") {
		return "FINISHED";
	}
	return "ONGOING";
};

const readGamesStream = readStream<Game, "FINISHED" | "ONGOING">(processGame);

// function listenToGameMoves(gameID: string) {}
console.log("Service Worker UP");
async function getCurrentTab() {
	const queryOptions: chrome.tabs.QueryInfo = { active: true, lastFocusedWindow: true };
	const [tab] = await browser.tabs.query(queryOptions);
	return tab;
}
