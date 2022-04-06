import { afterMount, beforeUnmount, Logic, LogicBuilder } from 'kea'
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

let sagaIndex = 0

export function saga<L extends Logic = Logic>(input: Saga): LogicBuilder<L> {
  return (logic) => {
    let index = sagaIndex++
    afterMount(() => startSaga(index, input.bind(logic)))(logic)
    beforeUnmount(() => cancelSaga(index))(logic)
  }
}

export function workers<L extends Logic = Logic>(input: Record<string, Saga>): LogicBuilder<L> {
  return (_logic: Logic) => {
    const logic = _logic as LogicWithSaga
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
  return (logic) => {
    saga(function* () {
      const actionsToTake = typeof input === 'function' ? input(logic) : input
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
    })(logic)
  }
}

export function takeLatest<L extends Logic = Logic>(
  input: Record<string, Saga | Saga[]> | ((logic: L) => Record<string, Saga | Saga[]>),
): LogicBuilder<L> {
  return (logic) => {
    saga(function* () {
      const actionsToTake = typeof input === 'function' ? input(logic) : input
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
    })(logic)
  }
}

export function cancelled<L extends Logic = Logic>(input: Saga): LogicBuilder<L> {
  return (logic) => {
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
    })(logic)
  }
}

//
// buildSteps: {
//   saga(logic, input) {
//     // add .fetch() & .get() to all logic stores if there are any selectors
//     if (logic.selectors && Object.keys(logic.selectors).length > 0) {
//       logic.get = function* (key) {
//         return yield select(key ? logic.selectors[key] : logic.selector, logic.props)
//       }
//
//       logic.fetch = function* () {
//         let results = {}
//
//         const keys = Array.isArray(arguments[0]) ? arguments[0] : arguments
//
//         for (let i = 0; i < keys.length; i++) {
//           results[keys[i]] = yield logic.get(keys[i])
//         }
//
//         return results
//       }
//     }
//
//     // add .saga and .workers (if needed)
//     if (input.start || input.stop || input.takeEvery || input.takeLatest || input.workers || logic.connectedSagas) {
//       createSaga(logic, input, useLegacyUnboundActions)
//     }
//   },
//
// },
