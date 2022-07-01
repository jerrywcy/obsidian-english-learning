import { Editor, MarkdownView, Menu, Notice, Plugin, normalizePath, TFile, setIcon } from 'obsidian';

import { dictionaryPath, highFrequencyWordsPath, pluginDataPath, vocabularyPath } from 'src/constants';
import { parseArticle, getSelectedWord, addBracket, removeBracket } from "src/stringHandler"
import { FreeDictionaryAPIDefinitionSource } from "src/freeDictionaryAPI"
import { EnglishLearningPluginSettingTab, EnglishLearningPluginSettings, DEFAULT_SETTINGS } from './settings';
import { DatabaseInitModal } from 'src/ui';

// Remember to rename these classes and interfaces!

export default class EnglishLearningPlugin extends Plugin {
	settings: EnglishLearningPluginSettings;

	/** Offline dictionary */
	dictionary: Object;
	/** 
	 * Stores volcabulary data 
	 * 
	 * 0: marked unknown
	 * 
	 * 1: marked known
	 * 
	 * undefined: doesn't exist in database
	 */
	vocabulary: Map<string, number>;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new EnglishLearningPluginSettingTab(this.app, this));
		this.readData();

		this.addCommand({
			id: 'init-database',
			name: 'Init Database',
			callback: async () => {
				const { adapter } = app.vault;
				let words = (await adapter.read(highFrequencyWordsPath)).split("\n");
				console.log(words);
				let l = 0, r = words.length - 1;
				while (l <= r) {
					let mid = Math.floor((l + r) / 2);
					let res = await new Promise((resolve, reject) => {
						new DatabaseInitModal(app, words[mid], resolve, reject).open();
					});
					if (res) { l = mid + 1; }
					else { r = mid - 1; }
				}
				for (let i = 0; i <= l; i++) {
					await this.markAsKnown(words[i]);
				}
				new Notice("Database initialized!");
			}
		});

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				const activeLeaf = app.workspace.getLeaf(false).view.containerEl;
				if (!activeLeaf) { return; }
				const viewActions = activeLeaf.getElementsByClassName('view-actions')[0];
				if (!viewActions) { return; }

				if (!file) return;
				if (file.parent.name !== this.settings.vocabularyFilePath &&
					!viewActions.getElementsByClassName('view-action english-learning learn-article')[0]) {
					const tooltip = 'Learn Article';
					const classes = ['view-action', 'english-learning', 'learn-article'];
					const tag = 'a';
					const buttonIcon = createEl(tag, {
						cls: classes,
						attr: { 'aria-label-position': 'bottom', 'aria-label': tooltip },
					});
					const icon = 'box-glyph';
					const iconSize = 18;
					setIcon(buttonIcon, icon, iconSize);
					viewActions.prepend(buttonIcon);
					this.registerDomEvent(buttonIcon, 'click', () => {
						setTimeout(() => this.learnArticle(file), 5);
					})
				}
				if (file.parent.name !== this.settings.vocabularyFilePath &&
					!viewActions.getElementsByClassName('view-action english-learning mark-article')[0]) {
					const tooltip = 'Mark Article';
					const classes = ['view-action', 'english-learning', 'mark-article'];
					const tag = 'a';
					const buttonIcon = createEl(tag, {
						cls: classes,
						attr: { 'aria-label-position': 'bottom', 'aria-label': tooltip },
					});
					const icon = 'bracket-glyph';
					const iconSize = 18;
					setIcon(buttonIcon, icon, iconSize);
					viewActions.prepend(buttonIcon);
					this.registerDomEvent(buttonIcon, 'click', () => {
						setTimeout(() => this.markArticle(file), 5);
					})
				}

				if (file.parent.name === this.settings.vocabularyFilePath &&
					viewActions.getElementsByClassName('view-action english-learning learn-article')[0]) {
					viewActions
						.getElementsByClassName('view-action english-learning learn-article')[0]
						.remove();
				}
				if (file.parent.name === this.settings.vocabularyFilePath &&
					viewActions.getElementsByClassName('view-action english-learning mark-article')[0]) {
					viewActions
						.getElementsByClassName('view-action english-learning mark-article')[0]
						.remove();
				}
			})
		)

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
				let wordRange = editor.wordAt(editor.getCursor());
				if (wordRange.from.ch > 0) wordRange.from.ch--;
				if (wordRange.to.ch <= editor.getLine(wordRange.to.line).length) wordRange.to.ch++;
				let range = editor.getRange(wordRange.from, wordRange.to);
				let linked = (range[0] == '[' && range.slice(-1) == '|') || (range[0] == '|' && range.slice(-1) == ']');
				if (linked) {
					menu.addItem((item) => {
						item.setTitle("Mark as known")
							.setIcon("checkbox-glyph")
							.onClick(async () => {
								let data = editor.getValue();
								let article = parseArticle(data);
								let word = getSelectedWord(editor);
								for (let x of article) {
									if (word == x[0]) {
										await this.markAsKnown(x[1]);
										data = removeBracket(data, article, x[1]);
									}
								}
								editor.setValue(data);
							});
					});
				}
				else {
					menu.addItem((item) => {
						item.setTitle("Mark as unknown")
							.setIcon("help")
							.onClick(async () => {
								let data = editor.getValue();
								let article = new Set(parseArticle(data));
								let word = getSelectedWord(editor);
								for (let x of article) {
									if (word == x[0]) {
										let flag = 0;
										try { await this.markAsUnknown(x[1]); }
										catch (err) {
											if (err === "No Definitions Found") {
												new Notice(`No Definition Found for word ${word}`);
											}
											flag = 1;
											throw (err);
										}
										if (!flag) data = addBracket(data, article, x[1]);
									}
								}
								editor.setValue(data);
							});
					});
				}
			})
		)
	}

	async onunload() {
		await this.writeData();
	}

	/**
	 * Load settings
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save settings
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Write modified data to vocabulary.json
	 * 
	 * Run in onunload()
	 */
	async writeData() {
		const { adapter } = app.vault;
		// console.log(JSON.stringify(Object.fromEntries(this.vocabulary.entries())));
		await adapter.write(vocabularyPath, JSON.stringify(Object.fromEntries(this.vocabulary.entries())));
	}

	/**
	 * Load data from volcabulary.json and dictionary.json
	 * 
	 * Run in onload()
	 */
	async readData() {
		const { vault } = app;
		const { adapter } = vault;
		if (!await adapter.exists(pluginDataPath)) {
			await vault.createFolder(pluginDataPath);
			await vault.create(dictionaryPath, "{}");
			await vault.create(vocabularyPath, "{}");
			this.vocabulary = new Map<string, number>();
			this.dictionary = {};
			return;
		}
		if (!await adapter.exists(dictionaryPath)) {
			await vault.create(dictionaryPath, "{}");
		}
		else {
			let dictionaryData = await adapter.read(dictionaryPath);
			this.dictionary = JSON.parse(dictionaryData);
		}
		if (!await adapter.exists(vocabularyPath)) {
			await vault.create(vocabularyPath, "{}");
		}
		else {
			let vocabularyData = await adapter.read(vocabularyPath);
			this.vocabulary = new Map<string, number>(Object.entries(JSON.parse(vocabularyData)));
			console.log(this.vocabulary);
		}
	}

	/**
	 * Mark all unknown word in a given article.
	 * @param file The article to mark unknown word for.
	 */
	async markArticle(file: TFile) {
		new Notice(`Marking ${file.name}`);
		const { vault } = app;
		let data = await vault.read(file);
		let article = parseArticle(data);
		for (let x of article) {
			if (this.vocabulary.get(x[1]) !== 1) {
				let flag = 0;
				try {
					await this.markAsUnknown(x[1]);
				}
				catch (err) {
					flag = 1;
				}
				if (!flag) data = addBracket(data, article, x[1]);
			}
		}
		await vault.modify(file, data);
		new Notice(`Marked ${file.name}.`);
	}

	/**
	 * Learn the given article
	 * 
	 * All the words that have not been marked unknown will be marked as known.
	 * @param file The article to learn.
	 */
	async learnArticle(file: TFile) {
		new Notice(`Learning ${file.name}`);
		const { vault } = app;
		let data = await vault.read(file);
		let article = parseArticle(data);
		for (let x of article) {
			if (this.vocabulary.get(x[1]) !== 0) {
				this.markAsKnown(x[1]);
			}
		}
		new Notice(`Learned ${file.name}.`);
	}

	/**
	 * Mark a given word as known in volcabulary.json
	 * @param word 
	 */
	async markAsKnown(word: string) {
		this.vocabulary.set(word, 1);
		await this.removeFile(word);
	}

	/**
	 * Remove the volcabulary file of a given word
	 * @param word 
	 */
	async removeFile(word: string) {
		let { adapter } = app.vault;
		let { vocabularyFilePath } = this.settings;
		let filePath = normalizePath(`${vocabularyFilePath}/${word}.md`);
		if (await adapter.exists(filePath)) { adapter.remove(filePath); }
	}

	/**
	 * Mark a given word as unknown in volcabulary.json
	 * @param word 
	 */
	async markAsUnknown(word: string) {
		this.vocabulary.set(word, 0);
		await this.createFile(word);
	}

	/**
	* Create the volcabulary file for a given word
	* @param word 
	*/
	async createFile(word: string) {
		let { adapter } = app.vault;
		let { vocabularyFilePath, generalTemplate, meaningTemplate, phoneticTemplate, definitionTemplate } = this.settings;
		let filePath = normalizePath(`${vocabularyFilePath}/${word}.md`);
		if (await adapter.exists(filePath)) { return; }
		let definitionSource = new FreeDictionaryAPIDefinitionSource();
		let dictionaryWord = await definitionSource.getDefinition(word);

		let meanings = "";
		for (let meaning of dictionaryWord.meanings) {
			let definitions = "";
			for (let definition of meaning.definitions) {
				definitions += definitionTemplate
					.replaceAll("{{definition}}", definition.definition);
			}
			meanings += meaningTemplate
				.replaceAll("{{partOfSpeech}}", meaning.partOfSpeech)
				.replaceAll("{{definitions}}", definitions);
		}

		let phonetics = "";
		for (let phonetic of dictionaryWord.phonetics) {
			phonetics += phoneticTemplate
				.replaceAll("{{text}}", phonetic.text)
				.replaceAll("{{audio}}", phonetic.audio);
		}
		let data = generalTemplate
			.replaceAll("{{word}}", dictionaryWord.word)
			.replaceAll("{{origin}}", dictionaryWord.origin || "unknown")
			.replaceAll("{{meanings}}", meanings)
			.replaceAll("{{phonetics}}", phonetics);

		await adapter.write(filePath, data);
	}
}
