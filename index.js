const _ = require('lodash')
const async = require('async')
const chalk = require('chalk')
const fancyLog = require('fancy-log')
const path = require('path')
const PluginError = require('plugin-error')
const spawn = require('child_process').spawn
const template = require('lodash.template')
const through = require('through2')

const PLUGIN_NAME = 'gulp-shell'

function normalizeCommands (commands) {
  if (typeof commands === 'string') {
    commands = [commands]
  }

  if (!Array.isArray(commands)) {
    throw new PluginError(PLUGIN_NAME, 'Missing commands')
  }

  return commands
}

function normalizeOptions (options) {
  options = _.extend({
    cwd: process.cwd(),
    shell: true,
    quiet: false,
    verbose: false,
    ignoreErrors: false,
    errorMessage: 'Command `<%= command %>` failed with exit code <%= error.code %>'
  }, options)

  const pathToBin = path.join(process.cwd(), 'node_modules', '.bin')
  const pathName = /^win/.test(process.platform) ? 'Path' : 'PATH'
  const newPath = pathToBin + path.delimiter + process.env[pathName]
  options.env = _.extend({}, process.env, {[pathName]: newPath}, options.env)

  return options
}

function runCommands (commands, options, file, done) {
  async.eachSeries(commands, (command, done) => {
    const context = _.extend({file}, options.templateData)
    command = template(command)(context)

    if (options.verbose) {
      fancyLog(chalk.cyan(command))
    }

    const child = spawn(command, {
      env: options.env,
      cwd: template(options.cwd)(context),
      shell: options.shell,
      stdio: options.quiet ? 'ignore' : 'inherit'
    })

    child.on('exit', (code) => {
      if (code === 0 || options.ignoreErrors) {
        return done()
      }

      const context = _.extend({
        command,
        file,
        error: {code}
      }, options.templateData)

      const message = template(options.errorMessage)(context)

      done(new PluginError(PLUGIN_NAME, message))
    })
  }, done)
}

function shell (commands, options) {
  commands = normalizeCommands(commands)
  options = normalizeOptions(options)

  const stream = through.obj(function (file, _encoding, done) {
    runCommands(commands, options, file, (error) => {
      if (error) {
        this.emit('error', error)
      } else {
        this.push(file)
      }
      done()
    })
  })

  stream.resume()

  return stream
}

shell.task = (commands, options) => (done) => {
  runCommands(normalizeCommands(commands), normalizeOptions(options), null, done)
}

module.exports = shell
