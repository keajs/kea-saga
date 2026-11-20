const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const lib = path.join(__dirname, '../lib')
fs.mkdirSync(lib, { recursive: true })
execFileSync('go', ['build', '-mod=vendor', '-trimpath', '-buildvcs=false', '-ldflags=-s -w', '-o', path.join(lib, 'typegen.wasm'), '.'], {
    cwd: __dirname, stdio: 'inherit', env: { ...process.env, CGO_ENABLED: '0', GOOS: 'wasip1', GOARCH: 'wasm' },
})
fs.copyFileSync(path.join(__dirname, 'typegen.json'), path.join(lib, 'typegen.json'))
