import { fork, call, cancel, cancelled, take, takeEvery, takeLatest } from 'redux-saga/effects'

export function createSaga(logic, input, useLegacyUnboundActions = true) {
  const sagaWrap = useLegacyUnboundActions
    ? (func) => {
        return (...args) => {
          const legacyLogic = Object.assign({}, logic, { actionCreators: undefined, actions: logic.actionCreators })
          return func.bind(legacyLogic)(...args)
        }
      }
    : (func) => func.bind(logic)

  const sagaExec = useLegacyUnboundActions
    ? (func) => {
        const legacyLogic = Object.assign({}, logic, { actionCreators: undefined, actions: logic.actionCreators })
        return func(legacyLogic)
      }
    : (func) => func(logic)

  // bind workers and save to logic
  if (input.workers) {
    if (!logic.workers) {
      logic.workers = {}
    }

    for (let key of Object.keys(input.workers)) {
      if (typeof input.workers[key] === 'function') {
        logic.workers[key] = sagaWrap(input.workers[key])
      }
    }
  }

  // generate the saga
  const saga = function* () {
    let workers = []

    try {
      // start takeEvery and takeLatest watchers
      let ops = { takeEvery, takeLatest }

      for (let op of Object.keys(ops)) {
        if (input[op]) {
          let list = sagaExec(input[op])

          let keys = Object.keys(list)
          for (let i = 0; i < keys.length; i++) {
            let fn = list[keys[i]]
            let actionKey = logic.actions[keys[i]] ? logic.actions[keys[i]].toString() : keys[i]
            if (Array.isArray(fn)) {
              for (let j = 0; j < fn.length; j++) {
                yield ops[op](actionKey, sagaWrap(fn[j]))
              }
            } else {
              yield ops[op](actionKey, sagaWrap(fn))
            }
          }
        }
      }

      if (logic.connectedSagas) {
        for (let saga of logic.connectedSagas) {
          workers.push(yield fork(saga))
        }
      }

      if (input.start) {
        yield call(sagaWrap(input.start))
      }

      if (input.stop || logic.connectedSagas) {
        while (true) {
          yield take('wait until worker cancellation')
        }
      }
    } finally {
      // call the cancelled function if cancelled
      if (yield cancelled()) {
        if (input.stop) {
          yield call(sagaWrap(input.stop))
        }
        if (logic.connectedSagas) {
          for (let saga of workers) {
            yield cancel(saga)
          }
        }
      }
    }
  }

  if (logic.saga) {
    const oldSaga = logic.saga
    logic.saga = function* () {
      yield fork(oldSaga)
      yield fork(saga)
    }
  } else {
    logic.saga = saga
  }
}
