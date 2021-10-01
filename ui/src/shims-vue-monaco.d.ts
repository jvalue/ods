declare module 'vue-monaco' {
  import * as monaco from 'monaco-editor';
  import { VueConstructor } from 'vue';

  export type Monaco = typeof monaco;

  export interface MonacoEditorProps {
    original: string;
    value: string;
    theme: string;
    language: string;
    option: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    amdRequre: (id: string) => any;
    diffEditor: boolean;
  }

  export interface MonacoEditorConstructor extends VueConstructor {
    props: MonacoEditorProps;
    data: () => void;
    monaco: Monaco;
    getEditor: () => monaco.editor.IStandaloneCodeEditor;
  }

  export const MonacoEditor: MonacoEditorConstructor;
  export default MonacoEditor;
}
