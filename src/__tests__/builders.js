/* global test, expect, beforeEach */
import { kea, resetContext, getContext, actions } from 'kea'
import { sagaPlugin } from '../index'
import { put } from 'redux-saga/effects'
import { cancelled, saga, takeEvery, takeLatest, workers } from '../builders'

beforeEach(() => {
  resetContext({
    plugins: [sagaPlugin()],
  })
})

test('saga', () => {
  let sagaRan = false

  const sagaLogic = kea([
    saga(function* () {
      sagaRan = true
    }),
  ])
  expect(sagaRan).toBe(false)
  sagaLogic.mount()
  expect(sagaRan).toBe(true)
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
