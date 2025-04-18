import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import loader from '@monaco-editor/loader'
import zodToJsonSchema from 'zod-to-json-schema'
import { projectConfigSchema } from '@renderer/lib/project/project-schema'

self.MonacoEnvironment = {
  createTrustedTypesPolicy(): undefined | monaco.ITrustedTypePolicy {
    return undefined
  },
  getWorker(_: unknown, label: string): Worker {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    return new editorWorker()
  }
}

export async function initializeJsonSchema(): Promise<void> {
  try {
    // Convert the Zod schema to JSON Schema using the library
    const jsonSchema = zodToJsonSchema(projectConfigSchema, 'projectConfigSchema')

    // Use the globally imported 'monaco' object
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [
        {
          uri: 'project-schema.json', // A unique URI for the schema itself
          schema: jsonSchema,
          fileMatch: ['*'] // Match all JSON files
        }
      ],
      enableSchemaRequest: true
    })

    // Configure completion settings for better intellisense
    monaco.languages.json.jsonDefaults.setModeConfiguration({
      documentFormattingEdits: true,
      documentRangeFormattingEdits: true,
      completionItems: true,
      hovers: true,
      documentSymbols: true,
      tokens: true,
      colors: true,
      foldingRanges: true,
      diagnostics: true
    })
  } catch (error) {
    console.error('Error configuring JSON schema validation:', error)
  }
}

export async function initializeMonaco(): Promise<typeof monaco> {
  loader.config({ monaco })
  await initializeJsonSchema()

  return loader.init()
}
