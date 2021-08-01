import * as MathEval from "../pkg/math/math-eval.js"
import {ArgumentParser} from "../pkg/flag/argument-parser.js"


function Cmd(name, aliases = undefined, description, func = undefined) {
  this.name = name
  this.aliases = aliases ?? [name]
  this.description = description
  this.func = func
}

class CommandCenter {
  /**
   * @param {HTMLElement} node
   * */
  constructor(node) {
    this.node = node
    this.cmdArray = [
      new Cmd("list", ["list", "ls"], "Show the information of each tab.", () => this.List()),
      new Cmd("cls", ["cls"], "<b>Clear</b> screen", () => this.Cls()),
      new Cmd("help", ["help", "h"], "Show all command lists.", () => this.Help()),
      new Cmd("=", ["="], "Do Arithmetic",
        (expression) => {
          const argObj = ArgumentParser(expression)
          if (argObj === undefined) {
            return this.DoArithmetic(expression.replaceAll(" ", ""))
          }
          if (argObj.help || argObj.h) {
            // this.addElem("((1+e)*3/round{3.5})%2", "p", {})
            this.addTable(["Operator", "Example"], [
                ["<kbd>+</kbd>", "<code>1+2</code>=3"],
                ["<kbd>-</kbd>", "<code>1-2</code>=-1"],
                ["<kbd>*</kbd>", "<code>2*3</code>=6"],
                ["<kbd>/</kbd>", "<code>6/3</code>=2"],
                ["<kbd>%</kbd>", "<code>7%5</code>=2"],
                ["<kbd>**</kbd>", "<code>2**3</code>=8"],
              ]
            )

            this.addTable(["Variable", "Value"], [
              ["<kbd>e</kbd>", `${Math.exp(1)}`],
              ["<kbd>pi</kbd>", `${Math.atan2(0, -1)}`],
            ])

            this.addTable(["Function", "Example"], [
                ["<kbd>mod{x,y}</kbd>", "<code>mod{12,5}</code>=2"],
                ["<kbd>pow{x,y}</kbd>", "<code>pow{2,3}</code>=8"],
                ["<kbd>sqrt{x}</kbd>", "<code>sqrt{16}</code>=4"],
                ["<kbd>round{x}</kbd>", "<code>round{3.5}</code>=4, <code>round{3.499}</code>=3"],
                ["----", "----"],
                ["<kbd>sin{x}</kbd>", `<code>sin{30}</code>${Math.sin(30 * (Math.PI / 180))}`],
                ["<kbd>cos{x}</kbd>", `<code>cos{30}</code>${Math.cos(30 * (Math.PI / 180))}`],
                ["<kbd>tan{x}</kbd>", `<code>tan{30}</code>${Math.tan(30 * (Math.PI / 180))}`],
                ["<kbd>sec{x}</kbd>", `<code>sec{30}</code>${1 / Math.sin(30 * (Math.PI / 180))}`],
                ["<kbd>csc{x}</kbd>", `<code>csc{30}</code>${1 / Math.cos(30 * (Math.PI / 180))}`],
                ["<kbd>cot{x}</kbd>", `<code>cot{30}</code>${1 / Math.tan(30 * (Math.PI / 180))}`],
                ["----", "----"],
                ["<kbd>ln{x}</kbd>", `<code>ln{2.718281828459045}</code>${Math.log(Math.exp(1))}`], // do not support ln{e} i.e. The parameter is variable doesn't support.
                ["<kbd>log10{x}</kbd>", `<code>log10{100}</code>${Math.log10(100)}`],
              ]
            )
          }
        }
      ),
    ]
  }

  addElem(text, elem = "p", {className = undefined, needAppend = true}) {
    const range = document.createRange()
    const frag = range.createContextualFragment(`<${elem} ${className !== undefined ? 'class="' + className + '"' : ""}>${text}</${elem}>`)
    if (needAppend) {
      this.node.append(frag)
    } else {
      return frag // If the frag has appended, then childNodes will empty.
    }
  }

  addA(text, href, windowId, favIconSRC) {
    const frag = this.addElem(`<img class="me-2 bg-white" src="${favIconSRC}" alt="" style="max-width: 32px; max-height:32px"/><a tabindex="0" class="text-decoration-none">${text}</a>`,
      "div", {className: "mt-3", needAppend: false})

    const a = frag.querySelector('a')
    // a.href = href
    a.onclick = () => {
      this.showExistsTab(windowId, text)
    }

    a.onkeyup = (keyboardEvent) => {
      if (keyboardEvent.key === "Enter") {
        this.showExistsTab(windowId, text)
      }
    }

    this.node.append(frag)
  }

  addTable(headerArray, rowArray) {
    const range = document.createRange()

    let theadData = ""
    headerArray.forEach(header => theadData += `<th>${header}</th>`)

    const fragTable = range.createContextualFragment(`
    <table class="mt-2 table table-sm table-gray table-hover table-striped bg-white">
    <thead>
        <tr>
            ${theadData}
        </tr>
    </thead>
    <tbody></tbody>
    </table>
    `)

    const tbody = fragTable.querySelector(`tbody`)
    /* document.createRange().createContextualFragment(`<th><td>${item.description}</td><td>${item.aliases.join(",")}</td></th>`) <-- doesn't work https://stackoverflow.com/q/43102944/9935654 */
    for (const rowData of rowArray) {
      const tr = document.createElement("tr")
      for (const colCell of rowData) {
        const td = document.createElement("td")
        td.innerHTML = colCell
        tr.append(td)
      }
      tbody.append(tr)
    }
    this.node.append(fragTable)
  }

  List() {
    chrome.windows.getAll({populate: true, windowTypes: ["normal", "panel", "app", "devtools"]}, (windowArray) => {
      windowArray.forEach(item => {
        item.tabs.sort( // Let the same icons be arranged together.
          (a, b) => {
            a.favIconUrl = a.favIconUrl ?? ""
            b.favIconUrl = b.favIconUrl ?? ""
            return a.favIconUrl.localeCompare(b.favIconUrl)
          }
        ).forEach(tab => { // sort((tab)=>tab.favIconUrl)
          this.addA(tab.title, tab.url, tab.windowId, tab.favIconUrl)
        })
      })
    })
  }

  showExistsTab(windowId, title) {
    chrome.windows.update(windowId, {focused: true}) // Open the window. A window contains many tabs.
    chrome.tabs.query({title}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.update(tab.id, {active: true})
      })
    })
  }

  Cls() {
    this.node.querySelectorAll('*').forEach(e => e.remove())
  }

  Help() {
    const rowArray = []
    for (const cmd of this.cmdArray) {
      let hotkeyString = ""
      cmd.aliases.forEach(aliases => hotkeyString += `<kbd>${aliases}</kbd>  `) // <code>
      rowArray.push([cmd.description, hotkeyString])
    }
    this.addTable(["Desc", "Available commands"], rowArray)
  }

  DoArithmetic(expressions) {
    try {
      this.addElem(`${MathEval.Parse(expressions)}`, "p", {})
    } catch (e) {
      this.ShowErrMsg(`${e.messageType} ${e.message}`, "❌")
    }
  }

  /**
   * @param {string} msg
   * @param {""|"⚠"|"🔔"|"❗"|"🌱"|"🕷"|"🐬"|"❌"|"❓"} icon :
   * */
  ShowErrMsg(msg, icon = "") {
    const range = document.createRange()
    const frag = range.createContextualFragment(`
    <blockquote id="msg" class="ml2 athelas ml0 mt0 pl4 black-90 bl bw2 b--blue gold" > <!-- hidden -->
        <div class="f5 f4-m f3-l lh-copy measure mt0">
          <p>${icon}<span class="">${msg}</span></p>
        </div>
        <cite class="f7 ttu tracked fs-normal">―<i>System Message</i></cite>
    </blockquote>
    `)
    this.node.append(frag)
  }
}

(() => {
  window.onload = () => {
    // Obj
    const cmdObj = new CommandCenter(document.querySelector(`section[data-name="message"]`))

    // DOM
    const input = document.querySelector(`input`)
    const commitBtn = document.querySelector(`button`)
    input.addEventListener("keyup", (keyboardEvent) => {

      if (keyboardEvent.key !== "Enter") {
        return
      }
      keyboardEvent.preventDefault()
      commitBtn.click()
    })

    commitBtn.onclick = (event) => {
      const inputValue = input.value

      for (const cmd of cmdObj.cmdArray) {
        if (cmd.aliases.find(aliases => inputValue.startsWith(aliases)) === undefined) {
          continue
        }
        if (cmd.func !== undefined) {
          cmd.func(inputValue.slice(cmd.aliases.length))
          input.value = ""
          return
        }
      }

      cmdObj.ShowErrMsg(`Unknown command: ${inputValue}`, "❌")
    }
  }
})()
