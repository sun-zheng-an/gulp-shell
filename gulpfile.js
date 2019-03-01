const gulp = require('gulp')
const shell = require('./')

const paths = {
  js: ['*.js', 'test/*.js']
}

gulp.task('test', shell.task('mocha'))

gulp.task('coverage', shell.task('nyc mocha'))

gulp.task(
  'coveralls',
  gulp.series(
    'coverage',
    shell.task('nyc report --reporter=text-lcov | coveralls')
  )
)

gulp.task('format', shell.task('prettier --write ' + paths.js.join(' ')))

gulp.task('default', gulp.series('coverage', 'format'))

gulp.task(
  'watch',
  gulp.series('default', function watch() {
    gulp.watch(paths.js, gulp.task('default'))
  })
)
