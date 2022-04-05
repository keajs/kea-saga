/* global test, expect, beforeEach */
import { kea, resetContext, getContext } from 'kea'
import sagaPlugin from '../index'
import PropTypes from 'prop-types'

beforeEach(() => {
  resetContext({ plugins: [sagaPlugin], createStore: true })
})

test('takeEvery and takeLatest work with workers', () => {
  const { store } = getContext()

  let sagaRan = false
  let everyRan = false
  let latestRan = false

  const sagaLogic = kea({
    actions: () => ({
      doEvery: (input) => ({ input }),
      doLatest: (input) => ({ input }),
    }),
    reducers: ({ actions }) => ({
      something: [false, PropTypes.bool, {}],
    }),
    start: function* () {
      expect(this.get).toBeDefined()
      expect(this.fetch).toBeDefined()
      sagaRan = true
    },
    takeEvery: ({ actions, workers }) => ({
      [actions.doEvery]: workers.doEvery,
    }),
    takeLatest: ({ actions, workers }) => ({
      [actions.doLatest]: workers.doLatest,
    }),
    workers: {
      *doEvery() {
        expect(this.actions).toBeDefined()
        expect(this.get).toBeDefined()
        expect(this.fetch).toBeDefined()
        everyRan = true
      },
      *doLatest() {
        latestRan = true
      },
    },
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'saga'])

  expect(sagaRan).toBe(false)

  sagaLogic.mount()
  expect(Object.keys(sagaLogic.workers)).toEqual(['doEvery', 'doLatest'])
  expect(sagaLogic.saga).toBeDefined()
  expect(sagaLogic.workers).toBeDefined()

  store.dispatch(sagaLogic.actionCreators.doEvery('input-every'))
  store.dispatch(sagaLogic.actionCreators.doLatest('input-latest'))

  expect(sagaRan).toBe(true)
  expect(everyRan).toBe(true)
  expect(latestRan).toBe(true)
})

test('takeEvery and takeLatest work with inline functions', () => {
  const { store } = getContext()

  let sagaRan = false
  let everyRan = false
  let latestRan = false

  const sagaLogic = kea({
    actions: () => ({
      doEvery: (input) => ({ input }),
      doLatest: (input) => ({ input }),
    }),
    reducers: ({ actions }) => ({
      something: [false, PropTypes.bool, {}],
    }),
    start: function* () {
      expect(this.get).toBeDefined()
      expect(this.fetch).toBeDefined()
      sagaRan = true
    },
    takeEvery: ({ actions, workers }) => ({
      [actions.doEvery]: function* () {
        expect(this.actions).toBeDefined()
        expect(this.get).toBeDefined()
        expect(this.fetch).toBeDefined()
        everyRan = true
      },
    }),
    takeLatest: ({ actions, workers }) => ({
      [actions.doLatest]: function* () {
        latestRan = true
      },
    }),
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'saga'])

  expect(sagaRan).toBe(false)

  sagaLogic.mount()

  expect(sagaLogic.saga).toBeDefined()
  expect(sagaLogic.workers).not.toBeDefined()

  store.dispatch(sagaLogic.actionCreators.doEvery('input-every'))
  store.dispatch(sagaLogic.actionCreators.doLatest('input-latest'))

  expect(sagaRan).toBe(true)
  expect(everyRan).toBe(true)
  expect(latestRan).toBe(true)
})

test('takeEvery and takeLatest work with local actions', () => {
  const { store } = getContext()

  let sagaRan = false
  let everyRan = false
  let latestRan = false

  const sagaLogic = kea({
    actions: () => ({
      doEvery: (input) => ({ input }),
      doLatest: (input) => ({ input }),
    }),
    reducers: ({ actions }) => ({
      something: [false, PropTypes.bool, {}],
    }),
    start: function* () {
      expect(this.get).toBeDefined()
      expect(this.fetch).toBeDefined()
      sagaRan = true
    },
    takeEvery: ({ actions, workers }) => ({
      doEvery: function* () {
        expect(this.actions).toBeDefined()
        expect(this.get).toBeDefined()
        expect(this.fetch).toBeDefined()
        everyRan = true
      },
    }),
    takeLatest: ({ actions, workers }) => ({
      doLatest: function* () {
        latestRan = true
      },
    }),
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'saga'])

  expect(sagaRan).toBe(false)

  sagaLogic.mount()

  expect(sagaLogic.saga).toBeDefined()
  expect(sagaLogic.workers).not.toBeDefined()

  store.dispatch(sagaLogic.actionCreators.doEvery('input-every'))
  store.dispatch(sagaLogic.actionCreators.doLatest('input-latest'))

  expect(sagaRan).toBe(true)
  expect(everyRan).toBe(true)
  expect(latestRan).toBe(true)
})
