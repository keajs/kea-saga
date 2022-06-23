import { kea, resetContext, path, actions } from 'kea'
import { sagaPlugin } from '../index'
import { cancelled, saga, takeEvery, takeLatest, workers } from '../builders'

beforeEach(() => {
  resetContext({
    plugins: [sagaPlugin()],
  })
})

test('saga', () => {
  let sagaRan = false
  let sagaArgument = null

  const sagaLogic = kea([
    path(['saga', 'logic']),
    saga(function* (logic) {
      sagaRan = true
      sagaArgument = logic
    }),
  ])
  expect(sagaRan).toBe(false)
  sagaLogic.mount()
  expect(sagaRan).toBe(true)
  // gets the logic as the first argument
  expect(sagaArgument.pathString).toEqual('saga.logic')
})

test('cancelled', () => {
  let sagaRan = false

  const sagaLogic = kea([
    cancelled(function* () {
      sagaRan = true
    }),
  ])
  expect(sagaRan).toBe(false)
  sagaLogic.mount()
  expect(sagaRan).toBe(false)
  sagaLogic.unmount()
  expect(sagaRan).toBe(true)
})

test('workers, takeEvery, takeLatest', () => {
  let everyRan = false
  let latestRan = false
  let workerRan = false

  const sagaLogic = kea([
    actions({
      runEvery: true,
      runLatest: true,
      runWorker: true,
    }),
    workers({
      worker: function* () {
        workerRan = true
      },
    }),
    takeEvery(({ workers, actionTypes }) => ({
      runEvery: function* () {
        everyRan = true
      },
      runWorker: workers.worker,
    })),
    takeLatest({
      runLatest: function* () {
        latestRan = true
      },
    }),
  ])
  sagaLogic.mount()
  expect(workerRan).toBe(false)
  expect(everyRan).toBe(false)
  expect(latestRan).toBe(false)

  sagaLogic.actions.runEvery()
  expect(everyRan).toBe(true)

  sagaLogic.actions.runLatest()
  expect(latestRan).toBe(true)
})
