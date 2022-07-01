interface Source {
    name: string;
    url: string;
    offline: boolean;
}
export interface DefinitionSource extends Source {
    getDefinition(query: string, lang?: string): Promise<DictionaryWord>;
}

export interface DictionaryWord {
    word: string;
    origin?: string;
    phonetics: Phonetic[];
    meanings: Meaning[];
    toString(): string;
}

export interface Meaning {
    word: string;
    partOfSpeech: string;
    definitions: Definition[];
}

export interface Phonetic {
    word: string;
    text: string;
    audio?: string;
}

export interface Definition {
    word: string;
    definition: string;
    example?: string[];
    synonyms?: string[];
    anonyms?: string[];
}