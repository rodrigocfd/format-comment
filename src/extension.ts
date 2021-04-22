import * as vscode from 'vscode';
import * as util from './util';

/**
 * Splits the selected lines into words.
 */
function getWords(document: vscode.TextDocument, idxFirstLine: number, idxLastLine: number): string[] {
	let words: string[] = [];
	for (let i = idxFirstLine; i <= idxLastLine; ++i) {
		const line = document.lineAt(i).text.trimLeft();
		if (!line.startsWith('//')) {
			vscode.window.showErrorMessage(`Line ${i + 1} is not a comment.`);
			return [];
		}

		words = words.concat(line.split(/\s+/).map((word, idx) => {
			if (idx === 0) {
				const commPrefix = util.commentSlashes(word);
				const wordNoPrefix = word.substr(commPrefix.length);
				return wordNoPrefix;
			}
			return word;
		}).filter(word => word.length > 0));
	}
	return words;
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('comment-formatter.formatComment', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const idxFirstLine = editor.selection.start.line;
			const idxLastLine = editor.selection.end.line;
			const words = getWords(document, idxFirstLine, idxLastLine);
			const linePrefix = util.linePrefix(document.lineAt(idxFirstLine).text);
			const eol = util.eol(document);
			const maxLen = 80;

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

			let targetSel = new vscode.Selection(
				new vscode.Position(idxFirstLine, 0),
				new vscode.Position(idxLastLine, document.lineAt(idxLastLine).text.length),
			);
			editor.edit(b => b.replace(targetSel, finalLines.join(eol)));

			editor.selection = new vscode.Selection(
				new vscode.Position(idxFirstLine, finalLines[0].indexOf('//')),
				new vscode.Position(idxFirstLine + finalLines.length,
					finalLines[finalLines.length - 1].length),
			);
		}
	});

	context.subscriptions.push(disposable);
};

export function deactivate() {};
