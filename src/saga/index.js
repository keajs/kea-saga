import createSagaMiddleware, { END } from 'redux-saga'

import { addConnection, getContext, getPluginContext } from 'kea'

import { keaSaga, startSaga, cancelSaga } from './saga'
import { createSaga } from './create-saga'
import { select } from 'redux-saga/effects'

export default ({ useLegacyUnboundActions = false } = {}) => ({
  name: 'saga',

  defaults: () => ({
    get: undefined,
    fetch: undefined,
    workers: undefined,
    saga: undefined
  }),

  buildOrder: {
    connectSagas: { after: 'connect' }
  },

  buildSteps: {
    // 1) Add to .connectedSagas any generator functions in input.sagas || input.connect.sagas
    // 2) Connect logic stores from input.sagas || input.connect.sagas into .connections
    connectSagas (logic, input) {
      let connectedSagas = []

      if (input.sagas || (input.connect && input.connect.sagas)) {
        const sagas = [...(input.sagas || []), ...((input.connect && input.connect.sagas) || [])]

        for (let saga of sagas) {
          if (saga._isKea) {
            addConnection(logic, saga(logic.props || {}))
          } else {
            connectedSagas.push(saga)
          }
        }
      }

      if (connectedSagas.length > 0) {
        logic.connectedSagas = connectedSagas
      }
    },

    saga (logic, input) {
      // add .fetch() & .get() to all logic stores if there are any selectors
      if (logic.selectors && Object.keys(logic.selectors).length > 0) {
        logic.get = function * (key) {
          return yield select(key ? logic.selectors[key] : logic.selector, logic.props)
        }

        logic.fetch = function * () {
          let results = {}

          const keys = Array.isArray(arguments[0]) ? arguments[0] : arguments

          for (let i = 0; i < keys.length; i++) {
            results[keys[i]] = yield logic.get(keys[i])
          }

          return results
        }
      }

      // add .saga and .workers (if needed)
      if (input.start || input.stop || input.takeEvery || input.takeLatest || input.workers || logic.connectedSagas) {
        createSaga(logic, input, useLegacyUnboundActions)
      }
    }
  },

  events: {
    beforeReduxStore (options) {
      const sagaContext = getPluginContext('saga')
      sagaContext.sagaMiddleware = createSagaMiddleware()
      options.middleware.push(sagaContext.sagaMiddleware)
    },

    afterReduxStore (options, store) {
      const { sagaMiddleware } = getPluginContext('saga')
      store._keaSagaTask = sagaMiddleware.run(keaSaga)
      store._sagaMiddleware = sagaMiddleware
    },

    afterMount (logic) {
      logic.saga && startSaga(logic.pathString, logic.saga)
    },

    beforeUnmount (logic) {
      logic.saga && cancelSaga(logic.pathString)
    },

    beforeCloseContext (context) {
      const { store } = context || getContext()
      store && store.dispatch(END)
      if (store && store._keaSagaTask && store._keaSagaTask.isRunning()) {
        store._keaSagaTask.cancel()
      }
    }
  }
})
