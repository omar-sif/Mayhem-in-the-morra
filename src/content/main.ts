import { ListenerCallback, Message } from "@/types";
import { checkGameEnded, checkOpeningExplorer, checkPosition, findBoard } from "./utils";

console.log("Content script loaded");
let PLAYING_AUDIO = false;

// TODO: this audio element should only be created in lichess or chess.com pages and only once. Actually, we might even put in only once in an offscreen document and play it from there.
const audio = new Audio(chrome.runtime.getURL("src/assets/KwanUnade -Juri Theme Remix.m4a"));
audio.addEventListener("ended", () => {
	playMorraTheme();
});

const messageHandler: ListenerCallback = (message: Message, _sender, _sendResponse) => {
	switch (message.cmd) {
		case "PLAY_SONG":
			playMorraTheme();
			break;
		case "STOP_SONG":
			stopMorraTheme();
			break;
		case "PAUSE_SONG":
			pauseMorraTheme();
			break;
		default:
			console.error(`Unknown message, found: ${message.cmd}`);
	}
};

const playMorraTheme = async () => {
	if (PLAYING_AUDIO) return;
	PLAYING_AUDIO = true;
	try {
		await audio.play();
	} catch (e) {
		stopMorraTheme();
	}
};

const stopMorraTheme = () => {
	audio.pause();
	audio.currentTime = 0;
	PLAYING_AUDIO = false;
};
const pauseMorraTheme = () => {
	audio.pause();
	PLAYING_AUDIO = false;
};

const main = (site: "chesscom" | "lichess") => {
	if (site === "chesscom") {
		checkOpeningExplorer(playMorraTheme);
	}
	const board = findBoard(site);
	if (!board) {
		console.error("Board not found");
		return;
	}
	if (checkPosition(site, board)) {
		playMorraTheme();
	}
	const observeBoard = (board: Element) => {
		const boardObserver = new MutationObserver(() => {
			const isMorra = checkPosition(site, board);
			if (isMorra) {
				playMorraTheme();
			}
		});
		boardObserver.observe(board, {
			subtree: true, // watch descendants too
			childList: true, // added/removed nodes
			attributes: true, // attribute changes
			characterData: true, // text node changes
		});
		return () => {
			boardObserver.disconnect();
		};
	};

	let cleanup = observeBoard(board);
	if (site === "lichess") {
		// lichess needs careful processing, because upon change of board orientation, lichess destroys the current board and board container, and creates new one. Which means that your initial observer is no longer attached to anything.
		// We need instead to watch this is the element as it contains orientation, and listen to orientation change
		const boardWrap = document.body.querySelector(".cg-wrap");

		if (!boardWrap) return;
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "attributes") {
					console.log("Board removed !!!!");
					cleanup();
					const newBoard = document.body.querySelector(`${board.tagName}`);
					// We actually need to figure out if it's null or not rigourously
					cleanup = observeBoard(newBoard!);
				}
			}
		});
		observer.observe(boardWrap, {
			attributes: true,
			attributeFilter: ["class"],
		});
		// TODO maybe cleanup the observers on pagehide
	}
	checkGameEnded(site, stopMorraTheme);
};

(async () => {
	const response = await chrome.runtime.sendMessage({
		cmd: "GET_SITE",
	});
	console.log(response);
	if (response.error) {
		console.error(response.error);
	} else {
		const url = response.response as string;
		console.log(url);
		if (url.includes("lichess")) {
			main("lichess");
		} else if (url.includes("chess.com")) {
			main("chesscom");
		}
	}
	chrome.runtime.onMessage.addListener(messageHandler);
})();
