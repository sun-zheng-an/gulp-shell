import chalk from 'chalk'
import { spawn } from 'child_process'
import fancyLog from 'fancy-log'
import template from 'lodash.template'
import * as path from 'path'
import PluginError from 'plugin-error'
import { obj as throughObj } from 'through2'
import Vinyl from 'vinyl'

const PLUGIN_NAME = 'gulp-shell'

interface Options {
  cwd?: string
  env?: NodeJS.ProcessEnv
  shell?: true | string
  quiet?: boolean
  verbose?: boolean
  ignoreErrors?: boolean
  errorMessage?: string
  templateData?: object
}

const normalizeCommands = (commands: string | string[]): string[] => {
  if (typeof commands === 'string') {
    commands = [commands]
  }

  if (!Array.isArray(commands)) {
    throw new PluginError(PLUGIN_NAME, 'Missing commands')
  }

  return commands
}

const normalizeOptions = (options: Options = {}): Required<Options> => {
  const pathToBin = path.join(process.cwd(), 'node_modules', '.bin')
  /* istanbul ignore next */
  const pathName = process.platform === 'win32' ? 'Path' : 'PATH'
  const newPath = pathToBin + path.delimiter + process.env[pathName]
  const env = {
    ...process.env,
    [pathName]: newPath,
    ...options.env
  }

  return {
    cwd: process.cwd(),
    env,
    shell: true,
    quiet: false,
    verbose: false,
    ignoreErrors: false,
    errorMessage:
      'Command `<%= command %>` failed with exit code <%= error.code %>',
    templateData: {},
    ...options
  }
}

const runCommand = (
  command: string,
  options: Required<Options>,
  file: Vinyl | null
): Promise<void> => {
  const context = { file, ...options.templateData }
  command = template(command)(context)

  const cwd = template(options.cwd)(context);
  if (options.verbose) {
    fancyLog(`${PLUGIN_NAME}:`, chalk.cyan(cwd + "$ " + command))
  }

  const child = spawn(command, {
    env: options.env,
    cwd: cwd,
    shell: options.shell,
    stdio: options.quiet ? 'ignore' : 'inherit'
  })

  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0 || options.ignoreErrors) {
        return resolve()
      }

      const context = {
        command,
        file,
        error: { code },
        ...options.templateData
      }

      const message = template(options.errorMessage)(context)

      reject(new PluginError(PLUGIN_NAME, message))
    })
  })
}

const runCommands = async (
  commands: string[],
  options: Required<Options>,
  file: Vinyl | null
): Promise<void> => {
  for (const command of commands) {
    await runCommand(command, options, file)
  }
}

const shell = (
  commands: string | string[],
  options?: Options
): NodeJS.ReadWriteStream => {
  const normalizedCommands = normalizeCommands(commands)
  const normalizedOptions = normalizeOptions(options)

  const stream = throughObj(function(file, _encoding, done) {
    runCommands(normalizedCommands, normalizedOptions, file)
      .then(() => {
        this.push(file)
      })
      .catch(error => {
        this.emit('error', error)
      })
      .finally(done)
  })

  stream.resume()

  return stream
}

shell.task = (commands: string | string[], options?: Options) => (): Promise<
  void
> => runCommands(normalizeCommands(commands), normalizeOptions(options), null)

export = shell
