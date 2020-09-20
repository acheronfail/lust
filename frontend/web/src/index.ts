import * as monaco from 'monaco-editor';
import debounce from 'debounce';
import { runCode } from './run';
import * as editor from './editor';
import './index.scss';

const editors: monaco.editor.IStandaloneCodeEditor[] = [];

const CODE_EDITOR_DEFAULT_VALUE = `\
fn main() {
    println!("Hello, World!");
}
`;

const TOML_EDITOR_DEFAULT_VALUE = `\
[package]
name = "lust-package"
version = "0.1.0"
edition = "2018"

[dependencies]
`;

const EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark',
  fontSize: 20,
  fontFamily: 'Iosevka, Ubuntu Mono, Roboto Mono, Courier, monospace',
  minimap: {
    enabled: true,
    showSlider: 'always',
  },
};

function init() {
  initEditors();
  initOutput();
}

async function initEditors() {
  const codeEditor = await editor.createEditor(document.getElementById('editor'), {
    ...EDITOR_OPTIONS,
    language: 'rust',
    value: localStorage.getItem('code') || CODE_EDITOR_DEFAULT_VALUE,
  });
  const tomlEditor = await editor.createEditor(document.querySelector('.tab-container[data-tabid="Cargo.toml"]'), {
    ...EDITOR_OPTIONS,
    language: 'toml',
    value: localStorage.getItem('toml') || TOML_EDITOR_DEFAULT_VALUE,
  });

  codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    selectTab('output');
    runCode({ codeEditor, tomlEditor, clearCache: false });
  });
  codeEditor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    selectTab('output');
    runCode({ codeEditor, tomlEditor, clearCache: true });
  });

  const saveChanges = (editor: monaco.editor.IStandaloneCodeEditor, key: string) => {
    editor.getModel().onDidChangeContent(
      debounce((_: monaco.editor.IModelContentChangedEvent) => {
        localStorage.setItem(key, editor.getValue());
      }, 500)
    );
  };

  saveChanges(codeEditor, 'code');
  saveChanges(tomlEditor, 'toml');

  editors.push(codeEditor, tomlEditor);
}

function initOutput() {
  const tabs = document.querySelector('#output .tabs');
  tabs.addEventListener('click', (event: Event) => {
    // FIXME:
    const tabId = (event.target as any).dataset.tabid;
    if (tabId) {
      selectTab(tabId);
    }
  });
}

function selectTab(id: string) {
  document.querySelectorAll('#output .tabs .active').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll(`#output .tabs [data-tabid="${id}"]`).forEach((el) => el.classList.add('active'));
  // Re-layout editors on tab change
  editors.forEach((editor) => editor.layout());
}

init();
