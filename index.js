var _       = require('lodash')
var async   = require('async')
var cp      = require('child_process')
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

  options = _.defaults(options || {}, {
    ignoreErrors: false,
    quiet: false,
    cwd: process.cwd()
  })

  var pathToBin = join(process.cwd(), 'node_modules/.bin')
  var separator = process.platform.match(/^win/) ? ';' : ':'
  var path = pathToBin + separator + process.env.PATH
  var env = _.extend({}, process.env, {PATH: path})

  return through.obj(function (file, unused, done) {
    var self = this

    async.eachSeries(commands, function (command, done) {
      command = gutil.template(command, {file: file})

      var child = cp.exec(command, {env: env, cwd: options.cwd}, function (error) {
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
