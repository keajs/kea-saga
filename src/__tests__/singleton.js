/* global test, expect, beforeEach */
import { kea, resetContext, keaReducer, getContext } from 'kea'
import sagaPlugin, { keaSaga } from '../index'

import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { put } from 'redux-saga/effects'

import PropTypes from 'prop-types'

beforeEach(() => {
  resetContext({ plugins: [ sagaPlugin ] })
})

test('can have a kea with only a saga', () => {
  let sagaRan = false

  // must run keaReducer at first so there is a point where to mount the keas
  const reducers = combineReducers({
    scenes: keaReducer('scenes')
  })

  const sagaLogic = kea({
    start: function * () {
      expect(this.get).not.toBeDefined()
      expect(this.fetch).not.toBeDefined()
      sagaRan = true
    }
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'saga'])

  expect(sagaLogic.saga).toBeDefined()

  expect(sagaRan).toBe(false)

  const sagaMiddleware = createSagaMiddleware()
  const finalCreateStore = compose(
    applyMiddleware(sagaMiddleware)
  )(createStore)
  finalCreateStore(reducers)

  sagaMiddleware.run(sagaLogic.saga)

  expect(sagaRan).toBe(true)
})

test('can access defined actions', () => {
  let sagaRan = false

  const reducers = combineReducers({
    scenes: keaReducer('scenes')
  })

  const sagaLogic = kea({
    actions: () => ({
      doSomething: (input) => ({ input })
    }),
    reducers: ({ actions }) => ({
      something: [false, PropTypes.bool, {}]
    }),
    start: function * () {
      expect(this.path).toBeDefined()
      expect(this.actions).toBeDefined()
      expect(this.get).toBeDefined()
      expect(this.fetch).toBeDefined()
      expect(Object.keys(this.actions)).toEqual([ 'doSomething' ])

      const { doSomething } = this.actions
      expect(doSomething('input-text')).toEqual({ type: doSomething.toString(), payload: { input: 'input-text' } })

      sagaRan = true
    }
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'saga'])

  expect(sagaLogic.saga).toBeDefined()

  expect(sagaRan).toBe(false)

  const sagaMiddleware = createSagaMiddleware()
  const finalCreateStore = compose(
    applyMiddleware(sagaMiddleware)
  )(createStore)
  finalCreateStore(reducers)

  sagaMiddleware.run(sagaLogic.saga)

  expect(sagaRan).toBe(true)
})

test('can access values on reducer', () => {
  let sagaRan = false

  const reducers = combineReducers({
    kea: keaReducer('kea'),
    scenes: keaReducer('scenes')
  })

  const sagaLogic = kea({
    actions: () => ({
      setString: (string) => ({ string })
    }),
    reducers: ({ actions }) => ({
      ourString: ['nothing', PropTypes.string, {
        [actions.setString]: (state, payload) => payload.string
      }]
    }),
    start: function * () {
      const { setString } = this.actions

      expect(this.get).toBeDefined()
      expect(this.fetch).toBeDefined()

      expect(yield this.get('ourString')).toBe('nothing')

      yield put(setString('something'))

      expect(yield this.get('ourString')).toBe('something')
      expect(yield this.fetch('ourString')).toEqual({ ourString: 'something' })

      sagaRan = true
    }
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

  const context = getContext()
  context.store = finalCreateStore(reducers)

  sagaLogic.mount()

  sagaMiddleware.run(keaSaga)
  sagaMiddleware.run(sagaLogic.saga)

  expect(sagaRan).toBe(true)
})
