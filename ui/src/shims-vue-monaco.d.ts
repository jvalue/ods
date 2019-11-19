declare module 'vue-monaco' {
  import { VueConstructor } from 'vue'
  import * as monaco from 'monaco-editor'

  export type Monaco = typeof monaco

  export interface MonacoEditorProps {
    original: string;
    value: string;
    theme: string;
    language: string;
    option: object;
    amdRequre: Function;
    diffEditor: boolean;
  }

  export interface MonacoEditorConstructor extends VueConstructor {
    props: MonacoEditorProps;
    data: () => void;
    monaco: Monaco;
    getEditor: () => monaco.editor.IStandaloneCodeEditor;
  }

  export const MonacoEditor: MonacoEditorConstructor
  export default MonacoEditor
}
