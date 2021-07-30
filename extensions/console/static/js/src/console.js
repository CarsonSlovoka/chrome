import * as MathEval from "../pkg/math/math-eval.js"

class CommandCenter {
  /**
   * @param {HTMLElement} node
   * */
  constructor(node) {
    this.node = node
    this.cmdTable = {
      list: {
        aliases: ["list", "ls"],
        description: "Show the information of each tab.",
        func: () => this.list()
      },
      cls: {
        aliases: ["cls"],
        description: "<b>Clear</b> screen",
        func: () => this.cls()
      },
      help: {
        aliases: ["help"],
        description: "Show all command lists.",
        func: () => this.help()
      }
    }
  }

  addP(text) {
    const range = document.createRange()
    const frag = range.createContextualFragment(`<p>${text}</p>`)
    this.node.append(frag)
  }

  addA(text, href, windowId, favIconSRC) {
    const range = document.createRange()

    const frag = range.createContextualFragment(`<div class="mt-3">
<img class="me-2 bg-white" src="${favIconSRC}" alt="" style="max-width: 32px; max-height:32px"/><a tabindex="0" class="text-decoration-none">${text}</a>
</div>`)

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
            a.favIconUrl = a.favIconUrl?? ""
            b.favIconUrl = b.favIconUrl?? ""
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
        <th>Hotkey</th>
      </tr>
    </thead>
    <tbody></tbody>
    </table>
    `)
    const tbody = fragTable.querySelector(`tbody`)
    for (const [name, item] of Object.entries(this.cmdTable)) {
      /* doesn't work https://stackoverflow.com/q/43102944/9935654
      const trFrag = document.createRange().createContextualFragment(`<th>
<td>${item.description}</td>
<td>${item.aliases.join(",")}</td>
</th>`)
       */
      const tr = document.createElement("tr")
      const tdDesc = document.createElement("td")
      const tdHotkey = document.createElement("td")
      tdDesc.innerHTML = item.description

      let hotkeyString = ""
      item.aliases.forEach(aliases => hotkeyString += `<kbd>${aliases}</kbd>  `) // <code>
      tdHotkey.innerHTML = hotkeyString // hotkeyString.slice(0, -1) // remove last character
      tr.append(tdDesc, tdHotkey)
      tbody.append(tr)
    }
    this.node.append(fragTable)
  }

  DoArithmetic(expressions) {
    this.addP(`${MathEval.Parse(expressions)}`)
  }

  RunCmd(cmdName) {
    this.cmdTable[cmdName].func()
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
    const cmdObj = new CommandCenter(document.querySelector(`section[data-name="message"]`))

    const validCmdNameList = []
    for (const [name, item] of Object.entries(cmdObj.cmdTable)) {
      item.aliases.forEach(aliases => validCmdNameList.push({name, aliases}))
    }

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
      // const cmdNameArray = Object.getOwnPropertyNames(cmdTable)
      const inputValue = input.value

      if (inputValue.startsWith("=")) {
        cmdObj.DoArithmetic(inputValue.slice(1))
        return
      }

      const cmdItem = validCmdNameList.find(({name, aliases}) => aliases === inputValue)
      if (cmdItem === undefined) {
        cmdObj.ShowErrMsg(`Unknown command: ${inputValue}`, "❌")
        return
      }

      cmdObj.RunCmd(cmdItem.name)
      input.value = ""
    }
  }
})()
