import { LogicWithSaga } from './types'
import { getContext } from 'kea'

export function addGetAndFetch(logic: LogicWithSaga) {
  if (!('get' in logic) || !logic.get) {
    logic.get = (key?: string) => (key ? logic.values[key] : logic.selector?.(getContext().store.getState()))
  }
  if (!('fetch' in logic) || !logic.fetch) {
    logic.fetch = function (...keys: string[]): any {
      const results: Record<string, any> = {}
      for (const key of keys) {
        results[key] = logic.values[key]
      }
      return results
    }
  }
}
