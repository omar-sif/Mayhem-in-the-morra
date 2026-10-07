import { ListenerCallback, Message } from "@/types";

const messageHandler: ListenerCallback = (message: Message, _sender, sendResponse) => {
	switch (message.cmd) {
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
		default:
			console.log(`Unknown message, found : ${message.cmd}`);
	}
};

chrome.runtime.onMessage.addListener(messageHandler);

console.log("Service Worker UP");
async function getCurrentTab() {
	const queryOptions: chrome.tabs.QueryInfo = { active: true, lastFocusedWindow: true };
	const [tab] = await browser.tabs.query(queryOptions);
	return tab;
}
