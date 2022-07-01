import EnglishLearningPlugin from "./main";

import { PluginSettingTab, App, Setting, Vault, TFolder, normalizePath } from "obsidian";


function createDesc(str: string): DocumentFragment {
    let desc = str.split("\n");
    const descEl = document.createDocumentFragment();
    for (let line of desc) {
        descEl.appendText(line);
        descEl.appendChild(document.createElement('br'));
    }
    return descEl;
}

// 配置你的插件设置面板所用的参数的类型
// 你需要在这里预先定义你的设置对应的字符串类型，一般来说只有这三种类型，boolean\string\number
export interface EnglishLearningPluginSettings {
    vocabularyFilePath: string;
    generalTemplate: string;
    meaningTemplate: string;
    phoneticTemplate: string;
    definitionTemplate: string;
}

// 配置你的插件设置面板所有的参数的基础值
// 当你想要加多一个设置默认值的时候，例如 cook: '白切鸡'
// 则同样需要在上边的接口（interface）中加入相关的定义
export const DEFAULT_SETTINGS: EnglishLearningPluginSettings = {
    vocabularyFilePath: 'Vocabulary',
    generalTemplate: `---
tags: [review]
rate: 1
---

# {{word}}

**origin:** {{origin}}

{{phonetics}}

## Meanings

{{meanings}}
`,
    meaningTemplate: `/{{text}}/![]({{link}})`,
    phoneticTemplate: `[{{text}}]({{audio}})
`,
    definitionTemplate: `> {{definition}}

    `
}

export class EnglishLearningPluginSettingTab extends PluginSettingTab {
    plugin: EnglishLearningPlugin;

    constructor(app: App, plugin: EnglishLearningPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Volvabulary File Path")
            .setDesc(createDesc(`The path from vault root to the folder where meaning files are stored.
Will automatically move all files from existing folder on modification so be careful.`))
            .addText((text) => {
                text.setPlaceholder(DEFAULT_SETTINGS.vocabularyFilePath)
                    .setValue(this.plugin.settings.vocabularyFilePath)
                    .onChange(async (value) => {
                        let { vault, fileManager } = app;
                        let oldValue = this.plugin.settings.vocabularyFilePath;
                        await vault.createFolder(value);
                        let oldFolder = vault.getAbstractFileByPath(oldValue) as TFolder;
                        for (let file of oldFolder.children) {
                            await fileManager.renameFile(file, normalizePath(value + "/" + file.name));
                        }
                        await vault.delete(oldFolder);
                        this.plugin.settings.vocabularyFilePath = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("General Template")
            .setDesc(createDesc(`A template that controls the format of meaning files generated.
Available variables:
{{word}}: The word itself.
{{origin}}: The origin of the word.
{{phonetics}}: The phonetics of the word. Can be configured in Phonetic Template.
{{meanings}}: The meanings of the word. Can be configured in Meaning Template`))
            .addTextArea((text) => {
                text.setPlaceholder(DEFAULT_SETTINGS.generalTemplate)
                    .setValue(this.plugin.settings.generalTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.generalTemplate = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 10;
                text.inputEl.cols = 25;
            });

        new Setting(containerEl)
            .setName("Meaning Template")
            .setDesc(createDesc(`Available variables:
{{partOfSpeech}}: The word's part of speech.
{{definitions}}: The definition of the word. Can be configured in Definition Template.`))
            .addTextArea((text) => {
                text.setPlaceholder(DEFAULT_SETTINGS.meaningTemplate)
                    .setValue(this.plugin.settings.meaningTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.meaningTemplate = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 5;
                text.inputEl.cols = 25;
            });

        new Setting(containerEl)
            .setName("Phonetic Template")
            .setDesc(createDesc(`Available variables:
{{text}}: The text form of the phonetic.
{{audio}}: The link to the sound of the phonetic(not necessarily exist).`))
            .addTextArea((text) => {
                text.setPlaceholder(DEFAULT_SETTINGS.phoneticTemplate)
                    .setValue(this.plugin.settings.phoneticTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.phoneticTemplate = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 2;
                text.inputEl.cols = 25;
            });

        new Setting(containerEl)
            .setName("Definition Template")
            .setDesc(createDesc(`Available variables:
{{definition}}: The definition of the word.`))
            .addTextArea((text) => {
                text.setPlaceholder(DEFAULT_SETTINGS.definitionTemplate)
                    .setValue(this.plugin.settings.definitionTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.definitionTemplate = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 3;
                text.inputEl.cols = 25;
            });
    }
}