import { fork, call, cancel, cancelled, take, takeEvery, takeLatest } from 'redux-saga/effects'

export function createSaga (input, output) {
  // bind workers and save to output
  if (input.workers) {
    output.workers = {}
    for (let key of Object.keys(input.workers)) {
      if (typeof input.workers[key] === 'function') {
        output.workers[key] = input.workers[key].bind(output)
      }
    }
  }

  // generate the saga
  output.saga = function * () {
    let workers = []

    try {
      // start takeEvery and takeLatest watchers
      let ops = { takeEvery, takeLatest }

      for (let op of Object.keys(ops)) {
        if (input[op]) {
          let list = input[op](output)

          let keys = Object.keys(list)
          for (let i = 0; i < keys.length; i++) {
            let fn = list[keys[i]]
            if (Array.isArray(fn)) {
              for (let j = 0; j < fn.length; j++) {
                yield ops[op](keys[i], fn[j].bind(output))
              }
            } else {
              yield ops[op](keys[i], fn.bind(output))
            }
          }
        }
      }

      if (output.connectedSagas) {
        for (let saga of output.connectedSagas) {
          workers.push(yield fork(saga))
        }
      }

      if (input.start) {
        yield call(input.start.bind(output))
      }

      if (input.stop || output.connectedSagas) {
        while (true) {
          yield take('wait until worker cancellation')
        }
      }
    } finally {
      // call the cancelled function if cancelled
      if (yield cancelled()) {
        if (input.stop) {
          yield call(input.stop.bind(output))
        }
        if (output.connectedSagas) {
          for (let saga of workers) {
            yield cancel(saga)
          }
        }
      }
    }
  }
}
