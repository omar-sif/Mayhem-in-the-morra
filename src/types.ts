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

type STOP_SONG_MESSAGE = {
	cmd: "STOP_SONG";
};
type PLAY_SONG_MESSAGE = {
	cmd: "PLAY_SONG";
};
type PAUSE_SONG_MESSAGE = {
	cmd: "PAUSE_SONG";
};

export type Message =
	| STREAM_GAME_MESSAGE
	| GET_SITE_MESSAGE
	| PLAY_SONG_MESSAGE
	| STOP_SONG_MESSAGE
	| PAUSE_SONG_MESSAGE;
export type ListenerCallback = Parameters<typeof chrome.runtime.onMessage.addListener>[0];
