function jsonDateAfter (ms) {
  return new Date(Date.now() + ms).toJSON()
}

module.exports = {
  jsonDateAfter
}
