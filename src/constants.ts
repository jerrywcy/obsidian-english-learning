import { normalizePath } from "obsidian";

/** 
 * Path to the plugin
 * @constant 
 */
export const pluginPath = normalizePath("/.obsidian/plugins/obsidian-english-learning/");
/**
 * Path to folder containing all data
 * @constant
 */
export const pluginDataPath = normalizePath(pluginPath + "/data/")
/**
 * Path to the local dictionary
 * @constant
 */
export const dictionaryPath = normalizePath(pluginDataPath + "/dictionary.json");
/**
 * Path to the volcabulary database
 * @constant
 */
export const vocabularyPath = normalizePath(pluginDataPath + "/vocabulary.json");
/**
 * Path to the high frequency word list.
 * @constant
 */
export const highFrequencyWordsPath = normalizePath(pluginDataPath + "/highFrequencyWords.txt");

/**
 * Regex expression used to identify wiki links such as [[link]] and [[link|text]]
 * 
 * Captures `link`.
 * @constant
 */
export const LINK_REGEX = /\[\[([^\|]*)(?:\|([^\]]*))?\]\]/gu;
/**
 * Regex expression used to identify punctuations(except `[],.`)
 * @constant
 */
export const PUNCTUATION_REGEX = /[^A-Za-z\[\]\|\s0-9,.]/gu;