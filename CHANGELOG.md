# Change Log
All notable changes to this project will be documented in this file.

## 1.0.0 - 2019-09-12
### Fixed
- Support for Kea 1.0

#### A note regarding Sagas and Actions

Since Kea 1.0 all `actions` on a logic are automatically bound to dispatch. The previous action creators are now accessible via `logic.actionCreators`. 

This means calling `someLogic.actions.doSomething()` will automatically dispatch the action, instead of just returning the an object in the format `{ type: 'do something', payload: {} }`.

Since redux-saga recommends piping all actions through `yield put()` instead of calling `dispatch()` on them, the actions *inside a logic* are **not** bound when used by redux-saga. However if you manually `import` some other logic and then access `logic.actions.doSomething`, this action **will be bound to dispatch**. Placing that inside a `yield put(logic.actions.doSomething())` will fire the action twice!

To get around this, either skip `yield put()` with those actions... or use `logic.actionCreators.doSomething` instead.

This means that the following situation can happen:

```js
takeEvery: ({ actions }) => ({
  [actions.someAction]: function * () {
    // this will be dispatched just once, as actions are not 
    // bound when accessing from the `actions` object given to `takeEvery`
    // or from `this.actions`
    yield put(actions.something()) 

    // this will however be dispatched twice! 
    yield put(otherLogic.actions.something()) 

    // this will work as expected
    yield put(otherLogic.actionCreators.something()) 
  }
})
```


## 0.3.5 - 2018-11-28
### Fixed
- Keep better track of started and stopped sagas so that we don't unmount before all are disconnected

## 0.3.3 - 2018-04-01
### Fixed
- Selectors accessed via `yield this.get('something')` now have access to the wrapped Component's props

## 0.3.0 - 2017-10-25
### Changed
- Updated to the plugin system of kea 0.27
- You must now install the plugin manually or import from `kea-saga/install`. See the README for details.
- Export `workers` in the logic store

## 0.2.0 - 2017-10-08
### Changed
- Updated to the plugin system of kea 0.26

## 0.1.0 - 2017-09-29
### Changed
- First version
