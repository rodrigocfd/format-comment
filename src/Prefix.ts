import * as vscode from 'vscode';

class Prefix {
	private _numTabs: number;
	private _tabWidth: number;
	private _useSpaces: boolean;
	private _commentPrefix: string;

	public get numTabs(): number { return this._numTabs; }
	public get tabWidth(): number { return this._tabWidth; }
	public get useSpaces(): boolean { return this._useSpaces; }
	public get commentPrefix(): string { return this._commentPrefix; }

	private constructor() {
		const editorOpts = vscode.window.activeTextEditor!.options;

		this._numTabs = 0;
		this._tabWidth = editorOpts.tabSize as number;
		this._useSpaces = editorOpts.insertSpaces as boolean;
		this._commentPrefix = '';
	}

	public static FromLine(line: string): Prefix | Error {
		let _this = new Prefix();

		if (line.trim() === '/**' || line.trim() === '/*') {
			return new Error('Don\'t select the first "/**" line.');
		} else if (line.trim() === '*/') {
			return new Error('Don\'t select the last "*/" line.');
		}

		if (_this._useSpaces) {
			let numSpaces = 0;
			let i = 0;
			while (line[i++] === ' ') ++numSpaces;
			_this._numTabs = (numSpaces - (numSpaces % _this._tabWidth)) / _this._tabWidth;
		} else {
			let i = 0;
			while (line[i++] === '\t') ++_this._numTabs;
		}

		for (const validPrefix of ['///', '//!', '//', '#', '*']) {
			if (line.trimLeft().startsWith(validPrefix)) {
				// Asterisk goes with a prepended space.
				_this._commentPrefix = validPrefix === '*' ? ' *' : validPrefix;
				return _this;
			}
		}

		return new Error('Invalid text comment line.');
	}

	public identPrefix(): string {
		return (this._useSpaces ? ' '.repeat(this._tabWidth) : '\t')
			.repeat(this._numTabs);
	}
}

export default Prefix;
