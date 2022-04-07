import * as vscode from 'vscode';
import * as ident from './ident';
import * as line from './line';
import * as paragraph from './paragraph';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('format-comment.formatComment', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const maxLen = vscode.workspace.getConfiguration().get('format-comment.settings.maxLength') as number;
		const document = editor.document;
		const idxFirstLine = editor.selection.start.line;
		const idxLastLine = editor.selection.end.line;

		const cleanLines = line.parseAndClean(document, idxFirstLine, idxLastLine);
		if (cleanLines instanceof Error) {
			vscode.window.showErrorMessage(cleanLines.message, { modal: true });
			return;
		}

		const origLines = line.parseRaw(document, idxFirstLine, idxLastLine);
		const origIdent = ident.fromLine(origLines[0]);
		const origCommPrefix = ident.getCommentPrefix(origLines[0]) as string;

		const paragraphs = paragraph.parse(cleanLines);
		const newLines = paragraph.produceFinal(paragraphs, origIdent, origCommPrefix, maxLen);

		if (!line.equals(origLines, newLines)) { // replace only if lines are different
			let targetSel = new vscode.Selection(
				new vscode.Position(idxFirstLine, 0),
				new vscode.Position(idxLastLine, document.lineAt(idxLastLine).text.length),
			);
			editor.edit(b => b.replace(targetSel,
				newLines.join(document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n') ));
		}

		const newFirstIdent = ident.fromLine(newLines[0]);
		editor.selection = new vscode.Selection(
			new vscode.Position(idxFirstLine, ident.produce(newFirstIdent).length),
			new vscode.Position(idxFirstLine + newLines.length - 1,
				newLines[newLines.length - 1].length),
		);
	});

	context.subscriptions.push(disposable);
};

export function deactivate() {};
