import * as ident from './ident';

export interface Paragraph {
	lines: string[],
	isCode: boolean,
};

function newParagraph(): Paragraph {
	return {
		lines: [],
		isCode: false,
	};
}

export function parse(cleanLines: string[]): Paragraph[] {
	let paragraphs: Paragraph[] = [];
	let currentParagraph = newParagraph();

	let idx = 0;
	while (idx < cleanLines.length) {
		const line = cleanLines[idx];

		if (line.startsWith('```')) { // begin markdown code block
			paragraphs.push(currentParagraph);

			currentParagraph = newParagraph(); // start new paragraph
			currentParagraph.lines.push(line); // begin with current line
			currentParagraph.isCode = true;

			++idx;
			while (idx < cleanLines.length) {
				const codeLine = cleanLines[idx];
				currentParagraph.lines.push(codeLine);

				if (codeLine.startsWith('```')) { // last line of code block
					paragraphs.push(currentParagraph);
					currentParagraph = newParagraph(); // start new paragraph
					break;
				} else {
					++idx;
				}
			}

		} else if (!line.length) { // empty line
			paragraphs.push(currentParagraph);
			currentParagraph = newParagraph(); // start new paragraph

		} else { // ordinary comment line
			currentParagraph.lines.push(line);
		}

		++idx;
	}

	paragraphs.push(currentParagraph); // last paragraph
	return paragraphs.filter(p => p.lines.length > 0); // skip paragraphs with no lines
};

export function produceFinal(
	paragraphs: Paragraph[],
	origIdent: ident.Ident, origCommPrefix: string, maxLen: number): string[]
{
	// const firstIdent = ident.fromLine(paragraphs[0].lines[0].original);
	// const firstCommPrefix = ident.getCommentPrefix(paragraphs[0].lines[0].original) as string;

	const lenPrefix = ident.calcLength(origIdent) + origCommPrefix.length + 1;
	const desiredLen = maxLen - lenPrefix;

	let produced: string[] = [];

	for (let i = 0; i < paragraphs.length; ++i) {
		const parag = paragraphs[i];

		if (parag.isCode) { // code blocks won't be formatted
			for (const codeLine of parag.lines) {
				produced.push(ident.produce(origIdent) + origCommPrefix + ' ' + codeLine);
			}

		} else {
			let allWords: string[] = []; // all isolated words in this paragraph
			for (const line of parag.lines) {
				allWords = allWords.concat(splitWords(line));
			}

			let finalLine = '';
			for (const word of allWords) {
				if (!finalLine.length) { // first pass
					finalLine = word;
					continue;
				}

				if (finalLine.length + 1 + word.length > desiredLen) {
					produced.push(ident.produce(origIdent) + origCommPrefix + ' ' + finalLine);
					finalLine = word;
				} else {
					finalLine += ' ' + word;
				}
			}

			// Last line of paragraph.
			produced.push(ident.produce(origIdent) + origCommPrefix + ' ' + finalLine);
		}

		if (i < paragraphs.length - 1) { // blank line between paragraphs
			produced.push(ident.produce(origIdent) + origCommPrefix);
		}
	}

	return produced;
};

function splitWords(line: string): string[] {
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
