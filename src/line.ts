import * as vscode from 'vscode';
import * as ident from './ident';

export function parseRaw(
	doc: vscode.TextDocument,
	idxFirstLine: number, idxLastLine: number): string[]
{
	let lines: string[] = [];

	for (let i = idxFirstLine; i <= idxLastLine; ++i) {
		lines.push(doc.lineAt(i).text);
	}

	return lines;
};

export function parseAndClean(
	doc: vscode.TextDocument,
	idxFirstLine: number, idxLastLine: number): string[] | Error
{
	let lines: string[] = [];

	for (let i = idxFirstLine; i <= idxLastLine; ++i) {
		const original = doc.lineAt(i).text;

		const commPrefix = ident.getCommentPrefix(original);
		if (commPrefix instanceof Error) {
			if (i < idxLastLine) {
				// Throw an error if not the last line
				return new Error(`Format comment failed at line ${i + 1}:\n${commPrefix.message}`);
			} else {
				// Otherwise, ignore the last line and return the list of already processed lines
				return lines;
			}
		}

		lines.push(original.trimStart()
			.substring(commPrefix.length)
			.trim());
	}

	return lines;
};

export function equals(origLines: string[], newLines: string[]): boolean {
	if (origLines.length !== newLines.length) {
		return false;
	}

	for (let i = 0; i < origLines.length; ++i) {
		if (origLines[i] !== newLines[i]) {
			return false;
		}
	}

	return true;
};
