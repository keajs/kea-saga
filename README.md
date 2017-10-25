![NPM Version](https://img.shields.io/npm/v/kea-saga.svg)

Redux-Saga side effects for Kea

* kea-saga 0.3 works with kea 0.27+
* kea-saga 0.2 works with kea 0.26
* kea-saga 0.1 works with kea 0.25

[Read the documentation for Kea](https://kea.js.org/)

# Usage

Install via yarn or npm

```sh
yarn add kea-saga redux-saga
npm install --save kea-saga redux-saga
```

Import `kea-saga` in your app's entrypoint, before any `kea({})` calls take place:

```js
import 'kea-saga'
```

Then your kea logic stores will get access to the keys: `start`, `stop`, `takeEvery`, `takeLatest`, `workers`, `sagas`.
Read the [sliders guide](https://kea.js.org/guide/sliders) for details.

```js
import { kea } from 'kea'

@kea({
  key: (props) => props.id,

  path: (key) => ['scenes', 'homepage', 'slider', key],

  actions: () => ({
    updateSlide: index => ({ index })
  }),

  reducers: ({ actions, key, props }) => ({
    currentSlide: [props.initialSlide || 0, PropTypes.number, {
      [actions.updateSlide]: (state, payload) => payload.key === key ? payload.index % images.length : state
    }]
  }),

  selectors: ({ selectors }) => ({
    currentImage: [
      () => [selectors.currentSlide],
      (currentSlide) => images[currentSlide],
      PropTypes.object
    ]
  }),

  start: function * () {
    const { updateSlide } = this.actions

    console.log('Starting homepage slider saga')
    // console.log(this, this.actions, this.props)

    while (true) {
      const { timeout } = yield race({
        change: take(action => action.type === updateSlide.toString() && action.payload.key === this.key),
        timeout: delay(5000)
      })

      if (timeout) {
        const currentSlide = yield this.get('currentSlide')
        yield put(updateSlide(currentSlide + 1))
      }
    }
  },

  stop: function * () {
    console.log('Stopping homepage slider saga')
  },

  takeEvery: ({ actions, workers }) => ({
    [actions.updateSlide]: workers.updateSlide
  }),

  workers: {
    updateSlide: function * (action) {
      if (action.payload.key === this.key) {
        console.log('slide update triggered', action.payload.key, this.key, this.props.id)
        // console.log(action, this)
      }
    }
  }

  // Also implemented:
  // takeLatest: () => ({}),
  // sagas: [ array of sagas from elsewhere that run with the component ],
})
export default class Slider extends Component {
  render () {
    const { currentSlide, currentImage } = this.props
    const { updateSlide } = this.actions

    const title = `Image copyright by ${currentImage.author}`

    return (
      <div className='kea-slider'>
        <img src={currentImage.src} alt={title} title={title} />
        <div className='buttons'>
          {range(images.length).map(i => (
            <span key={i} className={i === currentSlide ? 'selected' : ''} onClick={() => updateSlide(i)} />
          ))}
        </div>
      </div>
    )
  }
}
```

# Store setup

If you're using the `getStore()` helper from Kea, saga functionality is automatically added to the store.

However if you wish to manually set up your store, here are the steps:

```js
import { keaReducer } from 'kea'
import { keaSaga } from 'kea-saga'

export default function getStore () {
  const reducers = combineReducers({
    kea: keaReducer('kea'),
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
