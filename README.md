# gulp-shell

[![NPM version](https://img.shields.io/npm/v/gulp-shell.svg)](https://npmjs.org/package/gulp-shell)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://img.shields.io/travis/sun-zheng-an/gulp-shell/master.svg)](https://travis-ci.org/sun-zheng-an/gulp-shell)
[![Coveralls Status](https://img.shields.io/coveralls/sun-zheng-an/gulp-shell/master.svg)](https://coveralls.io/r/sun-zheng-an/gulp-shell)
[![Dependency Status](https://img.shields.io/david/sun-zheng-an/gulp-shell.svg)](https://david-dm.org/sun-zheng-an/gulp-shell)
[![Downloads](https://img.shields.io/npm/dm/gulp-shell.svg)](https://npmjs.org/package/gulp-shell)

> A handy command line interface for gulp

## Installation

```shell
npm install --save-dev gulp-shell
```

## Usage

```js
const gulp = require('gulp')
const shell = require('gulp-shell')

gulp.task('example', () => {
  return gulp.src('*.js', {read: false})
  .pipe(shell([
    'echo <%= file.path %>'
  ]))
})
```

Or you can use this shorthand:

```js
gulp.task('greet', shell.task('echo Hello, World!'))
```

You can find more examples in the [gulpfile](https://github.com/sun-zheng-an/gulp-shell/blob/master/gulpfile.js) of this project.

**WARNING**: Running commands like ~~`gulp.src('').pipe(shell('whatever'))`~~ is [considered as an anti-pattern](https://github.com/sun-zheng-an/gulp-shell/issues/55). **PLEASE DON'T DO THAT ANYMORE**.

## API

### shell(commands, options) or shell.task(commands, options)

#### commands

type: `Array` or `String`

A command can be a [template][] which can be interpolated by some [file][] info (e.g. `file.path`).

**WARNING**: [Using command templates can be extremely dangerous](https://github.com/sun-zheng-an/gulp-shell/issues/83). Don't shoot yourself in the foot by ~~passing arguments like `$(rm -rf $HOME)`~~.

#### options.cwd

type: `String`

default: [`process.cwd()`](http://nodejs.org/api/process.html#process_process_cwd)

Sets the current working directory for the command. This can be a [template][] which can be interpolated by some [file][] info (e.g. `file.path`).

#### options.env

type: `Object`

By default, all the commands will be executed in an environment with all the variables in [`process.env`](http://nodejs.org/api/process.html#process_process_env) and `PATH` prepended by `./node_modules/.bin` (allowing you to run executables in your Node's dependencies).

You can override any environment variables with this option.

For example, setting it to `{PATH: process.env.PATH}` will reset the `PATH` if the default one brings your some troubles.

#### options.shell

type: `String`

default: `/bin/sh` on UNIX, and `cmd.exe` on Windows

Change it to `bash` if you like.

#### options.quiet

type: `Boolean`

default: `false`

By default, it will print the command output.

#### options.verbose

type: `Boolean`

default: `false`

Set to `true` to print the command(s) to stdout as they are executed

#### options.ignoreErrors

type: `Boolean`

default: `false`

By default, it will emit an `error` event when the command finishes unsuccessfully.

#### options.errorMessage

type: `String`

default: ``Command `<%= command %>` failed with exit code <%= error.code %>``

You can add a custom error message for when the command fails.
This can be a [template][] which can be interpolated with the current `command`, some [file][] info (e.g. `file.path`) and some error info (e.g. `error.code`).

#### options.templateData

type: `Object`

The data that can be accessed in [template][].

[template]: http://lodash.com/docs#template
[file]: https://github.com/wearefractal/vinyl

## Changelog

Details changes for each release are documented in the [release notes](https://github.com/sun-zheng-an/gulp-shell/releases).
