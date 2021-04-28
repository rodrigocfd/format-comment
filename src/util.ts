import * as vscode from 'vscode';

/**
 * Splits a line into words. Markdown links are considered a single word.
 */
export function splitWords(line: string): string[] {
	const tokens = line.split(/\s+/);

	let words: string[] = [];
	let i = 0;
	while (i < tokens.length) {
		const idxOpen = tokens[i].indexOf('[');
		if (idxOpen === -1) {
			words.push(tokens[i++]);
		} else {
			let bigWord = '';
			let nextWord = tokens[i];
			for (;;) {
				bigWord += ' ' + nextWord;
				if (i >= tokens.length || nextWord.indexOf(')') !== -1) {
					break;
				}
				nextWord = tokens[++i];
			}
			words.push(bigWord.substr(1));
			++i;
		}
	}

	return words;
};

/**
 * In the current document, retrieves whether tab is being used for identation,
 * and the tab size.
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
 * Tells whether the two arrays contain the same lines.
 */
export function areLinesEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;

	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i].trimLeft()) {
			return false;
		}
	}
	return true;
};

/**
 * Returns \n or \r\n, according to the document.
 */
export function eol(document: vscode.TextDocument): string {
	return document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
};
