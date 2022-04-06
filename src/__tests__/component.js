/* global test, expect, beforeEach */
import { getContext, kea, resetContext } from 'kea'
import { sagaPlugin } from '../index'
import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import { put } from 'redux-saga/effects'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

beforeEach(() => {
  resetContext({ plugins: [sagaPlugin] })
})

const SampleComponent1 = () => <div>bla bla bla</div>
const SampleComponent2 = () => <div>bla bla bla</div>
const SampleComponent3 = () => <div>bla bla bla</div>
const SampleComponent4 = () => <div>bla bla bla</div>

test('the saga starts and stops with the component', () => {
  const store = getContext().store

  let sagaStarted = false

  const logicWithSaga = kea({
    *start() {
      expect(this.props.id).toBe(12)
      sagaStarted = true
    },
  })

  expect(sagaStarted).toBe(false)

  const ConnectedComponent = logicWithSaga(SampleComponent1)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>,
  )

  expect(sagaStarted).toBe(true)

  wrapper.unmount()
})

test('the actions have a key in them', () => {
  const store = getContext().store

  let sagaStarted = false
  let sagaStopped = false
  let takeEveryRan = false

  const getActionsFromHere = kea({
    actions: () => ({
      something: true,
    }),
  })

  const logicWithSaga = kea({
    connect: {
      actions: [getActionsFromHere, ['something']],
    },

    key: (props) => props.id,

    path: (key) => ['scenes', 'sagaProps', key],

    actions: () => ({
      myAction: (value) => ({ value }),
    }),

    reducers: ({ actions }) => ({
      someData: [
        'nothing',
        PropTypes.string,
        {
          [actions.myAction]: (state, payload) => payload.value,
        },
      ],
    }),

    *start() {
      expect(this.key).toBe(12)
      expect(this.props.id).toBe(12)
      expect(this.path).toEqual(['scenes', 'sagaProps', 12])
      expect(Object.keys(this.actionCreators)).toEqual(['something', 'myAction'])

      const { myAction } = this.actionCreators
      expect(myAction('something')).toEqual({ type: myAction.toString(), payload: { value: 'something' } })
      expect(myAction.toString()).toContain('sagaProps.12')

      expect(yield this.get('someData')).toEqual('nothing')
      yield put(myAction('something'))

      expect(yield this.get('someData')).toEqual('something')

      sagaStarted = true
    },

    *stop() {
      sagaStopped = true
    },

    takeEvery: ({ actions, workers }) => ({
      [actions.myAction]: workers.doStuff,
    }),

    workers: {
      *doStuff(action) {
        const { value } = action.payload
        expect(value).toBe('something')

        // should already be in the store
        expect(yield this.get('someData')).toBe('something')

        takeEveryRan = true
      },
    },
  })

  expect(sagaStarted).toBe(false)

  const ConnectedComponent = logicWithSaga(SampleComponent2)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>,
  )
  expect(sagaStarted).toBe(true)
  expect(takeEveryRan).toBe(true)

  wrapper.unmount()

  expect(sagaStopped).toBe(true)
})

test('can get() connected values', () => {
  const store = getContext().store

  let sagaStarted = false
  let takeEveryRan = false

  const firstLogic = kea({
    actions: () => ({
      myAction: true,
    }),
    reducers: ({ actions }) => ({
      connectedValue: [
        12,
        PropTypes.number,
        {
          [actions.myAction]: () => 42,
        },
      ],
    }),
  })

  const otherLogicWithSaga = kea({
    connect: {
      actions: [firstLogic, ['myAction']],
      props: [firstLogic, ['connectedValue']],
    },

    path: (key) => ['scenes', 'sagaProps2'],

    *start() {
      expect(this.path).toEqual(['scenes', 'sagaProps2'])
      expect(Object.keys(this.actionCreators)).toEqual(['myAction'])

      const { myAction } = this.actionCreators

      expect(yield firstLogic.get('connectedValue')).toEqual(12)
      expect(yield this.get('connectedValue')).toEqual(12)
      yield put(myAction())

      expect(yield firstLogic.get('connectedValue')).toEqual(42)
      expect(yield this.get('connectedValue')).toEqual(42)

      sagaStarted = true
    },

    takeEvery: ({ actions, workers }) => ({
      [actions.myAction]: workers.doStuff,
    }),

    workers: {
      *doStuff(action) {
        expect(yield this.get('connectedValue')).toBe(42)
        takeEveryRan = true
      },
    },
  })

  expect(sagaStarted).toBe(false)

  const ConnectedComponent = otherLogicWithSaga(SampleComponent3)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>,
  )

  expect(sagaStarted).toBe(true)
  expect(takeEveryRan).toBe(true)

  wrapper.unmount()
})

test('select gets props', () => {
  const store = getContext().store

  let sagaStarted = false

  const logicWithSaga = kea({
    path: (key) => ['scenes', 'sagaProps2'],

    reducers: ({ actions }) => ({
      ten: [10, PropTypes.number, {}],
    }),

    selectors: ({ selectors }) => ({
      idPlusTen: [() => [selectors.ten, (_, props) => props.id], (ten, id) => ten + id, PropTypes.number],
    }),

    *start() {
      expect(yield this.get('ten')).toBe(10)
      expect(yield this.get('idPlusTen')).toBe(22)
      sagaStarted = true
    },
  })

  expect(sagaStarted).toBe(false)

  const ConnectedComponent = logicWithSaga(SampleComponent4)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>,
  )

  expect(sagaStarted).toBe(true)

  wrapper.unmount()
})
