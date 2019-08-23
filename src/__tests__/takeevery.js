/* global test, expect, beforeEach */
import { kea, resetContext, keaReducer, getContext } from 'kea'
import sagaPlugin, { keaSaga } from '../index'

import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'

import PropTypes from 'prop-types'

beforeEach(() => {
  resetContext({ plugins: [ sagaPlugin ] })
})

test('takeEvery and takeLatest work with workers', () => {
  let sagaRan = false
  let everyRan = false
  let latestRan = false

  const reducers = combineReducers({
    scenes: keaReducer('scenes')
  })

  const sagaLogic = kea({
    actions: () => ({
      doEvery: (input) => ({ input }),
      doLatest: (input) => ({ input })
    }),
    reducers: ({ actions }) => ({
      something: [false, PropTypes.bool, {}]
    }),
    start: function * () {
      expect(this.get).toBeDefined()
      expect(this.fetch).toBeDefined()
      sagaRan = true
    },
    takeEvery: ({ actions, workers }) => ({
      [actions.doEvery]: workers.doEvery
    }),
    takeLatest: ({ actions, workers }) => ({
      [actions.doLatest]: workers.doLatest
    }),
    workers: {
      * doEvery () {
        expect(this.actions).toBeDefined()
        expect(this.get).toBeDefined()
        expect(this.fetch).toBeDefined()
        everyRan = true
      },
      * doLatest () {
        latestRan = true
      }
    }
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'saga'])

  expect(sagaLogic.saga).toBeDefined()
  expect(sagaLogic.workers).toBeDefined()
  expect(Object.keys(sagaLogic.workers)).toEqual(['doEvery', 'doLatest'])

  expect(sagaRan).toBe(false)

  const sagaMiddleware = createSagaMiddleware()
  const finalCreateStore = compose(
    applyMiddleware(sagaMiddleware)
  )(createStore)

  const store = finalCreateStore(reducers)

  sagaMiddleware.run(keaSaga)
  sagaMiddleware.run(sagaLogic.saga)

  store.dispatch(sagaLogic.actionCreators.doEvery('input-every'))
  store.dispatch(sagaLogic.actionCreators.doLatest('input-latest'))

  expect(sagaRan).toBe(true)
  expect(everyRan).toBe(true)
  expect(latestRan).toBe(true)
})

test('takeEvery and takeLatest work with inline functions', () => {
  let sagaRan = false
  let everyRan = false
  let latestRan = false

  const reducers = combineReducers({
    scenes: keaReducer('scenes')
  })

  const sagaLogic = kea({
    actions: () => ({
      doEvery: (input) => ({ input }),
      doLatest: (input) => ({ input })
    }),
    reducers: ({ actions }) => ({
      something: [false, PropTypes.bool, {}]
    }),
    start: function * () {
      expect(this.get).toBeDefined()
      expect(this.fetch).toBeDefined()
      sagaRan = true
    },
    takeEvery: ({ actions, workers }) => ({
      [actions.doEvery]: function * () {
        expect(this.actions).toBeDefined()
        expect(this.get).toBeDefined()
        expect(this.fetch).toBeDefined()
        everyRan = true
      }
    }),
    takeLatest: ({ actions, workers }) => ({
      [actions.doLatest]: function * () {
        latestRan = true
      }
    })
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'saga'])

  expect(sagaLogic.saga).toBeDefined()
  expect(sagaLogic.workers).not.toBeDefined()

  expect(sagaRan).toBe(false)

  const sagaMiddleware = createSagaMiddleware()
  const finalCreateStore = compose(
    applyMiddleware(sagaMiddleware)
  )(createStore)

  const store = finalCreateStore(reducers)

  sagaMiddleware.run(keaSaga)
  sagaMiddleware.run(sagaLogic.saga)

  store.dispatch(sagaLogic.actionCreators.doEvery('input-every'))
  store.dispatch(sagaLogic.actionCreators.doLatest('input-latest'))

  expect(sagaRan).toBe(true)
  expect(everyRan).toBe(true)
  expect(latestRan).toBe(true)
})
