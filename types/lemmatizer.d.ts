declare module lemmatizer {
    export class Lemmatizer {
        constructor();
        lemmas(form: string, pos: string): Array<Array<string>>;
    }
}