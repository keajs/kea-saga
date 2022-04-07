import { afterMount, beforeUnmount, getContext, Logic, LogicBuilder } from 'kea'
import {
  call,
  take,
  takeEvery as sagaTakeEvery,
  takeLatest as sagaTakeLatest,
  cancelled as sagaCancelled,
} from 'redux-saga/effects'
import { LogicWithSaga } from './types'
import { cancelSaga, startSaga } from './channel'
import { Saga } from 'redux-saga'
import { addGetAndFetch } from './utils'

let sagaIndex = 0

export function saga<L extends Logic = Logic>(input: Saga): LogicBuilder<L> {
  return (_logic) => {
    const logic = _logic as Logic as LogicWithSaga
    addGetAndFetch(logic)
    let index = sagaIndex++
    afterMount(() => startSaga(index, input.bind(logic)))(_logic)
    beforeUnmount(() => cancelSaga(index))(_logic)
  }
}

export function workers<L extends Logic = Logic>(input: Record<string, Saga>): LogicBuilder<L> {
  return (_logic) => {
    const logic = _logic as Logic as LogicWithSaga
    addGetAndFetch(logic)
    logic.workers ??= {}
    for (const key of Object.keys(input)) {
      if (typeof input[key] === 'function') {
        logic.workers[key] = input[key].bind(logic)
      }
    }
  }
}

export function takeEvery<L extends Logic = Logic>(
  input: Record<string, Saga | Saga[]> | ((logic: L) => Record<string, Saga | Saga[]>),
): LogicBuilder<L> {
  return (_logic) => {
    const logic = _logic as Logic as LogicWithSaga
    addGetAndFetch(logic)
    saga(function* () {
      const actionsToTake = typeof input === 'function' ? input(_logic) : input
      for (const key of Object.keys(actionsToTake)) {
        const actionKey = logic.actionTypes[key] ?? key
        const fn = actionsToTake[key]
        if (Array.isArray(fn)) {
          for (const fun of fn) {
            yield sagaTakeEvery(actionKey, fun.bind(logic))
          }
        } else {
          yield sagaTakeEvery(actionKey, fn.bind(logic))
        }
      }
    })(_logic)
  }
}

export function takeLatest<L extends Logic = Logic>(
  input: Record<string, Saga | Saga[]> | ((logic: L) => Record<string, Saga | Saga[]>),
): LogicBuilder<L> {
  return (_logic) => {
    const logic = _logic as Logic as LogicWithSaga
    addGetAndFetch(logic)
    saga(function* () {
      const actionsToTake = typeof input === 'function' ? input(_logic) : input
      for (const key of Object.keys(actionsToTake)) {
        const actionKey = logic.actionTypes[key] ?? key
        const fn = actionsToTake[key]
        if (Array.isArray(fn)) {
          for (const fun of fn) {
            yield sagaTakeLatest(actionKey, fun.bind(logic))
          }
        } else {
          yield sagaTakeLatest(actionKey, fn.bind(logic))
        }
      }
    })(_logic)
  }
}

export function cancelled<L extends Logic = Logic>(input: Saga): LogicBuilder<L> {
  return (_logic) => {
    const logic = _logic as Logic as LogicWithSaga
    addGetAndFetch(logic)
    saga(function* () {
      try {
        while (true) {
          yield take('wait until worker cancellation')
        }
      } finally {
        // call the cancelled function if cancelled
        if (yield sagaCancelled()) {
          yield call(input.bind(logic))
        }
      }
    })(_logic)
  }
}
