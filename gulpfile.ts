import gulp from 'gulp'
import shell from './index'

const files = ['*.ts']

gulp.task('build', shell.task('tsc'))

gulp.task('test', shell.task('jest'))

gulp.task(
  'coveralls',
  gulp.series('test', shell.task('coveralls < ./coverage/lcov.info'))
)

gulp.task('lint', shell.task('eslint ' + files.join(' ')))

gulp.task('format', shell.task('prettier --write ' + files.join(' ')))

gulp.task('default', gulp.series('build', 'test', 'lint', 'format'))

gulp.task(
  'watch',
  gulp.series('default', () => {
    gulp.watch(files, gulp.task('default'))
  })
)
