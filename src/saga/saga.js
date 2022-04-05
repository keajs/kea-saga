import { call, take, cancel, fork } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'

let emitter
let forkedSagas = {}

function createComponentChannel(socket) {
  return eventChannel((emit) => {
    emitter = emit
    return () => {}
  })
}

export function* keaSaga() {
  const channel = yield call(createComponentChannel)

  while (true) {
    const { startSaga, cancelSaga, saga, pathString } = yield take(channel)

    if (startSaga) {
      forkedSagas[pathString] = yield fork(saga)
    }

    if (cancelSaga) {
      yield cancel(forkedSagas[pathString])
    }
  }
}

export function startSaga(pathString, saga) {
  if (!emitter) {
    return false
  }

  emitter({ startSaga: true, saga, pathString })

  return true
}

export function cancelSaga(pathString) {
  if (!emitter) {
    return false
  }

  emitter({ cancelSaga: true, pathString })

  return true
}
