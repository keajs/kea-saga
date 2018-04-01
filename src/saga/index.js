import { select, call } from 'redux-saga/effects'
import createSagaMiddleware from 'redux-saga'

import createSaga from './create-saga'
import getConnectedSagas from './get-connected'
import injectSagasIntoClass from './inject-to-component'
import createCombinedSaga from './create-combined'
import { keaSaga } from './saga'

export default {
  name: 'saga',

  // must be used globally
  global: true,
  local: false,

  beforeReduxStore: options => {
    options._sagaMiddleware = createSagaMiddleware()
    options.middleware.push(options._sagaMiddleware)
  },

  afterReduxStore: (options, store) => {
    options._sagaMiddleware.run(keaSaga)
    store._sagaMiddleware = options._sagaMiddleware
  },

  isActive: input => {
    return !!(
      input.sagas ||
      input.start ||
      input.stop ||
      input.takeEvery ||
      input.takeLatest ||
      (input.connect && input.connect.sagas)
    )
  },

  afterConnect: (input, output) => {
    const connect = input.connect || {}
    const connectedSagas = getConnectedSagas(connect)

    // sagas we automatically connect from actions && props
    if (connectedSagas.length > 0) {
      output.activePlugins.saga = true
      input.sagas = input.sagas ? input.sagas.concat(connectedSagas) : connectedSagas
    }

    // we have input: { connect: { sagas: [] } }, add to input: { sagas: [] }
    if (connect.sagas) {
      input.sagas = input.sagas ? input.sagas.concat(connect.sagas) : connect.sagas
    }
  },

  afterCreateSingleton: (input, output) => {
    const isActive = output.activePlugins.saga
    const hasSelectors = !!(output.selectors && Object.keys(output.selectors).length > 0)

    if (hasSelectors) {
      output.get = function * (key) {
        return yield select(key ? output.selectors[key] : output.selector)
      }

      output.fetch = function * () {
        let results = {}

        const keys = Array.isArray(arguments[0]) ? arguments[0] : arguments

        for (let i = 0; i < keys.length; i++) {
          results[keys[i]] = yield output.get(keys[i])
        }

        return results
      }
    }

    if (isActive) {
      const singletonSagaBase = {
        actions: Object.assign({}, output.actions),
        start: input.start,
        stop: input.stop,
        takeEvery: input.takeEvery,
        takeLatest: input.takeLatest,
        workers: input.workers ? Object.assign({}, input.workers) : {},
        key: output.key,
        path: output.path,
        get: output.get,
        fetch: output.fetch
      }

      // if saga is a logic store, take it's ".saga", otherwise assume it's a generator function
      let sagas = (input.sagas || []).map(
        saga => (saga && saga._keaPlugins && saga._keaPlugins.saga && saga.saga) || saga
      )

      if (input.start || input.stop || input.takeEvery || input.takeLatest) {
        output._createdSaga = createSaga(singletonSagaBase)
        output.workers = singletonSagaBase.workers
        sagas.push(output._createdSaga)
      }

      output.saga = function * () {
        const sagaPath = output.path
          ? output.path.join('.')
          : input
            .path('')
            .filter(p => p)
            .join('.')
        yield call(createCombinedSaga(sagas, sagaPath))
      }
    }
  },

  injectToClass: (input, output, Klass) => {
    if (output.activePlugins.saga) {
      injectSagasIntoClass(Klass, input, output)
    }
  },

  injectToConnectedClass: (input, output, KonnektedKlass) => {
    if (output.activePlugins.saga) {
      injectSagasIntoClass(KonnektedKlass, input, output)
    }
  },

  addToResponse: (input, output, response) => {
    if (output.activePlugins.saga) {
      response.saga = output.saga
      response.workers = output.workers
    }
    response.get = output.get
    response.fetch = output.fetch
  }
}
