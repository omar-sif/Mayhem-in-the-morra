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

//for now it's the smith morra gambit, could be changed to only run on the accepted variation, but this is fine
const SMITH_MORRA = "rnbqkbnr/pp1ppppp/8/8/3pP3/2P5/PP3PPP/RNBQKBNR";
const SMITH_MORRA_GRID: string[][] = fenToGrid(SMITH_MORRA);

//for chesscom we can try to find div with class eco-opening-component, inside of it a span with class eco-opening-name, inner text contains opening name
// or chess board is custom element wc-chess-board , inside of it divs with class piece bp (color,piece) square-78 (square-filerow)

export const findBoard = (site: "lichess" | "chesscom") => {
	if (site === "chesscom") {
		return document.body.querySelector("wc-chess-board");
	}
	if (site === "lichess") {
		return document.body.querySelector("cg-board");
	}
};

export const checkPosition = (site: "chesscom" | "lichess", board: Element): boolean => {
	if (site === "chesscom") {
		return checkIfMorraChessCom(board);
	} else {
		//lichess
		const orientation = getBoardOrientation();
		if (!orientation) {
			console.log("Could not find orientation");
			return false;
		}
		return checkIfMorraLichess(board, orientation);
	}
};

const checkIfMorraChessCom = (board: Element) => {
	const pieces = board.querySelectorAll("div.piece");
	if (pieces.length === 0) {
		console.log("No pieces found");
		return false;
	}
	for (const piece of pieces) {
		const classes = piece.className;
		const colorpiece = classes.match(/[wb][pnrkqb]/);
		if (!colorpiece) {
			console.error("Could not get piece and color");
			return false;
		}
		const pieceChar =
			colorpiece[0][0] === "w" ? colorpiece[0][1].toUpperCase() : colorpiece[0][1];
		const coordinatesMatch = classes.match(/square-\d{2}/);
		if (!coordinatesMatch) {
			console.error("Could not get piece coordinates");
			return false;
		}
		const coordinates = coordinatesMatch[0].split("-")[1];
		const row = Number(coordinates[1]) - 1;
		const column = Number(coordinates[0]) - 1;
		if (isNaN(row) || isNaN(column)) {
			console.error("Invalid row or column");
			return false;
		}
		if (SMITH_MORRA_GRID[7 - row][column] !== pieceChar) {
			return false;
		}
	}
	return true;
};
// For lichess, since piece positions are determined by their x and y translation, it is orientation sensitive.
export const getBoardOrientation = () => {
	const container = document.body.querySelector("cg-container");
	if (!container) {
		console.error("Could not find board container");
		return;
	}
	const parent = container.parentElement;
	if (!parent) {
		console.error("Parent of counter not found  ");
		return;
	}

	for (const cls of parent.classList) {
		if (cls.includes("orientation")) {
			const orientation = cls.split("-")[1];
			return orientation;
		}
	}
	return;
};

export const pieceToChar = (pieceName: string) => {
	if (pieceName === "knight") return "n";
	return pieceName[0];
};
const checkIfMorraLichess = (board: Element, orientation: string) => {
	// side is returned as smth like 123.45px, we only need the number part
	const side = Number(getComputedStyle(board).width.split("p")[0]);
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

export const checkOpeningExplorer = (cb: () => void) => {
	const openingContainer = document.body.querySelector("span.eco-opening-name");
	if (!openingContainer) {
		// first we need to observe the document body until the container for the opening name (which is the span) to render. Then we need to observe that itself for changes, as the opening name changes as moves are being played. So that needs to be observed independantly
		const openingContainerObserver = new MutationObserver(() => {
			const openingContainer = document.body.querySelector("span.eco-opening-name");
			if (openingContainer) {
				openingContainerObserver.disconnect();
				//this one observe the changes in the opening name text
				const openingNameObserver = new MutationObserver(() => {
					const smithMorraRegex = /smith[- ]morra/i;
					if (smithMorraRegex.test(openingContainer.textContent)) {
						cb();
					}
				});
				openingNameObserver.observe(openingContainer, {
					characterData: true,
				});
			}
		});
		openingContainerObserver.observe(document.body, {
			subtree: true,
			childList: true,
		});
	} else {
		const openingNameObserver = new MutationObserver(() => {
			const smithMorraRegex = /smith[- ]morra/i;
			if (smithMorraRegex.test(openingContainer.textContent)) {
				cb();
			}
		});
		openingNameObserver.observe(openingContainer, {});
	}
};
