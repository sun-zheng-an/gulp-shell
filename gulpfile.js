var gulp = require('gulp')
var shell = require('./')

var paths = {
  js: ['*.js', 'test/*.js']
}

gulp.task('test', shell.task('mocha -R spec'))

gulp.task('coverage', ['test'], shell.task('istanbul cover _mocha -- -R spec'))

gulp.task('coveralls', ['coverage'], shell.task('cat coverage/lcov.info | coveralls'))

gulp.task('lint', shell.task('eslint ' + paths.js.join(' ')))

gulp.task('default', ['coverage', 'lint'])

gulp.task('watch', function () {
  gulp.watch(paths.js, ['default'])
})

var isWin = /^win/.test(process.platform)
var badSlash = isWin ? '/' : '\\'
var goodSlash = isWin ? /\\/g : /\//g
var slashCommand = './node_modules/.bin/gulp lint'.replace(goodSlash, badSlash)

gulp.task('slash-test', shell.task(
  slashCommand
))
