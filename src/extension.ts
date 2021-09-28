import * as vscode from 'vscode';
import Paragraph from './Paragraph';
import Prefix from './Prefix';
import RawLines from './RawLines';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('format-comment.formatComment', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const maxLen = 80;
		const document = editor.document;
		const idxFirstLine = editor.selection.start.line;
		const idxLastLine = editor.selection.end.line;

		const rawLines = RawLines.Read(document, idxFirstLine, idxLastLine);
		if (rawLines instanceof Error) {
			vscode.window.showErrorMessage(rawLines.message, { modal: true });
			return;
		}

		const prefix = Prefix.FromLine(document.lineAt(idxFirstLine).text) as Prefix;

		const paragraphs = Paragraph.FromRawLines(rawLines);
		Paragraph.RearrangeWords(paragraphs, prefix, maxLen);

		const finalLines = Paragraph.ToLines(paragraphs, prefix);

		if (!rawLines.areEqualToLines(finalLines, prefix)) { // replace only if lines are different
			let targetSel = new vscode.Selection(
				new vscode.Position(idxFirstLine, 0),
				new vscode.Position(idxLastLine, document.lineAt(idxLastLine).text.length),
			);
			editor.edit(b => b.replace(targetSel,
				finalLines.join(document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n') ));
		}

		editor.selection = new vscode.Selection(
			new vscode.Position(idxFirstLine, finalLines[0].indexOf(prefix.commentPrefix)),
			new vscode.Position(idxFirstLine + finalLines.length - 1,
				finalLines[finalLines.length - 1].length),
		);
	});

	context.subscriptions.push(disposable);
};

export function deactivate() {};
