/* global test, expect, beforeEach */
import { kea, resetContext, getStore, activatePlugin } from 'kea'
import sagaPlugin from '../index' // install the plugin

import './helper/jsdom'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

beforeEach(() => {
  resetContext()
  activatePlugin(sagaPlugin)
})

test('the saga starts and stops with the component', () => {
  const store = getStore()

  let sagaStarted = false
  let sagaCancelled = false

  const logicWithSaga = kea({
    * start () {
      sagaStarted = true
    },
    * stop () {
      sagaCancelled = true
    }
  })

  const withSaga = kea({ sagas: [logicWithSaga] })

  expect(sagaStarted).toBe(false)

  const SampleComponent = () => <div>bla bla</div>
  const ConnectedComponent = withSaga(SampleComponent)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>
  )

  expect(sagaStarted).toBe(true)
  expect(sagaCancelled).toBe(false)

  wrapper.unmount()

  expect(sagaStarted).toBe(true)
  expect(sagaCancelled).toBe(true)
})

test('the saga is cancelled only when all connected components are unmounted', () => {
  const store = getStore()

  let sagaStarted = 0
  let sagaCancelled = 0
  let componentUnmounted = false

  const logicWithSaga = kea({
    * start () {
      sagaStarted += 1
    },
    * stop () {
      sagaCancelled += 1
    }
  })

  expect(sagaStarted).toBe(0)

  const SampleComponent1 = () => <div>comp1</div>
  const SampleComponent2 = () => <div>comp2</div>
  class SampleComponent3 extends Component {
    componentWillUnmount () {
      componentUnmounted = true
    }
    render () {
      return <div>comp3</div>
    }
  }

  // create 3 unique components that are connected to the same saga
  const ConnectedComponent1 = kea({ sagas: [logicWithSaga] })(SampleComponent1)
  const ConnectedComponent2 = kea({ sagas: [logicWithSaga] })(SampleComponent2)
  const ConnectedComponent3 = kea({ sagas: [logicWithSaga] })(SampleComponent3)

  const disabler = kea({
    actions: () => ({
      disable: true
    }),
    reducers: ({ actions }) => ({
      disabled: [
        false,
        PropTypes.bool,
        {
          [actions.disable]: () => true
        }
      ]
    })
  })

  class ComponentToDisable extends Component {
    render () {
      const { disabled } = this.props
      return (
        <div>
          <ConnectedComponent1 />
          <ConnectedComponent2 />
          {disabled ? null : <ConnectedComponent3 />}
        </div>
      )
    }
  }
  const ComponentWithDisabler = disabler(ComponentToDisable)

  const wrapper = mount(
    <Provider store={store}>
      <ComponentWithDisabler />
    </Provider>
  )

  expect(sagaStarted).toBe(1)
  expect(sagaCancelled).toBe(0)
  expect(componentUnmounted).toBe(false)

  // run the disabler, removing component #3
  const mountedDisabler = wrapper.find('ComponentToDisable').instance()
  expect(Object.keys(mountedDisabler.actions)).toEqual(['disable'])
  mountedDisabler.actions.disable()

  // exppect nothing to be cancelled, but the component to be unmounted
  expect(sagaStarted).toBe(1)
  expect(sagaCancelled).toBe(0)
  expect(componentUnmounted).toBe(true)

  // close up shop
  wrapper.unmount()

  expect(sagaStarted).toBe(1)
  expect(sagaCancelled).toBe(1)
  expect(componentUnmounted).toBe(true)
})
