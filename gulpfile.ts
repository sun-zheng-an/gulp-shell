import gulp from 'gulp'
import shell from './index'

const files = ['*.ts', 'test/*.js']

gulp.task('build', shell.task('tsc'))

gulp.task('test', shell.task('mocha'))

gulp.task('coverage', shell.task('nyc mocha'))

gulp.task(
  'coveralls',
  gulp.series(
    'coverage',
    shell.task('nyc report --reporter=text-lcov | coveralls')
  )
)

gulp.task('lint', shell.task('eslint ' + files.join(' ')))

gulp.task('format', shell.task('prettier --write ' + files.join(' ')))

gulp.task('default', gulp.series('build', 'coverage', 'lint', 'format'))

gulp.task(
  'watch',
  gulp.series('default', () => {
    gulp.watch(files, gulp.task('default'))
  })
)
