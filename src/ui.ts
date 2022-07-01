import { App, ButtonComponent, Modal } from 'obsidian';

export class DatabaseInitModal extends Modal {
    word: string;
    result: boolean;
    resolve: (value: unknown) => void;
    reject: (value: unknown) => void;

    constructor(app: App, word: string, resolve: (value: unknown) => void, reject: (value: unknown) => void) {
        super(app);
        this.word = word;
        this.resolve = resolve;
        this.reject = reject;
    }

    onOpen(): void {
        let { contentEl } = this;
        contentEl.createEl("h1", { text: `Do you know ${this.word}?` });

        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.position = "relative";
        buttonContainer.align = "center";

        buttonContainer.addClass("englishLearningInitDatabaseYesButton");
        const yesButton: ButtonComponent = new ButtonComponent(buttonContainer);
        yesButton.setClass("yes-button");

        yesButton
            .setButtonText("Yes")
            .onClick(evt => {
                this.result = true;
                this.close();
            });

        buttonContainer.addClass("englishLearningInitDatabaseNoButton");
        const noButton: ButtonComponent = new ButtonComponent(buttonContainer);
        noButton.setClass("no-button");

        noButton
            .setButtonText("No")
            .onClick(evt => {
                this.result = false;
                this.close();
            });
    }

    onClose(): void {
        let { contentEl } = this;
        contentEl.empty();
        if (this.result !== undefined)
            this.resolve(this.result);
        else
            this.reject(new Error("Modal closed by user"));
    }
}