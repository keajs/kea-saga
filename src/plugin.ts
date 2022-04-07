import createSagaMiddleware, { END, Saga } from 'redux-saga'
import { connect, getContext, getPluginContext, KeaPlugin } from 'kea'
import { keaSaga } from './channel'
import { SagaContext, SagaPluginOptions } from './types'
import { cancelled, saga, takeEvery, takeLatest, workers } from './builders'

export const sagaPlugin = ({ useLegacyUnboundActions = false }: SagaPluginOptions = {}): KeaPlugin => ({
  name: 'saga',

  defaults: () => ({
    get: undefined,
    fetch: undefined,
    workers: undefined,
    saga: undefined,
  }),

  events: {
    beforeReduxStore(options) {
      const sagaContext = getPluginContext('saga') as SagaContext
      sagaContext.sagaMiddleware = createSagaMiddleware()
      sagaContext.useLegacyUnboundActions = useLegacyUnboundActions
      options.middleware.push(sagaContext.sagaMiddleware)
    },

    afterReduxStore() {
      const sagaContext = getPluginContext('saga') as SagaContext
      sagaContext.sagaTask = sagaContext.sagaMiddleware?.run(keaSaga)
    },

    beforeCloseContext(context) {
      const store = (context || getContext()).store
      store && store.dispatch(END)

      const sagaContext = getPluginContext('saga') as SagaContext
      if (sagaContext.sagaTask?.isRunning()) {
        sagaContext.sagaTask.cancel()
      }
    },

    legacyBuild(logic, input) {
      'workers' in input && input.workers && workers(input.workers)(logic)
      'takeEvery' in input && input.takeEvery && takeEvery(input.takeEvery)(logic)
      'takeLatest' in input && input.takeLatest && takeLatest(input.takeLatest)(logic)
      'stop' in input && input.stop && cancelled(input.stop)(logic)
      'start' in input && input.start && saga(input.start)(logic)
      if ('sagas' in input && input.sagas && Array.isArray(input.sagas)) {
        for (const s of input.sagas) {
          if ('_isKea' in s) {
            connect(s)(logic)
          } else {
            saga(s)(logic)
          }
        }
      }
    },
  },
})
