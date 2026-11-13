import { en } from './en';
import { ru } from './ru';

export const langs = ['ru', 'en'] as const;
export type Lang = (typeof langs)[number];

const dicts = { ru, en };

export const isLang = (value: string): value is Lang => (langs as readonly string[]).includes(value);
export const getDict = (lang: Lang) => dicts[lang];
