import { Editor } from "obsidian";

import { LINK_REGEX, PUNCTUATION_REGEX } from "src/constants";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Lexer, Tagger } from "pos";
import { Lemmatizer } from "src/javascript-lemmatizer/js/lemmatizer.js";

let lemmatizer = new Lemmatizer();

/**
 * Reform the part of speech into more general forms
 * @param str 
 * @returns 
 */
function getPos(str: string): "adj" | "noun" | "verb" | "adv" | "noun" {
    if (str.substring(0, 1) === "J") {
        return "adj";
    }
    else if (str.substring(0, 1) === "N") {
        return "noun";
    }
    else if (str.substring(0, 1) === "V") {
        return "verb";
    }
    else if (str.substring(0, 1) === "R") {
        return "adv";
    }
    else {
        return "noun"
    }
}

/**
 * Remove links from a string.
 * For example, [[text]] becomes text and [[a|b]] becomes b
 * @param str 
 * @returns 
 */
export function removeLinks(str: string): string {
    return str.replace(LINK_REGEX, (match, p1, p2) => { return p2 ? p2 : p1; });
}

/**
 * Remove punctuations(except [],.) from a string
 * @param str 
 * @returns 
 */
export function removePunctuation(str: string): string {
    return str.replace(PUNCTUATION_REGEX, "");
}

/**
 * 
 * @param text the article to parse
 * @returns the article parsed in the form of an array of word pairs
 * 
 * The first word is the original word
 * 
 * The second word is the word in its original form
 */
export function parseArticle(text: string): Set<Array<string>> {
    const article = removePunctuation(removeLinks(text))
        .replaceAll(/([^a-zA-Z\|\[\]])/igu, "$1 ");
    const words = new Lexer().lex(article);
    const tagger = new Tagger();
    const taggedWords = tagger.tag(words);
    let ret = new Set<Array<string>>();
    for (let i in taggedWords) {
        let taggedWord = taggedWords[i];
        let word: string = taggedWord[0];
        if (word.match(PUNCTUATION_REGEX)) continue;
        let tag = getPos(taggedWord[1]);
        let lemmas = lemmatizer.lemmas(word.toLowerCase(), tag);
        if (!lemmas.length || !(lemmas[0] instanceof Array)) continue;
        ret.add([word, lemmas[lemmas.length - 1][0]]);
    }
    return ret;
}

/**
 * Get the word at the cursor or is selected
 * @param editor the Editor of the current view
 * @returns the word at the cursor or is selected
 */
export function getSelectedWord(editor: Editor): string {
    let selectedWord = "";
    if (editor.somethingSelected()) {
        selectedWord = editor.getSelection();
    }
    else {
        let { from, to } = editor.wordAt(editor.getCursor())
        selectedWord = editor.getRange(from, to);
    }
    selectedWord = selectedWord.replace(/[^A-Za-z]/gu, "");
    return selectedWord;
}

/**
 * Test whether a string is alphabetic
 * @param str 
 * @returns 
 */
export function isAlpha(str: string): boolean {
    if (str === "") return true;
    return str.match(/[^a-z]/i) !== null;
}

/**
 * Parse a link and returns content shown
 * @param str 
 * @returns the content shown
 */
export function parseLink(str: string): Array<string> | string {
    let ret = Array.from(str.matchAll(LINK_REGEX))[0];
    ret.shift();
    if (ret[1] === undefined) return ret[0]
    else return ret;
}

/**
 * Add bracket for a given word in a given article.
 * @param data The article
 * @param article The article seperated in word pairs using parseArticle
 * @param query The word to add bracket for. Must be original form!
 * @returns The article with brackets added
 */
export function addBracket(data: string, article: Set<Array<string>>, query: string): string {
    for (let x of article) {
        if (x[1] == query) {
            let reg = new RegExp(`(?<=[^\\|\\[\\]a-zA-z]|^)(${x[0]})(?=[^\\|\\[\\]a-zA-Z]|$)`, "igum");
            data = data.replace(reg, `[[${x[1]}|${x[0]}]]`);
        }
    }
    return data;
}

/**
 * Remove bracket for a given word in a given article.
 * @param data The article
 * @param article The article seperated in word pairs using parseArticle
 * @param query The word to remove bracket for. Must be original form!
 * @returns The article with bracket removed.
 */
export function removeBracket(data: string, article: Set<Array<string>>, query: string): string {
    for (let x of article) {
        if (x[1] == query) {
            let reg = new RegExp(`\\[\\[${x[1]}\\|${x[0]}\\]\\]`, "igu");
            data = data.replace(reg, `${x[0]}`);
        }
    }
    return data;
}

