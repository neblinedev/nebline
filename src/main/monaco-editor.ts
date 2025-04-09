import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'

export async function initializeMonaco(): Promise<typeof monaco> {
  loader.config({
    monaco
  })
  return loader.init()
}
