/** 
 * Path to the plugin
 * @constant 
 */
export const pluginPath = "/.obsidian/plugins/obsidian-english-learning/";
/**
 * Path to the local dictionary
 * @constant
 */
export const dictionaryPath = pluginPath + "data/dictionary.json";
/**
 * Path to the volcabulary database
 * @constant
 */
export const vocabularyPath = pluginPath + "data/vocabulary.json";
export const highFrequencyWordsPath = pluginPath + "data/highFrequencyWords.txt";

/**
 * Regex expression used to identify wiki links such as [[link]] and [[link|text]]
 * @constant
 */
export const LINK_REGEX = /\[\[([^\|]*)(?:\|([^\]]*))?\]\]/gu;
/**
 * Regex expression used to identify punctuations(except [],.)
 * @constant
 */
export const PUNCTUATION_REGEX = /[^A-Za-z\[\]\|\s0-9,.]/gu;