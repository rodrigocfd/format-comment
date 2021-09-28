import Prefix from "./Prefix";
import RawLines from "./RawLines";

class Paragraph {
	private _lines: string[];
	private _isCode: boolean;

	public get isCode(): boolean { return this._isCode; }

	private constructor() {
		this._lines = [];
		this._isCode = false;
	}

	public static FromRawLines(rawLines: RawLines): Paragraph[] {
		let paragraphs: Paragraph[] = [];
		let currentParagraph = new Paragraph();

		let idx = 0;
		while (idx < rawLines.lines.length) {
			const line = rawLines.lines[idx];

			if (line.trimLeft().startsWith('```')) { // begin markdown code block
				paragraphs.push(currentParagraph);

				currentParagraph = new Paragraph(); // start new paragraph
				currentParagraph._lines.push(line); // begin with current line
				currentParagraph._isCode = true;

				++idx;
				while (idx < rawLines.lines.length) {
					const codeLine = rawLines.lines[idx];
					currentParagraph._lines.push(codeLine);
					++idx;

					if (codeLine.trimLeft().startsWith('```')) { // last line of code block
						paragraphs.push(currentParagraph);
						currentParagraph = new Paragraph(); // start new paragraph
						break;
					}
				}

			} else if (!line.length) { // empty line
				paragraphs.push(currentParagraph);
				currentParagraph = new Paragraph(); // start new paragraph

			} else { // ordinary comment line
				currentParagraph._lines.push(line);
			}

			++idx;
		}

		paragraphs.push(currentParagraph); // last paragraph
		return paragraphs.filter(p => p._lines.length > 0); // skip paragraphs with no lines
	}

	public static RearrangeWords(
		paragraphs: Paragraph[], prefix: Prefix, maxLen: number)
	{
		const lenPrefix = (prefix.useSpaces ? prefix.tabWidth : 4) * prefix.numTabs
			+ prefix.commentPrefix.length + 1;
		const desiredLen = maxLen - lenPrefix;

		for (let paragraph of paragraphs) {
			if (paragraph.isCode) continue; // code blocks won't be formatted

			let allWords: string[] = []; // all words in this paragraph
			for (const line of paragraph._lines) {
				allWords = allWords.concat(Paragraph.splitWords(line));
			}

			let finalLines: string[] = [];

			let finalLine = '';
			for (const word of allWords) {
				if (!finalLine.length) { // first pass
					finalLine = word;
					continue;
				}

				if (finalLine.length + 1 + word.length > desiredLen) {
					finalLines.push(finalLine);
					finalLine = word;
				} else {
					finalLine += ' ' + word;
				}
			}

			finalLines.push(finalLine); // last line of paragraph
			paragraph._lines = finalLines; // replace with new array
		}
	}

	public static ToLines(paragraphs: Paragraph[], prefix: Prefix): string[] {
		const ident = prefix.identPrefix();
		let lines: string[] = [];

		for (let i = 0; i < paragraphs.length; ++i) {
			for (const line of paragraphs[i]._lines) {
				lines.push(ident + prefix.commentPrefix + ' ' + line);
			}

			if (i < paragraphs.length - 1) {
				lines.push(ident + prefix.commentPrefix); // blank line between paragraphs
			}
		}

		return lines;
	}

	private static splitWords(line: string): string[] {
		const tokens = line.trim().split(/\s+/);

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
	}
}

export default Paragraph;
