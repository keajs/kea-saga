![NPM Version](https://img.shields.io/npm/v/kea.svg)

![Kea Logo](https://kea.rocks/img/logo.png)

Saga support for Kea

# Usage

```sh
yarn add kea-saga
```

```js
// just importing activates saga support in kea({})
// ... but you still need to connect it to the store.
import 'kea-saga'
```

```js
// to setup your store, do this:
import { keaReducer } from 'kea'
import { keaSaga } from 'kea-saga'

export default function getStore () {
  const reducers = combineReducers({
    scenes: keaReducer('scenes')
  })

  const sagaMiddleware = createSagaMiddleware()
  const finalCreateStore = compose(
    applyMiddleware(sagaMiddleware)
  )(createStore)

  const store = finalCreateStore(reducers)

  sagaMiddleware.run(keaSaga)

  return store
}
```
