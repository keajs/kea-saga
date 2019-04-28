import createSagaMiddleware from 'redux-saga'

import { addConnection } from 'kea'

import { keaSaga, startSaga, cancelSaga } from './saga'
import { createSaga } from './create-saga'
import { select } from 'redux-saga/effects'

export default {
  name: 'saga',

  beforeReduxStore (options) {
    options._sagaMiddleware = createSagaMiddleware()
    options.middleware.push(options._sagaMiddleware)
  },

  afterReduxStore (options, store) {
    options._sagaMiddleware.run(keaSaga)
    store._sagaMiddleware = options._sagaMiddleware
  },

  defaults: () => ({
    workers: undefined,
    saga: undefined
  }),

  logicSteps: {
    // 1) Add to .connectedSagas any generator functions in input.sagas || input.connect.sagas
    // 2) Connect logic stores from input.sagas || input.connect.sagas into .connections
    connect (logic, input) {
      let connectedSagas = []

      if (input.sagas || (input.connect && input.connect.sagas)) {
        const sagas = [...(input.sagas || []), ...((input.connect && input.connect.sagas) || [])]

        for (let saga of sagas) {
          if (saga._isKeaFunction) {
            addConnection(logic, saga)
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
        createSaga(logic, input)
      }
    }
  },

  mounted (pathString, logic) {
    logic.saga && startSaga(pathString, logic.saga)
  },

  unmounted (pathString, logic) {
    logic.saga && cancelSaga(pathString)
  }
}
