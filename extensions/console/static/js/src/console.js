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
      new Cmd("list", ["list", "ls"], "Show the information of each tab.", () => this.list()),
      new Cmd("cls", ["cls"], "<b>Clear</b> screen", () => this.cls()),
      new Cmd("help", ["help", "h"], "Show all command lists.", () => this.help()),
      new Cmd("=", ["="], "Do Arithmetic",
        (expression) => {
          const argObj = ArgumentParser(expression)
          if (argObj === undefined) {
            return this.DoArithmetic(expression.replaceAll(" ", ""))
          }
          if (argObj.help || argObj.h) {
            this.addElem("((1+e)*3/round{3.5})%2", "p", {})
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

  list() {
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

  cls() {
    this.node.querySelectorAll('*').forEach(e => e.remove())
  }

  help() {
    const range = document.createRange()
    const fragTable = range.createContextualFragment(`
    <table class="table table-sm table-gray table-hover table-striped bg-white">
    <thead>
      <tr>
        <th>Desc.</th>
        <th>Available commands</th>
      </tr>
    </thead>
    <tbody></tbody>
    </table>
    `)
    const tbody = fragTable.querySelector(`tbody`)
    for (const cmd of this.cmdArray) {
      /* doesn't work https://stackoverflow.com/q/43102944/9935654
      const trFrag = document.createRange().createContextualFragment(`<th>
<td>${item.description}</td>
<td>${item.aliases.join(",")}</td>
</th>`)
       */
      const tr = document.createElement("tr")
      const tdDesc = document.createElement("td")
      const tdHotkey = document.createElement("td")
      tdDesc.innerHTML = cmd.description

      let hotkeyString = ""
      cmd.aliases.forEach(aliases => hotkeyString += `<kbd>${aliases}</kbd>  `) // <code>
      tdHotkey.innerHTML = hotkeyString // hotkeyString.slice(0, -1) // remove last character
      tr.append(tdDesc, tdHotkey)
      tbody.append(tr)
    }
    this.node.append(fragTable)
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
