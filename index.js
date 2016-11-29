var _ = require('lodash')
var async = require('async')
var exec = require('child_process').exec
var gutil = require('gulp-util')
var path = require('path')
var through = require('through2')

var PLUGIN_NAME = 'gulp-shell'

function normalizeCommands(commands) {
  if (typeof commands === 'string') {
    commands = [commands]
  }

  if (!Array.isArray(commands)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'Missing commands')
  }

  return commands
}

function normalizeOptions(options) {
  options = _.extend({
    verbose: false,
    ignoreErrors: false,
    errorMessage: 'Command `<%= command %>` failed with exit code <%= error.code %>',
    quiet: false,
    interactive: false,
    cwd: process.cwd(),
    maxBuffer: 16 * 1024 * 1024
  }, options)

  var pathToBin = path.join(process.cwd(), 'node_modules', '.bin')
  var pathName = /^win/.test(process.platform) ? 'Path' : 'PATH'
  var newPath = pathToBin + path.delimiter + process.env[pathName]
  options.env = _.extend(process.env, _.fromPairs([[pathName, newPath]]), options.env)

  // HACK: remove duplicate environment variables when start from npm scripts.
  options.env = _.pickBy(options, function (value, key) {
    return !_.startsWith(_.lowerCase(key), 'npm_')
  });

  return options;
}

function runCommands(commands, options, file, done) {
  async.eachSeries(commands, function (command, done) {
    var context = _.extend({ file: file }, options.templateData)
    command = gutil.template(command, context)

    if (options.verbose) {
      gutil.log(gutil.colors.cyan(command))
    }

    var child = exec(command, {
      env: options.env,
      cwd: gutil.template(options.cwd, context),
      maxBuffer: options.maxBuffer,
      timeout: options.timeout
    }, function (error, stdout, stderr) {
      if (options.interactive) {
        process.stdin.unpipe(child.stdin)
        process.stdin.resume()
        process.stdin.pause()
      }

      if (error && !options.ignoreErrors) {
        error.stdout = stdout
        error.stderr = stderr

        var errorContext = _.extend({
          command: command,
          file: file,
          error: error
        }, options.templateData)

        error.message = gutil.template(options.errorMessage, errorContext)
      }

      done(options.ignoreErrors ? null : error)
    })

    if (options.interactive) {
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      process.stdin.pipe(child.stdin)
    }

    if (!options.quiet) {
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    }
  }, done)
}

function shell(commands, options) {
  commands = normalizeCommands(commands)
  options = normalizeOptions(options)

  var stream = through.obj(function (file, unused, done) {
    var self = this

    runCommands(commands, options, file, function (error) {
      if (error) {
        self.emit('error', new gutil.PluginError({
          plugin: PLUGIN_NAME,
          message: error.message
        }))
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
