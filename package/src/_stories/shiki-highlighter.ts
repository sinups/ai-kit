import { createHighlighter, type HighlighterGeneric } from 'shiki';
import { createShikiHighlighter, type SyntaxHighlighter } from '../utils/highlighter';

const THEMES = { light: 'vitesse-light', dark: 'vitesse-dark' };
const LANGUAGES = ['ts', 'tsx', 'js', 'json', 'bash', 'python', 'css', 'diff', 'yaml', 'markdown'];

let shiki: Promise<HighlighterGeneric<string, string>> | null = null;
let adapter: SyntaxHighlighter | null = null;

/** Async highlighter for stories: loads shiki with a few languages on first use */
export const storyHighlighter: SyntaxHighlighter = async (code, language) => {
  shiki ??= createHighlighter({ themes: Object.values(THEMES), langs: LANGUAGES }) as Promise<
    HighlighterGeneric<string, string>
  >;
  adapter ??= createShikiHighlighter(await shiki, THEMES);
  return adapter(code, language);
};
