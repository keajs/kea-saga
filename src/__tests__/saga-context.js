/* global test, expect, beforeEach */
import { kea, resetContext, getStore, getContext } from 'kea'
import sagaPlugin from '../index' // install the plugin

import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import { put } from 'redux-saga/effects'
import Adapter from 'enzyme-adapter-react-16'

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
