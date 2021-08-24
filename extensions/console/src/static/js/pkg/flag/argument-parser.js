class ParserError extends Error {

}

function Cursor(str, pos) {
  this.str = str
  this.pos = pos
  this.MoveRight = (step = 1) => {
    this.pos += step
  }

  this.MoveToNextPara = () => {
    const curStr = this.str.substring(this.pos)
    const match = /^(?<all> *--?(?<name>[a-zA-Z_][a-zA-Z0-9_]*)(=(?<value>[^-]*))?)/g.exec(curStr) // https://regex101.com/r/k004Gv/2
    if (match) {
      let {groups: {all, name, value}} = match

      if (value !== undefined) {
        value = value.trim()
        if (value.slice(0, 1) === '"') { // string
          if (value.slice(-1) !== '"') {
            throw new ParserError(`Parsing error: '"' expected`)
          }
          value = value.slice(1, -1)
        } else { // number or string (without '"')
          value = isNaN(Number(value)) ? String(value) : Number(value)
        }
      }

      this.MoveRight(all.length)
      return [name, value ?? true] // If the value is undefined, then set it as ture.
    }
    throw new ParserError(`illegal format detected. ${curStr}`)
  }
}

export function ArgumentParser(str) {
  if (str === "")
    return {}
  const obj = {}
  const cursor = new Cursor(str, 0)
  while (1) {
    try {
      const [name, value] = cursor.MoveToNextPara()
      obj[name] = value
      if (cursor.pos === str.length) {
        return obj
      }
    } catch(e) {
      return undefined
    }
  }
}
