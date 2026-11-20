![NPM Version](https://img.shields.io/npm/v/kea-saga.svg)

Redux-Saga side effects for Kea

* kea-saga 2.0 works with kea 1.0+ and 2.0+
* kea-saga 1.0 works with kea 1.0+
* kea-saga 0.3 works with kea 0.27+
* kea-saga 0.2 works with kea 0.26
* kea-saga 0.1 works with kea 0.25

# Documentation

Read the docs: https://kea.js.org/docs/plugins/sagas

## Type generation and releases

The package includes a portable WASI visitor for `workers` alongside its JavaScript visitor. Typegen workers with logic-field support run the portable visitor. Earlier versions use the JavaScript visitor.

Run `flox activate`, then `yarn install --frozen-lockfile` and `npm run build` to build the package locally. Run `go test -C typegen ./...` for the visitor tests and `npm test -- --runInBand` for the runtime tests.

A signed-in npm maintainer can run `npm run release:setup` once to grant the release workflow publish access. In **Actions → Release**, select `master` and leave the version blank to use the prepared release or next minor. [Release guide](https://github.com/keajs/kea-typegen/blob/main/docs/releases.md)
