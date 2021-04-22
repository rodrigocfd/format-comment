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
 * Returns the comment prefix slashes, among the supported prefixes.
 */
 export function commentSlashes(line: string): string {
	const lineTr = line.trimLeft()
	for (const prefix of ['//!', '///', '//']) {
		if (lineTr.startsWith(prefix)) {
			return prefix;
		}
	}
	return '';
};

/**
 * Returns the identation and the slashes of a comment line.
 */
export function linePrefix(line: string): string {
	const [useTabs, tabSize] = tabInfo();
	const slashes = commentSlashes(line);

	if (useTabs) {
		let numTabs = 0;
		let i = 0;
		while (line[i++] === '\t') ++numTabs;

		return '\t'.repeat(numTabs) + slashes;

	} else {
		let numSpaces = 0;
		let i = 0;
		while (line[i++] === ' ') ++numSpaces;
		let numTabs = (numSpaces - (numSpaces % tabSize)) / tabSize;

		return ' '.repeat(numTabs * tabSize) + slashes;
	}
};

/**
 * Returns \n or \r\n, according to the document.
 */
export function eol(document: vscode.TextDocument): string {
	return document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
};
