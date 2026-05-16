import * as ident from './ident';

export interface Paragraph {
	lines: string[],
	canFormat: boolean,
};

function newParagraph(): Paragraph {
	return {
		lines: [],
		canFormat: true,
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
			currentParagraph.canFormat = false;

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
	origIdent: ident.Ident,
	origCommPrefix: string,
	maxLen: number,
): string[]
{
	if (origCommPrefix === '*') {
		origCommPrefix = ' *'; // prefix asterisk
	}

	const lenPrefix = ident.calcLength(origIdent) + origCommPrefix.length + 1;
	const desiredLen = maxLen - lenPrefix;

	let produced: string[] = []; // lines ready to be written to user

	for (let i = 0; i < paragraphs.length; ++i) {
		const parag = paragraphs[i];

		if (!parag.canFormat) { // just pass all the lines as they are
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
	const words: string[] = [];
	line = line.trim();
	let curWord = '';
	let withinMdLink = false;

	for (let i = 0; i < line.length; ++i) {
		if (!withinMdLink && /\s/.test(line[i])) { // space
			if (curWord.length > 0) {
				words.push(curWord);
				curWord = '';
			}
			continue;
		}

		if (!withinMdLink && line[i] === '[') { // open markdown link
			withinMdLink = true;
		}

		if (withinMdLink && line[i] === ']') { // close markdown link
			const isLastChar = (i === line.length - 1);
			if (isLastChar || /\s/.test(line[i + 1])) { // markdown link without parentheses
				withinMdLink = false;
			}
		}

		if (withinMdLink && line[i] === ')') { // close markdown link
			withinMdLink = false;
		}

		curWord += line[i];
	}

	if (curWord.length > 0) {
		words.push(curWord); // last one
	}
	return words;
}
