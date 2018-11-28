# Change Log
All notable changes to this project will be documented in this file.

As we're at the 0.x phase, deprecations and breaking changes will still happen. They will be documented here.

Once we react 1.0 all deprecations will be removed and the project will switch to SemVer.

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
