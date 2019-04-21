import createSagaMiddleware from 'redux-saga'

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

  // 1) Add to .connectedSagas any generator functions in input.sagas || input.connect.sagas
  // 2) Connect logic stores from input.sagas || input.connect.sagas into .connections
  afterCreateConnect (input, output, addConncetion) {
    let connectedSagas = []

    if (input.sagas || (input.connect && input.connect.sagas)) {
      const sagas = [...(input.sagas || []), ...((input.connect && input.connect.sagas) || [])]

      for (let saga of sagas) {
        if (saga._isKeaFunction) {
          addConncetion(output, saga)
        } else {
          connectedSagas.push(saga)
        }
      }
    }

    if (connectedSagas.length > 0) {
      output.connectedSagas = connectedSagas
    }
  },

  afterCreate (input, output) {
    // add .fetch() & .get() to all logic stores if there are any selectors
    if (output.selectors && Object.keys(output.selectors).length > 0) {
      output.get = function * (key) {
        return yield select(key ? output.selectors[key] : output.selector, output.props)
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

    // add .saga and .workers (if needed)
    if (input.start || input.stop || input.takeEvery || input.takeLatest || input.workers || output.connectedSagas) {
      createSaga(input, output)
    }
  },

  beforeMount (logic, props) {
    if (logic.saga) {
      logic.props = props
    }
  },

  mountedPath (pathString, logic) {
    if (logic.saga) {
      startSaga(pathString, logic.saga)
    }
  },

  unmountedPath (pathString, logic) {
    if (logic.saga) {
      cancelSaga(pathString)
    }
  }
}
