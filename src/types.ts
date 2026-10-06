type STREAM_GAME_MESSAGE = {
	cmd: "STREAM_GAME";
	payload: {
		player1: string;
		player2: string;
	};
};

type GET_SITE_MESSAGE = {
	cmd: "GET_SITE";
};

export type Message = STREAM_GAME_MESSAGE | GET_SITE_MESSAGE;
