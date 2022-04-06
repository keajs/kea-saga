import { Saga, SagaMiddleware, Task } from 'redux-saga'
import { Logic } from 'kea'

export interface SagaPluginOptions {
  useLegacyUnboundActions?: boolean
}

export interface SagaContext {
  sagaMiddleware?: SagaMiddleware
  sagaTask?: Task
  useLegacyUnboundActions?: boolean
}

export interface LogicWithSaga extends Logic {
  get: undefined
  fetch: undefined
  workers: undefined | Record<string, Saga>
  saga: undefined | Saga
}
