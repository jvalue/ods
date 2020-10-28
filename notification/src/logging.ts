const MAX_STRING_LENGTH = 100

export const stringifyArray = (args: unknown[]): string => {
  return JSON.stringify(
    args.map(arg => stringify(arg))
  )
}

export const stringify = (arg: unknown): string => {
  const json = JSON.stringify(arg)
  if (json.length > MAX_STRING_LENGTH) {
    return `${json.substring(0, MAX_STRING_LENGTH * 0.8)}[...]${json.substring(json.length - MAX_STRING_LENGTH * 0.2)}`
  }
  return json
}
