console.log("Content script loaded");

const nameElements = document.querySelectorAll("name");
if (nameElements.length == 2) {
	chrome.runtime.sendMessage({
		cmd: "STREAM_GAME",
		player1: nameElements[0].textContent,
		player2: nameElements[1].textContent,
	});
}

const fenToGrid = (fen: string) => {
	const grid: string[][] = [];
	for (const row of fen.split("/")) {
		const gridRow = [];
		for (const char of row) {
			if (isNaN(Number(char))) {
				gridRow.push(char);
			} else {
				for (let i = 0; i < Number(char); i++) {
					gridRow.push("-");
				}
			}
		}
		grid.push(gridRow);
	}
	return grid;
};

//for chesscom we can try to find div with class eco-opening-component, inside of it a span with class eco-opening-name, inner text contains opening name
// or chess board is custom element wc-chess-board , inside of it divs with class piece bp (color,piece) square-78 (quare-filerow)

//for now it's the smith morra gambit, could be changed to only run on the accepted variation, but this is fine
const SMITH_MORRA = "rnbqkbnr/pp1ppppp/8/8/3pP3/2P5/PP3PPP/RNBQKBNR";
const SMITH_MORRA_GRID: string[][] = fenToGrid(SMITH_MORRA);
const pieceToChar = (pieceName: string) => {
	if (pieceName === "knight") return "n";
	return pieceName[0];
};
const checkIfMorra = (el: Element, orientation: string) => {
	const board = el.getElementsByTagName("cg-board").item(0);
	if (!board) {
		console.error("Error finding board");
		return false;
	}
	// side is return as 123.45px, we only need the number part
	const side = Number(getComputedStyle(el).width.split("p")[0]);
	const translationFactor = side / 8;
	const pieces = board.getElementsByTagName("piece");
	if (pieces.length === 0) {
		console.error("No pieces on the board");
		return false;
	}
	for (const piece of pieces) {
		const transform = getComputedStyle(piece).transform;
		const matrix = new DOMMatrix(transform);
		const translateX = matrix.m41;
		const translateY = matrix.m42;
		// I need to get the (row , column) coordinates of the piece ( pay attention to board orientation)
		// The translation is guaranteed to be a multiple of the translation factor, but i'm rounding just in case.
		const row =
			orientation === "white"
				? Math.round(translateY / translationFactor)
				: 7 - Math.round(translateY / translationFactor);
		if (row < 0 || row > 7) {
			console.error(`Invalid row value, found: ${row}`);
			return false;
		}
		const column =
			orientation === "white"
				? Math.round(translateX / translationFactor)
				: 7 - Math.round(translateX / translationFactor);

		if (column < 0 || column > 7) {
			console.error(`Invalid row value, found: ${row}`);
			return false;
		}

		const pieceColor = piece.classList.item(0);
		const pieceType = piece.classList.item(1);
		if (!pieceColor || !pieceType) {
			console.error(`Invalid piece class, found: color : ${pieceColor} | type: ${pieceType}`);
			return false;
		}
		// transform it to fen compliant character
		const pieceChar =
			pieceColor === "white" ? pieceToChar(pieceType).toUpperCase() : pieceToChar(pieceType);
		if (pieceChar !== SMITH_MORRA_GRID[row][column]) {
			console.log(SMITH_MORRA_GRID);
			return false;
		}
		console.log(pieceColor, pieceType);
	}
	console.log("Mayhem!!!");
	return true;
};

// For lichess, since piece positions are determined by their x and y translation, it is orientation sensitive.
const getBoardOrientation = (board: Element) => {
	const parent = board.parentElement;
	if (!parent) {
		console.error("No parent found ");
		return;
	}

	for (const cls of parent.classList) {
		if (cls.includes("orientation")) {
			const orientation = cls.split("-")[1];
			return orientation;
		}
	}
	console.error("Could not find orientation");
};

let PLAYING_AUDIO = false;

// TODO: this audio element should only be created in lichess or chess.com pages and only once. Actually, we might even put in only once in an offscreen document and play it from there.
const audio = new Audio(chrome.runtime.getURL("src/assets/KwanUnade -Juri Theme Remix.m4a"));

const boardContainer = document.querySelectorAll("cg-container");
if (boardContainer.length === 0) {
	console.log("No boards found");
} else {
	console.log("Found board", boardContainer);
	boardContainer.forEach((board) => {
		const orientation = getBoardOrientation(board);
		if (orientation !== "black" && orientation !== "white") {
			console.error(`Invalid orientation, found: ${orientation}`);
		} else {
			const observer = new MutationObserver(() => {
				if (checkIfMorra(board, orientation)) {
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
		}
	});
}
