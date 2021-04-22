import * as vscode from 'vscode';

/**
 * In the current document, retrieves whether tab is being used, and the tab
 * size.
 */
export function tabInfo(): [boolean, number] {
	const editorOpts = vscode.window.activeTextEditor!.options;

	let tabSize = editorOpts.tabSize!;
	if (typeof tabSize === 'string') tabSize = -1;

	return [!editorOpts.insertSpaces, tabSize];
};

/**
 * Retrieves the number of idents in the given line, according to the tab type
 * in current document.
 */
export function countIdents(line: string): number {
	const [useTabs, tabSize] = tabInfo();

	if (useTabs) {
		let numTabs = 0;
		let i = 0;
		while (line[i++] === '\t') ++numTabs;
		return numTabs;

	} else {
		let numSpaces = 0;
		let i = 0;
		while (line[i++] === ' ') ++numSpaces;
		return (numSpaces - (numSpaces % tabSize)) / tabSize;
	}
};

/**
 * Returns the comment prefix string, among the supported prefixes.
 */
export function commentPrefix(line: string): string {
	for (const prefix of ['//!', '///', '//']) {
		if (line.startsWith(prefix)) {
			return prefix;
		}
	}
	return '';
};
