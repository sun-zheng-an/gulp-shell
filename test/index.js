var gutil  = require('gulp-util')
var join   = require('path').join
var should = require('should')

var shell = require('..')

var originalStdoutWrite = process.stdout.write
function shouldOutput(expected, done) {
  process.stdout.write = function (actual) {
    process.stdout.write = originalStdoutWrite
    should(actual.toLowerCase()).containEql(expected.toLowerCase())
    done()
  }
}

describe('gulp-shell(commands, options)', function () {
  var fakeFile = new gutil.File({
    cwd:  __dirname,
    base: __dirname,
    path: join(__dirname, 'test-file')
  })

  it('should throw when `commands` is missing', function () {
    shell.should.throw('Missing commands')
  })

  it('should be ok when `commands` is a string', function () {
    shell.bind(null, 'true').should.not.throw()
  })

  it('should pass file through', function (done) {
    var stream = shell(['true'])

    stream.on('data', function (file) {
      should(file).equal(fakeFile)
      done()
    })

    stream.write(fakeFile)
  })

  it('should execute command after interpolation', function (done) {
    var stream = shell(['echo <%= file.path %>'])

    shouldOutput(fakeFile.path, done)

    stream.write(fakeFile)
  })

  it('should prepend `./node_modules/.bin` to `PATH`', function (done) {
    var stream = shell(['echo $PATH'])

    shouldOutput(join(process.cwd(), 'node_modules/.bin'), done)

    stream.write(fakeFile)
  })

  describe('.task(commands, options)', function () {
    it('should return a function which returns a stream', function (done) {
      var task = shell.task(['true'])
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
        var stream = shell(['false'])

        stream.on('error', function () {
          done()
        })

        stream.write(fakeFile)
      })

      it('should not emit error when `ignoreErrors` == true', function (done) {
        var stream = shell(['false'], {ignoreErrors: true})

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
        var stream = shell(['echo cannot see me!'], {quiet: true})

        shouldOutput('this should not match anything!', done)

        stream.on('data', function () {
          process.stdout.write = originalStdoutWrite
          done()
        })

        stream.write(fakeFile)
      })
    })

    describe('showErrorProperties', function () {
      it('should bubble up the option `showErrorProperties` to gulp on error', function (done) {
        var stream = shell(['false'], {showErrorProperties: false})

        stream.on('error', function (pluginError) {
          should(pluginError.showProperties).equal(false)
          done()
        })

        stream.write(fakeFile)
      })
    })

    describe('errorMessage', function () {
      it('should allow for custom messages', function (done) {
        var errorMessage = 'foo'
        var stream = shell(['false'], {errorMessage: errorMessage})

        stream.on('error', function (error) {
          error.message.should.equal(errorMessage)
          done()
        })

        stream.write(fakeFile)
      })

      it('should include the error object in the error context', function (done) {
        var errorMessage = 'Foo <%= error.code %>'
        var expectedMessage = 'Foo 2'
        var stream = shell(['exit 2'], {errorMessage: errorMessage})

        stream.on('error', function (error) {
          error.message.should.equal(expectedMessage)
          done()
        })

        stream.write(fakeFile)
      })
    })

    describe('cwd', function () {
      it('should set the current working directory when `cwd` is a string', function (done) {
        var stream = shell(['pwd'], {cwd: '..'})

        shouldOutput(join(__dirname, '../..'), done)

        stream.write(fakeFile)
      })
    })

    describe('cwd', function () {
      it('should use the process current working directory when `cwd` is not passed', function (done) {
        var stream = shell(['pwd'])

        shouldOutput(join(__dirname, '..'), done)

        stream.write(fakeFile)
      })
    })
  })
})
