var _ = require('lodash')
var async = require('async')
var gutil = require('gulp-util')
var path = require('path')
var spawn = require('child_process').spawn
var through = require('through2')

var PLUGIN_NAME = 'gulp-shell'

function normalizeCommands (commands) {
  if (typeof commands === 'string') {
    commands = [commands]
  }

  if (!Array.isArray(commands)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'Missing commands')
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

  var pathToBin = path.join(process.cwd(), 'node_modules', '.bin')
  var pathName = /^win/.test(process.platform) ? 'Path' : 'PATH'
  var newPath = pathToBin + path.delimiter + process.env[pathName]
  options.env = _.extend(process.env, _.fromPairs([[pathName, newPath]]), options.env)

  return options
}

function runCommands (commands, options, file, done) {
  async.eachSeries(commands, function (command, done) {
    var context = _.extend({file: file}, options.templateData)
    command = gutil.template(command, context)

    if (options.verbose) {
      gutil.log(gutil.colors.cyan(command))
    }

    var child = spawn(command, {
      env: options.env,
      cwd: gutil.template(options.cwd, context),
      shell: options.shell,
      stdio: options.quiet ? 'ignore' : 'inherit'
    })

    child.on('exit', function (code) {
      if (code === 0 || options.ignoreErrors) {
        return done()
      }

      var context = _.extend({
        command: command,
        file: file,
        error: {code: code}
      }, options.templateData)

      var message = gutil.template(options.errorMessage, context)

      done(new gutil.PluginError(PLUGIN_NAME, message))
    })
  }, done)
}

function shell (commands, options) {
  commands = normalizeCommands(commands)
  options = normalizeOptions(options)

  var stream = through.obj(function (file, _encoding, done) {
    var self = this

    runCommands(commands, options, file, function (error) {
      if (error) {
        self.emit('error', error)
      } else {
        self.push(file)
      }
      done()
    })
  })

  stream.resume()

  return stream
}

shell.task = function (commands, options) {
  return function (done) {
    runCommands(normalizeCommands(commands), normalizeOptions(options), null, done)
  }
}

module.exports = shell
