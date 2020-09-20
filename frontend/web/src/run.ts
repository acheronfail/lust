import { editor } from 'monaco-editor';
import ANSIConverter from 'ansi-to-html';

interface RunRequest {
  clear_cache: boolean;
  code: string;
  toml: string;
}

interface RunResponse {
  code: number;
  stdout: string;
  stderr: string;
}

interface RunOptions {
  clearCache: boolean;
  codeEditor: editor.IStandaloneCodeEditor;
  tomlEditor: editor.IStandaloneCodeEditor;
}

export function runCode(options: RunOptions) {
  setOutput({ stdout: '<marquee direction="right">Waiting...</marquee>', stderr: '<marquee>Waiting...</marquee>' });
  fetch('http://localhost:9000/api/run', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(<RunRequest>{
      clear_cache: options.clearCache,
      code: options.codeEditor.getValue(),
      toml: options.tomlEditor.getValue(),
    }),
  })
    .then((res) => res.json())
    .then((data: RunResponse) => setOutput(data))
    .catch((err: Error) => setOutput({ stdout: '', stderr: err.message }));
}

function setOutput(options: { stdout: string; stderr: string }) {
  const ansiConverter = new ANSIConverter();
  document.querySelector('.stdout').innerHTML = ansiConverter.toHtml(options.stdout);
  document.querySelector('.stderr').innerHTML = ansiConverter.toHtml(options.stderr);
}
