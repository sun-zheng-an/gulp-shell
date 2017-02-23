const gulp = require('gulp')
const shell = require('./')

const paths = {
  js: [
    '*.js',
    'test/*.js'
  ]
}

gulp.task('test', shell.task('mocha'))

gulp.task('coverage', ['test'], shell.task('istanbul cover _mocha'))

gulp.task('coveralls', ['coverage'], shell.task('cat coverage/lcov.info | coveralls'))

gulp.task('lint', shell.task('standard ' + paths.js.join(' ')))

gulp.task('default', ['coverage', 'lint'])

gulp.task('watch', () => {
  gulp.watch(paths.js, ['default'])
})
