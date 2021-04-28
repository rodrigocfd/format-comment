import * as vscode from 'vscode';
import * as util from './util';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('format-comment.formatComment', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const idxFirstLine = editor.selection.start.line;
			const idxLastLine = editor.selection.end.line;
			const linePrefix = util.linePrefix(document.lineAt(idxFirstLine).text);
			const maxLen = 80;

			const initialLines = getSelectedLines(document, idxFirstLine, idxLastLine);
			if (initialLines instanceof Error) {
				vscode.window.showErrorMessage(initialLines.message);
				return;
			}
			const paragraphs = separateLinesInParagraphs(initialLines);

			let finalLines: string[] = [];
			for (let i = 0; i < paragraphs.length; ++i) {
				finalLines = finalLines.concat(assemblyFinalParagraph(editor, paragraphs[i], maxLen));
				if (i < paragraphs.length - 1) {
					finalLines.push(linePrefix);
				}
			}

			if (!util.areLinesEqual(initialLines, finalLines)) {
				let targetSel = new vscode.Selection(
					new vscode.Position(idxFirstLine, 0),
					new vscode.Position(idxLastLine, document.lineAt(idxLastLine).text.length),
				);
				editor.edit(b => b.replace(targetSel, finalLines.join(util.eol(document))));
			}

			editor.selection = new vscode.Selection(
				new vscode.Position(idxFirstLine, finalLines[0].indexOf('//')),
				new vscode.Position(idxFirstLine + finalLines.length - 1,
					finalLines[finalLines.length - 1].length),
			);
		}
	});

	context.subscriptions.push(disposable);
};

export function deactivate() {};

/**
 * Retrieves the selected lines. Returns Error if one of them is not a comment.
 */
function getSelectedLines(
	doc: vscode.TextDocument, idxFirstLine: number, idxLastLine: number): string[] | Error
{
	let lines: string[] = [];

	for (let i = idxFirstLine; i <= idxLastLine; ++i) {
		const line = doc.lineAt(i).text.trimLeft();
		if (!line.startsWith('//')) {
			return new Error(`Format comment failed: line ${i + 1} is not a comment.`);
		} else if (line.startsWith('// *') || line.startsWith('/// *') || line.startsWith('//! *')) {
			return new Error(`Format comment failed: line ${i + 1} appears to be a markdown list, `
				+ `which can't be properly formatted.`);
		}

		lines.push(line);
	}

	return lines;
}

/**
 * Splits the selected lines into paragraphs, each one containing words.
 */
function separateLinesInParagraphs(lines: string[]): string[][] {
	let paragraphs: string[][] = [];
	let currentParagraph: string[] = [];

	for (const line of lines) {
		const words = util.splitWords(line).map((word, idx) => {
			if (idx === 0) {
				const slashesPrefix = util.commentSlashes(word);
				const wordNoPrefix = word.substr(slashesPrefix.length);
				return wordNoPrefix;
			}
			return word;
		}).filter(word => word.length > 0);

		if (words.length === 0) {
			paragraphs.push(currentParagraph);
			currentParagraph = [];
		}

		currentParagraph = currentParagraph.concat(words);
	}

	paragraphs.push(currentParagraph);
	return paragraphs.filter(p => p.length > 0);
}

/**
 * From an array of words, returns the lines of a formatted comment block.
 */
function assemblyFinalParagraph(editor: vscode.TextEditor, words: string[], maxLen: number): string[] {
	const document = editor.document;
	const idxFirstLine = editor.selection.start.line;
	const linePrefix = util.linePrefix(document.lineAt(idxFirstLine).text);

	let finalLines: string[] = [];
	let i = 0;
	while (i < words.length) {
		let curLine = linePrefix;
		let k = i;
		for (;;) {
			curLine += ' ' + words[k];
			const renderLen = curLine.replace(/\t/g, ' '.repeat(4)).length;
			if (k >= words.length || renderLen > maxLen) break;
			++k;
		}

		let numWords = k - i + 1;
		if (numWords === 1) {
			finalLines.push(curLine);
		} else {
			--numWords;
			curLine = linePrefix;
			for (let n = 0; n < numWords; ++n) {
				curLine += ' ' + words[i + n];
			}
			finalLines.push(curLine);
		}

		i += numWords;
	}
	return finalLines;
}
