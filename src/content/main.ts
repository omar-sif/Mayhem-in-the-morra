import { checkPosition, findBoard } from "./utils";

console.log("Content script loaded");
let PLAYING_AUDIO = false;

// TODO: this audio element should only be created in lichess or chess.com pages and only once. Actually, we might even put in only once in an offscreen document and play it from there.
const audio = new Audio(chrome.runtime.getURL("src/assets/KwanUnade -Juri Theme Remix.m4a"));

export const checkOpeningExplorer = () => {
	const openingSection = document.querySelector("div.eco-opening-component");
	if (openingSection) {
		const observer = new MutationObserver(() => {
			const openingName = openingSection.querySelector("span.eco-opening-name");
			const smithMorraRegex = /smith[- ]morra/i;
			if (openingName && smithMorraRegex.test(openingName.textContent)) {
				if (!PLAYING_AUDIO) {
					audio.play();
					PLAYING_AUDIO = true;
				}
			}
		});

		observer.observe(openingSection, {
			subtree: true,
		});
	}
};

const main = (site: "chesscom" | "lichess") => {
	if (site === "chesscom") {
		checkOpeningExplorer();
	}
	const board = findBoard(site);
	if (!board) {
		console.error("Board not found");
		return;
	}

	const observer = new MutationObserver(() => {
		const isMorra = checkPosition(site, board);
		if (isMorra) {
			if (!PLAYING_AUDIO) {
				audio.play();
				PLAYING_AUDIO = true;
			}
		}
	});
	observer.observe(board, {
		subtree: true, // watch descendants too
		childList: true, // added/removed nodes
		attributes: true, // attribute changes
		characterData: true, // text node changes
	});
	// checkGameEnded(site);
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
})();

const nameElements = document.querySelectorAll("name");
if (nameElements.length == 2) {
	chrome.runtime.sendMessage({
		cmd: "STREAM_GAME",
		player1: nameElements[0].textContent,
		player2: nameElements[1].textContent,
	});
}
