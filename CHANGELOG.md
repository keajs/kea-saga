# Change Log

All notable changes to this project will be documented in this file.

## 3.0.1 - 2022-06-19

- Add TypeGen support for `workers`

## 3.0.0 - 2022-05-12

- Support Kea 3.0, introduce builders `saga`, `workers`, `takeEvery`, `takeLatest` and `cancelled`

## 2.0.0 - 2020-05-03

### Changed

- The option `{ useLegacyUnboundActions: false }` when installing the plugin now defaults to `false`.
  See the discussion about this parameter in the changelog for version 1.0.0 below.
  This option will be completely removed in kea-saga versions 3.0 and later.

- You may now use action without `[actions.` and `]` in `takeLatest` and `takeEvery`. For example:

```js
kea({
  actions: () => ({
    doSomething: true,
    otherAction: true,
  }),
})
takeEvery: ({ actions }) => ({
  doSomething: function* () {
    // saga code here - no need for `[actions.]` around `doSomething`
  },
  [actions.otherAction]: function* () {
    // saga code here the old way
  },
})
```

## 1.0.1 - 2019-09-12

### Fixed

1.0.0 had some bugs, please use 1.0.1 instead.

## 1.0.0 - 2019-09-12

### Added

- Support for Kea 1.0

- Added the option `{ useLegacyUnboundActions: true }` to the plugin. It defaults to `true` and when enabled will **not** bind your actions to `dispatch`, unlike everywhere else in Kea. This may cause some issues, but it is a necessary step if you're migrating from 0.28.

#### A note regarding Sagas and Actions

Since Kea 1.0 all `actions` on a logic are automatically bound to dispatch. This was not the case with 0.28 and earlier, where `actions` just returned action creators without dispatching them. The previous action creators are now accessible via `logic.actionCreators`.

This means calling `someLogic.actions.doSomething()` will automatically dispatch the action, instead of just returning the an object in the format `{ type: 'do something', payload: {} }`. You can still get that object now by using `someLogic.actionCreators.doSomething()`.

In this `useLegacyUnboundActions` mode, the actions _inside a logic_ are **not** bound when used by redux-saga functions (takeEvery, takeLatest, start, stop, workers). However if you manually import some other logic and then access `otherLogic.actions.doSomething`, those action **will be bound to dispatch**. Placing them inside a `yield put(otherLogic.actions.doSomething())` will fire the action twice!

To get around this, either skip `yield put()` with those actions... or use `otherLogic.actionCreators.doSomething` instead.

Doing something like `yield take(otherLogic.actions.doSomething().type)` will obviously also fire that action instead of waiting for it. Use `yield take(otherLogic.actions.doSomething)` instead.

This means that the following situation can happen:

```js
takeEvery: ({ actions }) => ({
  [actions.someAction]: function* () {
    // this will be dispatched just once, as actions are not
    // bound when accessing from the `actions` object given to `takeEvery`
    // or from `this.actions`
    yield put(actions.something())

    // this will however be dispatched twice!
    yield put(otherLogic.actions.something())

    // this will work as expected
    yield put(otherLogic.actionCreators.something())
  },
})
```

For now when you add the saga plugin to kea, the parameter `useLegacyUnboundActions` will be set to true.

In case you use `{ useLegacyUnboundActions: false }` when initialising the plugin, **all** actions will be bound
to `dispatch`, including the ones in `takeEvery: ({ actions }) => {}`, etc.

The option `useLegacyUnboundActions` will default to `false` in the next breaking release (2.0). If you're
starting a new app with `kea-saga` already now, feel free to set it to false yourself.

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
