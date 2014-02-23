var gutil  = require('gulp-util')
var join   = require('path').join
var should = require('should')

var shell = require('..')

describe('gulp-shell(command, options)', function () {
  var fakeFile = new gutil.File({
    cwd:  __dirname,
    base: __dirname,
    path: join(__dirname, 'test-file')
  })

  it('should pass file through', function (done) {
    var stream = shell('true')

    stream.on('data', function (file) {
      should(file).equal(fakeFile)
      done()
    })

    stream.write(fakeFile)
  })

  it('should execute command after interpolation', function (done) {
    var stream = shell('echo <%= file.path %>')

    var write = process.stdout.write
    process.stdout.write = function (output) {
      process.stdout.write = write
      should(output).containEql(fakeFile.path)
      done()
    }

    stream.write(fakeFile)
  })

  it('should prepend `./node_modules/.bin` to `PATH`', function (done) {
    var stream = shell('echo $PATH')

    var write = process.stdout.write
    process.stdout.write = function (output) {
      process.stdout.write = write
      should(output).containEql(join(__dirname, '..', 'node_modules', '.bin'))
      done()
    }

    stream.write(fakeFile)
  })

  describe('.task(command, options)', function () {
    it('should return a function which returns a stream', function (done) {
      var task = shell.task('true')
      should(task).be.type('function')

      var stream = task()
      stream.on('data', function () {
        done()
      })
    })
  })

  describe('options', function () {
    describe('ignoreErrors', function () {
      it('should emit error by default', function (done) {
        var stream = shell('false')

        stream.on('error', function () {
          done()
        })

        stream.write(fakeFile)
      })

      it('should not emit error when `ignoreErrors` == true', function (done) {
        var stream = shell('false', {ignoreErrors: true})

        stream.on('error', function () {
          throw new Error()
        })

        stream.on('data',  function () {
          done()
        })

        stream.write(fakeFile)
      })
    })

    describe('quiet', function () {
      it('should not output anything when `quiet` == true', function (done) {
        var stream = shell('echo cannot see me!', {quiet: true})

        var write = process.stdout.write
        process.stdout.write = function () {
          process.stdout.write = write
          throw new Error()
        }

        stream.on('data', function () {
          process.stdout.write = write
          done()
        })

        stream.write(fakeFile)
      })
    })
  })
})
