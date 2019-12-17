import JobError from './interfaces/jobError'

/**
 * Splits a line from a stacktrace into functionName, fileName, lineNumber and position.
 * A stacktrace line can look like this:
 *       at new Script (vm.js:84:7)
 * @param line a line from a stacktrace
 * @returns a tuple of [functionName, filename, lineNumber, position]
 */
export function parseStacktraceLine (line: string): [string, string, number, number] {
  const match = line.match(/^ +at (.+) \((.+):(\d+):(\d+)\)/)
  if (match === null) {
    throw new Error('Unexpected stacktrace line format')
  }
  const [_, functionName, fileName, lineNumber, position] = match
  return [functionName, fileName, parseInt(lineNumber), parseInt(position)]
}

/**
 * Parses the first line of a syntax error stack trace.
 * It normally looks like this:
 *   main:2
 */
function parseSyntaxErrorHeader (header: string): [string, number] {
  const match = header.match(/^(.+):(\d+)/)
  if (match === null) {
    throw new Error('Unexpected stacktrace format')
  }
  const [_, fileName, lineNumber] = match
  return [fileName, parseInt(lineNumber)]
}

/**
 * Rewrites a stacktrace to be used in the application internal error format:
 * - removes all internal entries (like this application and vm2 code)
 * - rewrites line numbers to hide the function wrapping
 * @param oldLines the original stacktrace lines
 */
function rewriteStacktrace (oldLines: string[], prefixLength: number): string[] {
  const contextLine = oldLines.findIndex(line => line.includes('Script.runInContext'))
  const newLines = oldLines.slice(0, contextLine - 1)
  const newLinesAdjusted = newLines.map(line => {
    const [functionName, fileName, lineNumber, position] = parseStacktraceLine(line)
    const newLineNumber = lineNumber - prefixLength
    return `    at ${functionName} (${fileName}:${newLineNumber}:${position})`
  })
  return newLinesAdjusted
}

/**
 * Converts a javascript syntax error into the application-specific form.
 * The stacktrace output normally looks like this:
 *   main:2
 *   syntax error
 *          ^^^^^
 *
 *   SyntaxError: Unexpected identifier
 *       at new Script (vm.js:84:7)
 *       at VMScript.compile (/home/ods-main/transformation/node_modules/vm2/lib/main.js:80:20)
 *       ...
 * @param error The original javascript syntax error
 */
export function convertSyntaxError (error: Error, prefixLength: number): JobError {
  if (error.name !== 'SyntaxError') {
    throw new Error('Not a syntax error')
  }
  if (error.stack === undefined) {
    throw new Error('Undefined stacktrace')
  }

  const lines = error.stack.split('\n')

  const header = lines[0]
  const [_, lineNumber] = parseSyntaxErrorHeader(header)
  const lineNumberAdjusted = lineNumber - prefixLength

  const markers = lines[2]
  const markerIndex = markers.indexOf('^')
  const position = markerIndex > 0 ? markerIndex : 0

  const message = lines[4]

  return {
    name: error.name,
    message,
    position,
    lineNumber: lineNumberAdjusted,
    stacktrace: []
  }
}

/**
 * Converts a non-syntax error into the application specific format
 * The stacktrace normally looks like this:
 *   TypeError: Cannot set property 'e' of undefined
 *       at test (main:4:12)
 *       at main (main:6:8)
 *       at main:8:1
 *       at Script.runInContext (vm.js:127:20)
 *       at VM.run (/home/ods-main/transformation/node_modules/vm2/lib/main.js:219:62)
 *       ...
 * @param error the original javascript error
 */
export function convertRuntimeError (error: Error, prefixLength: number): JobError {
  if (error.stack === undefined) {
    throw new Error('Undefined stacktrace')
  }

  if (error.message.startsWith('Script execution timed out')) {
    return {
      name: 'TimeoutError',
      message: error.message,
      lineNumber: 0,
      position: 0,
      stacktrace: []
    }
  }
  const lines = error.stack.split('\n')

  const message = lines[0]

  const topFrame = lines[1]
  const [_, __, lineNumber, position] = parseStacktraceLine(topFrame)
  const lineNumberAdjusted = lineNumber - prefixLength

  const newLines = rewriteStacktrace(lines.slice(1), prefixLength)

  return {
    name: error.name,
    message,
    lineNumber: lineNumberAdjusted,
    position,
    stacktrace: newLines
  }
}
