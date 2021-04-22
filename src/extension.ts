import * as vscode from 'vscode';
import * as util from './util';

function getWords(document: vscode.TextDocument, selection: vscode.Selection): string[] {
	let words: string[] = [];
	for (let i = selection.start.line; i <= selection.end.line; ++i) {
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
			const words = getWords(document, editor.selection);

			const numIdent = util.countIdents(document.lineAt(editor.selection.start.line).text);

			console.log(numIdent, words);
		}
	});

	context.subscriptions.push(disposable);
};

export function deactivate() {};
