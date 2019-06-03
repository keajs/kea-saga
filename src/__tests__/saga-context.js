/* global test, expect, beforeEach */
import { kea, resetContext, getStore, getContext } from 'kea'
import sagaPlugin from '../index' // install the plugin

import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import { put, delay } from 'redux-saga/effects'
import Adapter from 'enzyme-adapter-react-16'

const promiseDelay =  ms => new Promise((resolve) => setTimeout(resolve, ms))

configure({ adapter: new Adapter() })

beforeEach(() => {
})

test('sagas stop when context resets', () => { 
  let counter = 0

  resetContext({ plugins: [ sagaPlugin ] })
  getStore()

  const logic = kea({
    actions: () => ({
      increment: true
    }),

    reducers: ({ actions }) => ({
      reducerCounter: [0, {
        [actions.increment]: (state) => state + 1
      }],
    }),

    takeEvery: ({ actions }) => ({
      [actions.increment]: function * () {
        counter += 1
      }  
    })
  })

  expect(counter).toBe(0)

  const unmount = logic.mount()

  expect(counter).toBe(0)

  const { store } = getContext()
  store.dispatch(logic.actions.increment())

  expect(logic.selectors.reducerCounter(store.getState())).toBe(1)
  expect(counter).toBe(1)

  // leave mounted on purpose!
  // unmount()

  resetContext({ plugins: [ sagaPlugin ] })
  getStore()

  const { store: store2 } = getContext()

  const unmount2 = logic.mount()

  expect(logic.selectors.reducerCounter(store2.getState())).toBe(0)
  expect(counter).toBe(1)

  store2.dispatch(logic.actions.increment())

  expect(logic.selectors.reducerCounter(store2.getState())).toBe(1)
  expect(counter).toBe(2)

  unmount2()
})

test('forks stop when context resets', async () => { 
  let counter = 0

  resetContext({ plugins: [ sagaPlugin ] })
  getStore()

  const logic = kea({
    actions: () => ({
      increment: true
    }),

    reducers: ({ actions }) => ({
      reducerCounter: [0, {
        [actions.increment]: (state) => state + 1
      }],
    }),

    takeEvery: ({ actions }) => ({
      [actions.increment]: function * () {
        yield delay(1000)
        counter += 1
      }  
    })
  })

  expect(counter).toBe(0)
  logic.mount()
  expect(counter).toBe(0)

  const { store } = getContext()
  store.dispatch(logic.actions.increment())

  // reducerCounter increments immediately
  expect(logic.selectors.reducerCounter(store.getState())).toBe(1)

  // counter increments after a delay
  expect(counter).toBe(0)
  await promiseDelay(1001)
  expect(counter).toBe(1)

  // dispatch new action 
  store.dispatch(logic.actions.increment())

  // and reset the context
  resetContext({ plugins: [ sagaPlugin ] })
  getStore()

  const { store: store2 } = getContext()

  logic.mount()

  expect(logic.selectors.reducerCounter(store2.getState())).toBe(0)
  expect(counter).toBe(1)

  store2.dispatch(logic.actions.increment())

  expect(logic.selectors.reducerCounter(store2.getState())).toBe(1)

  expect(counter).toBe(1)
  await promiseDelay(1001)
  // expect(counter).toBe(2) // should not be 3!
})
