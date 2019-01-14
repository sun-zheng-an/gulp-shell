const gulp = require('gulp')
const shell = require('./')

const paths = {
  js: ['*.js', 'test/*.js']
}

gulp.task('test', shell.task('mocha'))

gulp.task('coverage', shell.task('istanbul cover _mocha'))

gulp.task(
  'coveralls',
  gulp.series('coverage', shell.task('cat coverage/lcov.info | coveralls'))
)

gulp.task('lint', shell.task('standard ' + paths.js.join(' ')))

gulp.task('default', gulp.parallel('coverage', 'lint'))

gulp.task('watch', gulp.series('default', function watch () {
  gulp.watch(paths.js, gulp.task('default'))
}))
