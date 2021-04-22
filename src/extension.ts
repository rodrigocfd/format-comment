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
				const commPrefix = util.commentPrefix(word);
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

			for (const word of words) {
				console.log(linePrefix + word);
			}

			// let targetSel = new vscode.Selection(
			// 	new vscode.Position(idxFirstLine, 0),
			// 	new vscode.Position(idxLastLine, document.lineAt(idxLastLine).text.length),
			// );
			// editor.edit(b => {
			// 	b.replace(targetSel, 'xxxx' + document.eol + 'xxx');
			// });
		}
	});

	context.subscriptions.push(disposable);
};

export function deactivate() {};
