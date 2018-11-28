import { call, take, cancel, fork } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'
import { getCache, setCache } from 'kea'

let emitter
let forkedSagas = {}

function createComponentChannel (socket) {
  return eventChannel(emit => {
    emitter = emit
    return () => {}
  })
}

export function * keaSaga () {
  const channel = yield call(createComponentChannel)

  while (true) {
    const { startSaga, cancelSaga, saga, path } = yield take(channel)

    if (startSaga) {
      forkedSagas[path] = yield fork(saga)
    }

    if (cancelSaga) {
      yield cancel(forkedSagas[path])
    }
  }
}

export function startSaga (path, saga) {
  if (!emitter) {
    return false
  }

  const count = getCount(path)

  if (count === 0) {
    emitter({ startSaga: true, saga, path })
  }

  setCount(path, count + 1)

  return true
}

export function cancelSaga (path) {
  if (!emitter) {
    return false
  }

  const count = getCount(path)
  setCount(path, count - 1)

  if (count <= 1) {
    emitter({ cancelSaga: true, path })
  }

  return true
}

function getCount (path) {
  const sagaCounter = getCache('sagaCounter') || {}
  return sagaCounter[path] || 0
}

function setCount (path, count) {
  const sagaCounter = getCache('sagaCounter') || {}
  setCache('sagaCounter', Object.assign({}, sagaCounter, { [path]: count }))
}
