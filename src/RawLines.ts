import * as vscode from 'vscode';
import Prefix from './Prefix';

class RawLines {
	private _lines: string[];

	public get lines(): string[] { return this._lines; }

	private constructor() {
		this._lines = [];
	}

	public static Read(
		doc: vscode.TextDocument,
		idxFirstLine: number, idxLastLine: number): RawLines | Error
	{
		let _this = new RawLines();

		for (let i = idxFirstLine; i <= idxLastLine; ++i) {
			let line = doc.lineAt(i).text;
			let prefix = Prefix.FromLine(line);
			if (prefix instanceof Error) {
				return new Error(`Format comment failed at line ${i + 1}:\n${prefix.message}`);
			}

			_this._lines.push(
				line.trimLeft().substr(prefix.commentPrefix.length)); // remove ident and comment prefix
		}

		return _this;
	}

	public areEqualToLines(newLines: string[], prefix: Prefix): boolean {
		if (this._lines.length !== newLines.length) return false;

		for (let i = 0; i < this._lines.length; ++i) {
			if (prefix.commentPrefix + this._lines[i] !== newLines[i]) {
				return false;
			}
		}
		return true;
	}
}

export default RawLines;
