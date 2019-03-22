import { join } from 'path'
import Vinyl from 'vinyl'

import shell from './index'

const expectToFlow = (
  stream: NodeJS.ReadWriteStream,
  done: jest.DoneCallback
): void => {
  stream.on('error', done).on('data', () => {
    done()
  })
}

describe('gulp-shell(commands, options)', () => {
  const fakeFile = new Vinyl({
    cwd: __dirname,
    base: __dirname,
    path: join(__dirname, 'test-file')
  })

  it('throws when `commands` is missing', () => {
    expect(shell).toThrow('Missing commands')
  })

  it('works when `commands` is a string', () => {
    expect(shell.bind(null, 'true')).not.toThrow()
  })

  it('passes file through', done => {
    const stream = shell(['true'])

    stream.on('data', file => {
      expect(file).toBe(fakeFile)
      done()
    })

    stream.write(fakeFile)
  })

  it('executes command after interpolation', done => {
    const stream = shell([`test <%= file.path %> = ${fakeFile.path}`])

    expectToFlow(stream, done)

    stream.write(fakeFile)
  })

  it('prepends `./node_modules/.bin` to `PATH`', done => {
    const stream = shell(
      [`echo $PATH | grep -q "${join(process.cwd(), 'node_modules/.bin')}"`],
      { shell: 'bash' }
    )

    expectToFlow(stream, done)

    stream.write(fakeFile)
  })

  describe('.task(commands, options)', () => {
    it('returns a function which returns a promise', done => {
      const task = shell.task(['echo hello world'])
      const promise = task()

      expect(promise).toBeInstanceOf(Promise)

      promise.then(done)
    })
  })

  describe('options', () => {
    describe('cwd', () => {
      it('sets the current working directory when `cwd` is a string', done => {
        const stream = shell([`test $PWD = ${join(__dirname, '..')}`], {
          cwd: '..'
        })

        expectToFlow(stream, done)

        stream.write(fakeFile)
      })

      it('uses the process current working directory when `cwd` is not passed', done => {
        const stream = shell([`test $PWD = ${__dirname}`])

        expectToFlow(stream, done)

        stream.write(fakeFile)
      })
    })

    describe('shell', () => {
      it('changes the shell', done => {
        const stream = shell(['[[ $0 = bash ]]'], { shell: 'bash' })

        expectToFlow(stream, done)

        stream.write(fakeFile)
      })
    })

    describe('quiet', () => {
      it("won't output anything when `quiet` == true", done => {
        const stream = shell(['echo cannot see me!'], { quiet: true })

        expectToFlow(stream, done)

        stream.write(fakeFile)
      })
    })

    describe('verbose', () => {
      it('prints the command', done => {
        const stream = shell(['echo you can see me twice'], {
          verbose: true
        })

        expectToFlow(stream, done)

        stream.write(fakeFile)
      })
    })

    describe('ignoreErrors', () => {
      it('emits error by default', done => {
        const stream = shell(['false'])

        stream.on('error', () => {
          done()
        })

        stream.write(fakeFile)
      })

      it("won't emit error when `ignoreErrors` == true", done => {
        const stream = shell(['false'], { ignoreErrors: true })

        stream.on('error', () => {
          throw new Error()
        })

        stream.on('data', () => {
          done()
        })

        stream.write(fakeFile)
      })
    })

    describe('errorMessage', () => {
      it('allows for custom messages', done => {
        const errorMessage = 'foo'
        const stream = shell(['false'], { errorMessage })

        stream.on('error', error => {
          expect(error.message).toBe(errorMessage)
          done()
        })

        stream.write(fakeFile)
      })

      it('includes the error object in the error context', done => {
        const errorMessage = 'Foo <%= error.code %>'
        const expectedMessage = 'Foo 2'
        const stream = shell(['exit 2'], { errorMessage })

        stream.on('error', error => {
          expect(error.message).toBe(expectedMessage)
          done()
        })

        stream.write(fakeFile)
      })
    })
  })
})
