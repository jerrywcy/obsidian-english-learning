import { normalizePath, TFile } from "obsidian";
import { DefinitionSource } from 'src/types';
import { vocabularyPath } from 'src/constants';
import { FreeDictionaryAPIDefinitionSource } from 'src/freeDictionaryAPI';
import { EnglishLearningPluginSettings } from 'src/settings';
import { parseArticle } from 'src/stringHandler';