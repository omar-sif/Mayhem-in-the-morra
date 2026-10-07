import type { Message } from "@/types";
import "./style.css";

type SongCommand = Extract<Message, { cmd: "PLAY_SONG" | "PAUSE_SONG" | "STOP_SONG" }>;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
	<main class="popup">
		<h1>Mayhem</h1>
		<div class="controls" aria-label="Song controls">
			<button type="button" data-command="PLAY_SONG">
				<svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M8 5v14l11-7z" />
				</svg>
				<span>Play</span>
			</button>
			<button type="button" data-command="PAUSE_SONG">
				<svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M6 5h4v14H6zm8 0h4v14h-4z" />
				</svg>
				<span>Pause</span>
			</button>
			<button type="button" data-command="STOP_SONG">
				<svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M6 6h12v12H6z" />
				</svg>
				<span>Stop</span>
			</button>
		</div>
		<p id="status" class="status" role="status" aria-live="polite"></p>
	</main>
`;

const status = document.querySelector<HTMLParagraphElement>("#status")!;

const sendCommand = async (cmd: SongCommand["cmd"]) => {
	const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

	if (activeTab.id === undefined) {
		status.textContent = "No active tab found.";
		return;
	}

	try {
		await chrome.tabs.sendMessage(activeTab.id, { cmd } satisfies SongCommand);
		status.textContent = "";
	} catch {
		status.textContent = "Open a Chess.com or Lichess game to use the controls.";
	}
};

document.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
	button.addEventListener("click", () => {
		void sendCommand(button.dataset.command as SongCommand["cmd"]);
	});
});
