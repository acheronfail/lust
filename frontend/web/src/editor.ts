import { loadWASM } from 'onigasm';
import { Registry } from 'monaco-textmate';
import { wireTmGrammars } from 'monaco-editor-textmate';
import * as monaco from 'monaco-editor';
import * as patchedMonacoTheme from './editor-theme.json';

const registry = new Registry({
  getGrammarDefinition: async (_scopeName: string) => {
    return {
      format: 'plist',
      content: await fetch('/TOML.tmLanguage').then((res) => res.text()),
    };
  },
});

let hasLoadedOniguruma = false;
export async function createEditor(element: HTMLElement, options: monaco.editor.IStandaloneEditorConstructionOptions) {
  // Load Oniguruma Web Assembly if we haven't already
  if (!hasLoadedOniguruma) {
    await loadWASM('/onigasm.wasm');
    hasLoadedOniguruma = true;
  }

  // Use patched theme which supported TextMate grammars
  monaco.editor.defineTheme('vs-code-theme-converted', <any>patchedMonacoTheme);

  // Prepare and register grammars
  const grammars = new Map();
  grammars.set('toml', 'source.toml');
  Array.from(grammars.keys()).forEach((id) => monaco.languages.register({ id }));

  // Create editor
  const editor = monaco.editor.create(element, {
    ...options,
    theme: 'vs-code-theme-converted',
  });

  // Wire in TextMate grammars to Monaco
  await wireTmGrammars(monaco, registry, grammars, editor);

  return editor;
}
