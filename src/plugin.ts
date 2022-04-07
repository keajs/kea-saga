import createSagaMiddleware, { END, Saga } from 'redux-saga'
import { connect, getContext, getPluginContext, KeaPlugin, Logic } from 'kea'
import { keaSaga } from './channel'
import { LogicWithSaga, SagaContext, SagaPluginOptions } from './types'
import { cancelled, saga, takeEvery, takeLatest, workers } from './builders'
import { addGetAndFetch } from './utils'

export const sagaPlugin = ({
  useLegacyUnboundActions = false,
  injectGetFetchIntoEveryLogic = false,
}: SagaPluginOptions = {}): KeaPlugin => ({
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

    ...(injectGetFetchIntoEveryLogic
      ? {
          afterLogic(logic) {
            if (injectGetFetchIntoEveryLogic) {
              addGetAndFetch(logic as Logic as LogicWithSaga)
            }
          },
        }
      : {}),

    legacyBuild(logic, input) {
      'workers' in input && input.workers && workers(input.workers)(logic)
      'takeEvery' in input && input.takeEvery && takeEvery(input.takeEvery)(logic)
      'takeLatest' in input && input.takeLatest && takeLatest(input.takeLatest)(logic)
      'stop' in input && input.stop && cancelled(input.stop)(logic)

      const sagas = [
        ...('start' in input && input.start ? [input.start] : []),
        ...('sagas' in input && input.sagas ? input.sagas : []),
        ...('connect' in input && input.connect?.sagas ? input.connect.sagas : []),
      ]

      if (sagas.length > 0) {
        for (const s of sagas) {
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
