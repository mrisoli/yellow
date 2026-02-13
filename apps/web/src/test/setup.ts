import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
	url: "http://localhost",
	pretendToBeVisual: true,
});

Object.defineProperties(globalThis, {
	window: { value: dom.window, configurable: true },
	document: { value: dom.window.document, configurable: true },
	navigator: { value: dom.window.navigator, configurable: true },
	HTMLElement: { value: dom.window.HTMLElement, configurable: true },
	HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
	HTMLSelectElement: {
		value: dom.window.HTMLSelectElement,
		configurable: true,
	},
	HTMLTextAreaElement: {
		value: dom.window.HTMLTextAreaElement,
		configurable: true,
	},
	MutationObserver: { value: dom.window.MutationObserver, configurable: true },
	Node: { value: dom.window.Node, configurable: true },
	Text: { value: dom.window.Text, configurable: true },
	DocumentFragment: {
		value: dom.window.DocumentFragment,
		configurable: true,
	},
	Element: { value: dom.window.Element, configurable: true },
	Event: { value: dom.window.Event, configurable: true },
	CustomEvent: { value: dom.window.CustomEvent, configurable: true },
});
