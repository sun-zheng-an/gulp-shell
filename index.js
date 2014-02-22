var _       = require('lodash')
var async   = require('async')
var cp      = require('child_process')
var gutil   = require('gulp-util')
var join    = require('path').join
var through = require('through2')

var PLUGIN_NAME = 'gulp-shell'

function shell(commands, options) {
  if (!options) options = {}
  var ignoreErrors = !!options.ignoreErrors
  var quiet        = !!options.quiet

  var pathToBin = join(__dirname, 'node_modules', '.bin')
  var separator = process.platform.match(/^win/) >= 0 ? ';' : ':'
  var path = pathToBin + separator + process.env.PATH
  var env = _.extend({}, process.env, {PATH: path})

  return through.obj(function (file, _, done) {
    var self = this

    async.eachSeries(commands, function (command, done) {
      command = gutil.template(command, {file: file})

      cp.exec(command, {env: env}, function (error, stdout, stderr) {
        if (!quiet) {
          if (stderr) gutil.log(stderr.trim())
          if (stdout) gutil.log(stdout.trim())
        }

        done(ignoreErrors ? null : error)
      })
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
