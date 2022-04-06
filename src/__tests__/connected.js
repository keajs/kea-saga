/* global test, expect, beforeEach */
import { kea, resetContext, getContext } from 'kea'
import { sagaPlugin } from '../index'
import { put, take } from 'redux-saga/effects'
import React from 'react'
import { Provider } from 'react-redux'

beforeEach(() => {
  resetContext({ plugins: [sagaPlugin] })
})

test('can run sagas connected via { sagas: [] }', () => {
  let sagaRan = false
  let connectedSagaRan = false
  let ranLast

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    start: function* () {
      expect(this.path).toEqual(['scenes', 'saga', 'connected'])
      connectedSagaRan = true
      ranLast = 'connected'
    },
  })

  const sagaLogic = kea({
    path: () => ['scenes', 'saga', 'base'],
    sagas: [connectedSagaLogic.build().saga],
    start: function* () {
      expect(this.path).toEqual(['scenes', 'saga', 'base'])
      sagaRan = true
      ranLast = 'base'
    },
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'saga'])

  sagaLogic.mount()

  expect(sagaLogic.saga).toBeDefined()

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)
  expect(ranLast).toBe('base')
})

test('connect when passing the entire logic to sagas: []', () => {
  const { store } = getContext()

  let otherConnectedRan = false
  let sagaRan = false
  let connectedSagaRan = false

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    start: function* () {
      expect(this.path).toEqual(['scenes', 'saga', 'connected'])
      connectedSagaRan = true
    },
  })

  const sagaLogic2 = kea({
    connect: {
      sagas: [
        function* () {
          otherConnectedRan = true
        },
      ],
    },
    sagas: [connectedSagaLogic],
    start: function* () {
      sagaRan = true
    },
  })

  const unmount = sagaLogic2.mount()

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)
  expect(otherConnectedRan).toBe(true)

  unmount()

  // try again and now mount the component
  otherConnectedRan = false
  sagaRan = false
  connectedSagaRan = false

  const ConnectedComponent = sagaLogic2(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>,
  )

  // everything should have run
  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)
  expect(otherConnectedRan).toBe(true)
  wrapper.unmount()
})

test('sagas get connected actions', () => {
  const { store } = getContext()

  let sagaRan = false
  let connectedSagaRan = false

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    actions: () => ({
      randomAction: true,
    }),
    start: function* () {
      expect(this.path).toEqual(['scenes', 'saga', 'connected'])
      expect(Object.keys(this.actionCreators)).toEqual(['randomAction'])
      connectedSagaRan = true
    },
  })

  const sagaLogic = kea({
    connect: {
      actions: [connectedSagaLogic, ['randomAction']],
      sagas: [connectedSagaLogic],
    },
    path: () => ['scenes', 'saga', 'base'],
    actions: () => ({
      myAction: true,
    }),
    start: function* () {
      expect(this.path).toEqual(['scenes', 'saga', 'base'])
      expect(Object.keys(this.actionCreators).sort()).toEqual(['myAction', 'randomAction'])
      sagaRan = true
    },
  })

  expect(sagaLogic._isKea).toBe(true)
  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'saga'])

  expect(sagaRan).toBe(false)

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>,
  )

  expect(sagaLogic.saga).toBeDefined()

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('can get/fetch data from connected kea logic stores', () => {
  let sagaRan = false
  let connectedSagaRan = false

  const { store } = getContext()

  const connectedSagaLogic = kea({
    path: () => ['scenes', 'saga', 'connected'],
    actions: () => ({
      updateValue: (number) => ({ number }),
    }),
    reducers: ({ actions }) => ({
      connectedValue: [
        0,
        {
          [actions.updateValue]: (_, payload) => payload.number,
        },
      ],
    }),
    start: function* () {
      const { updateValue } = this.actionCreators
      yield take(updateValue().toString)

      expect(yield this.get('connectedValue')).toBe(4)

      connectedSagaRan = true
    },
  })

  const sagaLogic = kea({
    connect: {
      actions: [connectedSagaLogic, ['updateValue']],
      props: [connectedSagaLogic, ['connectedValue']],
      sagas: [connectedSagaLogic],
    },
    path: () => ['scenes', 'saga', 'base'],
    actions: () => ({
      myAction: true,
    }),
    start: function* () {
      const { updateValue, myAction } = this.actionCreators

      expect(updateValue).toBeDefined()
      expect(myAction).toBeDefined()

      expect(yield this.get('connectedValue')).toBe(0)
      expect(yield connectedSagaLogic.get('connectedValue')).toBe(0)
      yield put(updateValue(4))
      expect(yield connectedSagaLogic.get('connectedValue')).toBe(4)
      expect(yield this.get('connectedValue')).toBe(4)

      sagaRan = true
    },
  })

  expect(sagaRan).toBe(false)

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>,
  )

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('will autorun sagas if not manually connected', () => {
  let sagaRan = false
  let connectedSagaRan = false

  const { store } = getContext()

  const connectedSagaLogic = kea({
    actions: () => ({
      updateValue: true,
    }),
    start: function* () {
      connectedSagaRan = true
    },
  })

  const sagaLogic = kea({
    connect: {
      actions: [connectedSagaLogic, ['updateValue']],
    },
    actions: () => ({
      myAction: true,
    }),
    start: function* () {
      sagaRan = true
    },
  })

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>,
  )

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('will autorun sagas if not manually connected, even if no internal saga', () => {
  let connectedSagaRan = false

  const { store } = getContext()

  const connectedSagaLogic = kea({
    actions: () => ({
      updateValue: true,
    }),
    start: function* () {
      connectedSagaRan = true
    },
  })

  const sagaLogic = kea({
    connect: {
      actions: [connectedSagaLogic, ['updateValue']],
    },
  })

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>,
  )

  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'saga'])
  expect(connectedSagaRan).toBe(true)

  wrapper.unmount()
})

test('will not run sagas that are already running', () => {
  let sagaRan = false
  let connectedSagaRan = 0

  const { store } = getContext()

  const connectedSagaLogic = kea({
    actions: () => ({
      updateValue: true,
    }),
    start: function* () {
      connectedSagaRan += 1
    },
  })

  const sagaLogic = kea({
    connect: {
      actions: [connectedSagaLogic, ['updateValue']],
      sagas: [connectedSagaLogic],
    },
    sagas: [connectedSagaLogic],
    actions: () => ({
      myAction: true,
    }),
    start: function* () {
      sagaRan = true
    },
  })

  const ConnectedComponent = sagaLogic(() => <div />)
  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>,
  )

  expect(sagaRan).toBe(true)
  expect(connectedSagaRan).toBe(1)

  wrapper.unmount()
})
