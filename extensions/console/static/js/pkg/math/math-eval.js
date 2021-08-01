class UnknownVarError extends Error {
}

class ValueMissingError extends Error {
}

class ParseError extends Error {
}

class MissingParaError extends Error {
}

/**
 * @description Operator
 * @param {string} sign "+", "-", "*", "/", ...
 * @param {number} precedence
 * @param {"L"|"R"} assoc associativity  left or right
 * @param {function} exec
 * */
function Op(sign, precedence, assoc, exec = undefined) {
  this.sign = sign
  this.precedence = precedence
  this.assoc = assoc
  this.exec = exec
}

const OpArray = [
  new Op("+", 10, "L", (l, r) => l + r),
  new Op("-", 10, "L", (l, r) => l - r),
  new Op("*", 20, "L", (l, r) => l * r),
  new Op("/", 20, "L", (l, r) => l / r),
  new Op("%", 20, "L", (l, r) => l % r),
  new Op("**", 30, "R", (l, r) => Math.pow(l, r))
]

const VarTable = {
  e: Math.exp(1),
  pi: Math.atan2(0, -1), // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
  pow: (x, y) => Math.pow(x, y),
  sqrt: (x) => Math.sqrt(x),
  round: (x) => Math.round(x),
}

/**
 * @param {Op} op
 * @param {Number} value
 * */
function Item(op, value = undefined) {
  this.op = op
  this.value = value
}

class Stack extends Array {
  constructor(...items) {
    super(...items)
    this.push(new Item(new Op("", 0, "L")))
  }

  GetLastItem() {
    return this[this.length - 1] // fast then pop // https://stackoverflow.com/a/61839489/9935654
  }
}

function Cursor(str, pos) {
  this.str = str
  this.pos = pos
  this.MoveRight = (step = 1) => {
    this.pos += step
  }
  this.PeekRightChar = (step = 1) => {
    return this.str.substring(this.pos, this.pos + step)
  }

  /**
   * @return {Op}
   * */
  this.MoveToNextOp = () => {
    const opArray = OpArray.sort((a, b) => b.precedence - a.precedence)
    for (const op of opArray) {
      const sign = this.PeekRightChar(op.sign.length)
      if (op.sign === sign) {
        this.MoveRight(op.sign.length)
        return op
      }
    }
    return null
  }
}

/**
 * @param {Cursor} cursor
 * */
function parseVal(cursor) {
  let startOffset = cursor.pos

  const regex = /^(?<OpOrVar>[^\d.])?(?<Num>[\d.]*)/g
  const m = regex.exec(cursor.str.substr(startOffset))
  if (m) {
    const {groups: {OpOrVar, Num}} = m
    if (OpOrVar === undefined && Num) {
      cursor.pos = startOffset + Num.length

      if (cursor.pos > startOffset) {
        return parseFloat(cursor.str.substring(startOffset, startOffset + cursor.pos - startOffset))
      }
    }

    if ("+-(".indexOf(OpOrVar) !== -1) {
      cursor.pos++
      switch (OpOrVar) {
        case "+": // unary plus, for example: (+5)
          return parseVal(cursor)
        case "-":
          return -(parseVal(cursor))
        case "(":
          const value = parseExpr(cursor)
          if (cursor.PeekRightChar() === ")") {
            cursor.MoveRight()
            return value
          }
          throw new ParseError("Parsing error: ')' expected")
      }
    }
  }

  const match = cursor.str.substring(cursor.pos).match(/^[a-z_][a-z0-9_]*/i) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match

  if (match) {
    const varName = match[0]
    cursor.MoveRight(varName.length)
    const bracket = cursor.PeekRightChar(1)
    if (bracket !== "{") {
      if (varName in VarTable) {
        const val = VarTable[varName]
        if (typeof val === "function") {
          throw new MissingParaError(`${varName} is a function, it needs big curly brackets`)
        }
        return val
      }
    }

    // is a function
    const regex = /{(?<Para>[^{]*)}/gm
    const m = regex.exec(cursor.str.substring(cursor.pos))
    if (m && m.groups.Para !== undefined) {
      const paraString = m.groups.Para
      const para = paraString.split(',')
      cursor.MoveRight(paraString.length + 2) // 2 = { + }
      return VarTable[varName](...para)
    }

    throw new UnknownVarError(`unknown variable ${varName}`)
  }

  if (cursor.str.length === cursor.pos) { // example: 1+2+
    throw new ValueMissingError(`Parsing error at end of string: value expected.`)
  } else { // example: 1+2+*
    throw new ParseError("Parsing error: unrecognized value")
  }
}

/**
 * @param {string|Cursor} expr
 * */
function parseExpr(expr) {
  const stack = new Stack()
  const cursor = (expr instanceof Cursor) ? expr : new Cursor(expr, 0)
  while (1) {
    let rightValue = parseVal(cursor)
    const op = cursor.MoveToNextOp() ?? new Op("", 0, "L")

    while (
      op.precedence < stack.GetLastItem().op.precedence ||
      (op.precedence === stack.GetLastItem().op.precedence && op.assoc === 'L')) {
      const lastItem = stack.pop()
      if (!lastItem.op.exec) { // end reached
        return rightValue
      }
      rightValue = lastItem.op.exec(lastItem.value, rightValue)
    }

    stack.push(new Item(op, rightValue))
  }
}

export function Parse(str) {
  return parseExpr(str.replaceAll(" ", ""))
}
