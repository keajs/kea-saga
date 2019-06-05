/* global test, expect, beforeEach */
import { kea, resetContext, getStore, activatePlugin } from 'kea'
import sagaPlugin from '../index'

import { PropTypes } from 'prop-types'
import { put, take } from 'redux-saga/effects'
import React from 'react'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

beforeEach(() => {
  resetContext()
  activatePlugin(sagaPlugin)
})

test('can run sagas connected via { sagas: [] }', () => {
  const sagaMiddleware = getStore()._sagaMiddleware

  let sagaRan = false
  let connectedSagaRan = false
  let ranLast

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    start: function * () {
      expect(this.path).toEqual(['scenes', 'saga', 'connected'])
      connectedSagaRan = true
      ranLast = 'connected'
    }
  })

  const sagaLogic = kea({
    path: () => ['scenes', 'saga', 'base'],
    sagas: [connectedSagaLogic.saga],
    start: function * () {
      expect(this.path).toEqual(['scenes', 'saga', 'base'])
      sagaRan = true
      ranLast = 'base'
    }
  })

  expect(sagaLogic._isKeaSingleton).toBe(true)
  expect(sagaLogic.plugins.activated.map(p => p.name)).toEqual(['core', 'saga'])

  expect(sagaLogic.saga).toBeDefined()

  sagaMiddleware.run(sagaLogic.saga)

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)
  expect(ranLast).toBe('base')
})

test('connect when passing the entire logic to sagas: []', () => {
  const store = getStore()
  const sagaMiddleware = store._sagaMiddleware

  let otherConnectedRan = false
  let sagaRan = false
  let connectedSagaRan = false

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    start: function * () {
      expect(this.path).toEqual(['scenes', 'saga', 'connected'])
      connectedSagaRan = true
    }
  })

  const sagaLogic2 = kea({
    connect: {
      sagas: [function * () {
        otherConnectedRan = true
      }]
    },
    sagas: [connectedSagaLogic],
    start: function * () {
      sagaRan = true
    }
  })

  sagaMiddleware.run(sagaLogic2.saga)

  expect(sagaRan).toBe(true)
  // it will not run with .saga, as we track the logic connection separately
  expect(connectedSagaRan).toBe(false)
  // the function * () {} connected saga should run though
  expect(otherConnectedRan).toBe(true)

  // try again and now mount the component
  otherConnectedRan = false
  sagaRan = false
  connectedSagaRan = false

  const ConnectedComponent = sagaLogic2(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  // everything should have run
  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)
  expect(otherConnectedRan).toBe(true)
  wrapper.unmount()
})

test('sagas get connected actions', () => {
  const store = getStore()

  let sagaRan = false
  let connectedSagaRan = false

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    actions: () => ({
      randomAction: true
    }),
    start: function * () {
      expect(this.path).toEqual(['scenes', 'saga', 'connected'])
      expect(Object.keys(this.actions)).toEqual(['randomAction'])
      connectedSagaRan = true
    }
  })

  const sagaLogic = kea({
    connect: {
      actions: [
        connectedSagaLogic, [
          'randomAction'
        ]
      ],
      sagas: [
        connectedSagaLogic
      ]
    },
    path: () => ['scenes', 'saga', 'base'],
    actions: () => ({
      myAction: true
    }),
    start: function * () {
      expect(this.path).toEqual(['scenes', 'saga', 'base'])
      expect(Object.keys(this.actions).sort()).toEqual(['myAction', 'randomAction'])
      sagaRan = true
    }
  })

  expect(sagaLogic._isKeaSingleton).toBe(true)
  expect(sagaLogic.plugins.activated.map(p => p.name)).toEqual(['core', 'saga'])

  expect(sagaLogic.saga).toBeDefined()

  expect(sagaRan).toBe(false)

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('can get/fetch data from connected kea logic stores', () => {
  let sagaRan = false
  let connectedSagaRan = false

  const store = getStore()

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    actions: () => ({
      updateValue: (number) => ({ number })
    }),
    reducers: ({ actions }) => ({
      connectedValue: [0, PropTypes.number, {
        [actions.updateValue]: (_, payload) => payload.number
      }]
    }),
    start: function * () {
      const { updateValue } = this.actions
      yield take(updateValue().toString)

      expect(yield this.get('connectedValue')).toBe(4)

      connectedSagaRan = true
    }
  })

  const sagaLogic = kea({
    connect: {
      actions: [
        connectedSagaLogic, [
          'updateValue'
        ]
      ],
      props: [
        connectedSagaLogic, [
          'connectedValue'
        ]
      ],
      sagas: [
        connectedSagaLogic
      ]
    },
    path: () => ['scenes', 'saga', 'base'],
    actions: () => ({
      myAction: true
    }),
    start: function * () {
      const { updateValue, myAction } = this.actions

      expect(updateValue).toBeDefined()
      expect(myAction).toBeDefined()

      expect(yield this.get('connectedValue')).toBe(0)
      expect(yield connectedSagaLogic.get('connectedValue')).toBe(0)
      yield put(updateValue(4))
      expect(yield connectedSagaLogic.get('connectedValue')).toBe(4)
      expect(yield this.get('connectedValue')).toBe(4)

      sagaRan = true
    }
  })

  expect(sagaRan).toBe(false)

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('will autorun sagas if not manually connected', () => {
  let sagaRan = false
  let connectedSagaRan = false

  const store = getStore()

  const connectedSagaLogic = kea({
    actions: () => ({
      updateValue: true
    }),
    start: function * () {
      connectedSagaRan = true
    }
  })

  const sagaLogic = kea({
    connect: {
      actions: [
        connectedSagaLogic, [
          'updateValue'
        ]
      ]
    },
    actions: () => ({
      myAction: true
    }),
    start: function * () {
      sagaRan = true
    }
  })

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('will autorun sagas if not manually connected, even if no internal saga', () => {
  let connectedSagaRan = false

  const store = getStore()

  const connectedSagaLogic = kea({
    actions: () => ({
      updateValue: true
    }),
    start: function * () {
      connectedSagaRan = true
    }
  })

  const sagaLogic = kea({
    connect: {
      actions: [
        connectedSagaLogic, [
          'updateValue'
        ]
      ]
    }
  })

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(sagaLogic.plugins.activated.map(p => p.name)).toEqual(['core', 'saga'])
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('will not run sagas that are already running', () => {
  let sagaRan = false
  let connectedSagaRan = 0

  const store = getStore()

  const connectedSagaLogic = kea({
    actions: () => ({
      updateValue: true
    }),
    start: function * () {
      connectedSagaRan += 1
    }
  })

  const sagaLogic = kea({
    connect: {
      actions: [
        connectedSagaLogic, [
          'updateValue'
        ]
      ],
      sagas: [
        connectedSagaLogic
      ]
    },
    sagas: [
      connectedSagaLogic
    ],
    actions: () => ({
      myAction: true
    }),
    start: function * () {
      sagaRan = true
    }
  })

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(1)

  wrapper.unmount()
})