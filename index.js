var _       = require('lodash')
var cp      = require('child_process')
var gutil   = require('gulp-util')
var join    = require('path').join
var through = require('through2')

var PLUGIN_NAME = 'gulp-shell'

function shell(command, options) {
  if (!options) options = {}
  var ignoreErrors = !!options.ignoreErrors
  var quiet        = !!options.quiet

  var pathToBin = join(__dirname, 'node_modules', '.bin')
  var separator = process.platform.match(/^win/) >= 0 ? ';' : ':'
  var path = pathToBin + separator + process.env.PATH
  var env = _.extend({}, process.env, {PATH: path})

  return through.obj(function (file, _, done) {
    command = gutil.template(command, {file: file})

    cp.exec(command, {env: env}, function (error, stdout, stderr) {
      if (!quiet) {
        if (stderr) gutil.log(stderr.trim())
        if (stdout) gutil.log(stdout.trim())
      }

      if (error && !ignoreErrors) {
        this.emit('error', new gutil.PluginError(PLUGIN_NAME, error))
      } else {
        this.push(file)
      }
      done()
    }.bind(this))
  })
}

shell.task = function (command, options) {
  return function () {
    var stream = shell(command, options)

    stream.write(new gutil.File())
    stream.end()

    return stream
  }
}

module.exports = shell
