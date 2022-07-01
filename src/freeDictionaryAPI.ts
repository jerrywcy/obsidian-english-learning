import { request } from "obsidian";
import { DefinitionSource, DictionaryWord } from "src/types"

export class FreeDictionaryAPIDefinitionSource implements DefinitionSource {
    API_END_POINT = "https://api.dictionaryapi.dev/api/v2/entries/";

    public name = "Free Dictionary API";
    public url = "https://dictionaryapi.dev/";
    public offline = false;

    protected constructRequest(query: string, lang = "en"): string {
        return this.API_END_POINT + lang + "/" + query;
    }

    async getDefinition(query: string, lang = "en"): Promise<DictionaryWord> {
        let result: string;
        try {
            const url = this.constructRequest(encodeURIComponent(query), lang);
            result = await request({ url });
        }
        catch (err) {
            return Promise.reject(err);
        }

        const json = (await JSON.parse(result) as DictionaryWord[]);

        if (!json || json["title"]) {
            return Promise.reject(json["title"]);
        }

        return json.first();
    }
}