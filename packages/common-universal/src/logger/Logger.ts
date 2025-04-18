import { assertNever } from '../assert/assertNever.js'
import { LogFormatterJson } from './LogFormatterJson.js'
import { LogFormatterObject } from './LogFormatterObject.js'
import { LogFormatterPretty } from './LogFormatterPretty.js'
import { LEVEL, LogLevel } from './LogLevel.js'
import { LogThrottle, LogThrottleOptions } from './LogThrottle.js'
import { parseLogArguments } from './parseLogArguments.js'
import { resolveError } from './resolveError.js'
import { tagService } from './tagService.js'
import { LogEntry, LoggerOptions } from './types.js'

export interface ILogger {
  critical(...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  info(...args: unknown[]): void
  debug(...args: unknown[]): void
  trace(...args: unknown[]): void

  configure(options: Partial<LoggerOptions>): ILogger
  for(object: {} | string): ILogger
  tag(tag: string | undefined): ILogger
}

/**
 * [Read full documentation](https://github.com/l2beat/tools/blob/master/packages/backend-tools/src/logger/docs.md)
 */
export class Logger implements ILogger {
  private readonly options: LoggerOptions
  private readonly logLevel: number
  private throttle?: LogThrottle

  constructor(options: Partial<LoggerOptions>) {
    this.options = {
      logLevel: options.logLevel ?? 'INFO',
      service: options.service,
      tag: options.tag,
      utc: options.utc ?? false,
      getTime: options.getTime ?? (() => new Date()),
      reportError: options.reportError ?? (() => {}),
      transports: options.transports ?? [
        {
          transport: console,
          formatter: new LogFormatterJson(),
        },
      ],
    }
    this.logLevel = LEVEL[this.options.logLevel]
  }

  static SILENT = new Logger({ logLevel: 'NONE' })

  static CRITICAL = new Logger({
    logLevel: 'CRITICAL',
    transports: [
      {
        transport: console,
        formatter: new LogFormatterPretty(),
      },
    ],
  })

  static ERROR = new Logger({
    logLevel: 'ERROR',
    transports: [
      {
        transport: console,
        formatter: new LogFormatterPretty(),
      },
    ],
  })

  static WARN = new Logger({
    logLevel: 'WARN',
    transports: [
      {
        transport: console,
        formatter: new LogFormatterPretty(),
      },
    ],
  })

  static INFO = new Logger({
    logLevel: 'INFO',
    transports: [
      {
        transport: console,
        formatter: new LogFormatterPretty(),
      },
    ],
  })

  static DEBUG = new Logger({
    logLevel: 'DEBUG',
    transports: [
      {
        transport: console,
        formatter: new LogFormatterPretty(),
      },
    ],
  })

  static TRACE = new Logger({
    logLevel: 'TRACE',
    transports: [
      {
        transport: console,
        formatter: new LogFormatterPretty(),
      },
    ],
  })

  static BROWSER = new Logger({
    logLevel: 'INFO',
    transports: [
      {
        transport: console,
        formatter: new LogFormatterObject(),
      },
    ],
  })

  configure(options: Partial<LoggerOptions>): Logger {
    const logger = new Logger({ ...this.options, ...options })
    logger.throttle = this.throttle
    return logger
  }

  for(object: {} | string): Logger {
    const name = typeof object === 'string' ? object : object.constructor.name
    return this.configure({
      service: this.options.service ? `${this.options.service}.${name}` : name,
    })
  }

  tag(tag: string | undefined): Logger {
    return this.configure({ tag })
  }

  withThrottling(options: LogThrottleOptions): Logger {
    const logger = new Logger(this.options)
    logger.throttle = new LogThrottle(
      {
        print: (level, service, message, parameters) =>
          logger.print({
            time: logger.options.getTime(),
            level,
            service,
            message,
            parameters,
          }),
      },
      options,
    )
    return logger
  }

  critical(...args: unknown[]): void {
    if (this.logLevel >= LEVEL.CRITICAL) {
      const parsed = this.parseEntry('CRITICAL', args)
      this.print(parsed)
      this.options.reportError(parsed)
    }
  }

  error(...args: unknown[]): void {
    if (this.logLevel >= LEVEL.ERROR) {
      const entry = this.parseEntry('ERROR', args)
      this.print(entry)
      this.options.reportError(entry)
    }
  }

  warn(...args: unknown[]): void {
    if (this.logLevel >= LEVEL.WARN) {
      this.print(this.parseEntry('WARN', args))
    }
  }

  info(...args: unknown[]): void {
    if (this.logLevel >= LEVEL.INFO) {
      this.print(this.parseEntry('INFO', args))
    }
  }

  debug(...args: unknown[]): void {
    if (this.logLevel >= LEVEL.DEBUG) {
      this.print(this.parseEntry('DEBUG', args))
    }
  }

  trace(...args: unknown[]): void {
    if (this.logLevel >= LEVEL.TRACE) {
      this.print(this.parseEntry('TRACE', args))
    }
  }

  private parseEntry(level: LogLevel, args: unknown[]): LogEntry {
    const parsed = parseLogArguments(args)
    return {
      ...parsed,
      resolvedError: parsed.error ? resolveError(parsed.error) : undefined,
      level,
      time: this.options.getTime(),
      service: tagService(this.options.service, this.options.tag),
    }
  }

  private print(entry: LogEntry): void {
    if (this.throttle?.throttle(entry.level, entry.service, entry.message)) {
      return
    }

    this.printExactly(entry)
  }

  private printExactly(entry: LogEntry): void {
    for (const transportOptions of this.options.transports) {
      const output = transportOptions.formatter.format(entry)
      switch (entry.level) {
        case 'CRITICAL':
        case 'ERROR':
          transportOptions.transport.error(output)
          break
        case 'WARN':
          transportOptions.transport.warn(output)
          break
        case 'INFO':
          transportOptions.transport.log(output)
          break
        case 'DEBUG':
        case 'TRACE':
          transportOptions.transport.debug(output)
          break
        case 'NONE':
          break
        default:
          assertNever(entry.level)
      }
    }
  }
}
