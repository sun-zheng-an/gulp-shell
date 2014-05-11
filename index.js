var _       = require('lodash')
var async   = require('async')
var exec    = require('child_process').exec
var gutil   = require('gulp-util')
var join    = require('path').join
var through = require('through2')

var PLUGIN_NAME = 'gulp-shell'

function shell(commands, options) {
  if (typeof commands === 'string') {
    commands = [commands]
  }

  if (!Array.isArray(commands)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'Missing commands')
  }

  options = _.extend({
    ignoreErrors: false,
    quiet: false,
    cwd: process.cwd()
  }, options)

  var pathToBin = join(process.cwd(), 'node_modules/.bin')
  var separator = process.platform.match(/^win/) ? ';' : ':'
  var path = pathToBin + separator + process.env.PATH
  var env = _.defaults({PATH: path}, process.env)

  return through.obj(function (file, unused, done) {
    var self = this

    async.eachSeries(commands, function (command, done) {
      command = gutil.template(command, {file: file})

      var child = exec(command, {env: env, cwd: options.cwd, maxBuffer: 16 * 1024 * 1024}, function (error) {
        done(options.ignoreErrors ? null : error)
      })

      if (!options.quiet) {
        child.stdout.pipe(process.stdout)
        child.stderr.pipe(process.stderr)
      }
    }, function (error) {
      if (error) {
        self.emit('error', new gutil.PluginError(PLUGIN_NAME, error))
      } else {
        self.push(file)
      }
      done()
    })
  })
}

shell.task = function (commands, options) {
  return function () {
    var stream = shell(commands, options)

    stream.write(new gutil.File())
    stream.end()

    return stream
  }
}

module.exports = shell
