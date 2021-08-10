'use strict';

import * as MathEval from "../pkg/math/math-eval.js"
import {ArgumentParser} from "../pkg/flag/argument-parser.js"
import {Autocomplete} from "../pkg/com/autocomplete.js"


function Cmd(name, aliases = undefined, description, func = undefined) {
  this.name = name
  this.aliases = aliases ?? [name]
  this.description = description
  this.func = func
}

function OpenURL(url) {
  // window.open(url, '_blank').focus() // Not allowed to load local resource
  // chrome.tabs.create({url: "file:///C:/xxx.file"})
  chrome.tabs.create({url, active: true}, (tab) => { // callback
    if (tab === undefined) {
      return
    }
    chrome.windows.getLastFocused({windowTypes: ['normal', 'panel']}, // open the window
      (window) => { // callback
        chrome.windows.update(window.id, {focused: true})
      }
    )
  })
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
                ["<hr>", "<hr>"],
                ["<kbd>sin{x}</kbd>", `<code>sin{30}</code>${Math.sin(30 * (Math.PI / 180))}`],
                ["<kbd>cos{x}</kbd>", `<code>cos{30}</code>${Math.cos(30 * (Math.PI / 180))}`],
                ["<kbd>tan{x}</kbd>", `<code>tan{30}</code>${Math.tan(30 * (Math.PI / 180))}`],
                ["<kbd>sec{x}</kbd>", `<code>sec{30}</code>${1 / Math.sin(30 * (Math.PI / 180))}`],
                ["<kbd>csc{x}</kbd>", `<code>csc{30}</code>${1 / Math.cos(30 * (Math.PI / 180))}`],
                ["<kbd>cot{x}</kbd>", `<code>cot{30}</code>${1 / Math.tan(30 * (Math.PI / 180))}`],
                ["<hr>", "<hr>"],
                ["<kbd>ln{x}</kbd>", `<code>ln{2.718281828459045}</code>${Math.log(Math.exp(1))}`], // do not support ln{e} i.e. The parameter is variable doesn't support.
                ["<kbd>log10{x}</kbd>", `<code>log10{100}</code>${Math.log10(100)}`],
              ]
            )
          }
        }
      ),
      new Cmd("chrome", ["chrome"], `Show some information about chrome.<br>Please use the <kbd>chrome -h</kbd> to see all full commands.`,
        (expression) => {
          const argObj = ArgumentParser(expression)

          const showChromeHelp = () => {
            this.addTable(["Commands", "Description"], [
              [`<kbd data-click-open="chrome://about">chrome about</kbd>`, "<code>List</code> of Google URLs"],
              [`<kbd data-click-open="chrome://version">chrome version</kbd>`, "<code>Version</code> of Google Chrome"],
              [`<kbd data-click-open="chrome://settings">chrome settings</kbd>`, "<code>Settings</code> of Google Chrome"],
              ["ext", "<hr>"],
              [`<kbd data-click-open="chrome://extensions">chrome extensions</kbd>`, "Manage the chrome <code>extensions</code>"],
              [`<kbd data-click-open="chrome://extensions/shortcuts">chrome extensions shortcuts</kbd>`, "Open Chrome extensions shortcuts"],
              ["media", "<hr>"],
              // [`<button onclick="OpenURL('chrome://media-internals')">chrome media internals</button>`, ""], // Refused to execute inline script because it violates the following Content Security Policy directive ...
              [`<kbd data-click-open="chrome://media-internals">chrome media internals</kbd>`, ""],
              [`<kbd data-click-open="chrome://media-engagement">chrome media engagement</kbd>`, ""],
              ["game", "<hr>"],
              [`<kbd data-click-open="chrome://dino">chrome game dino</kbd>`, ""],
            ])
          }

          if (argObj === undefined) {
            let [cmdName, subCmd, ...others] = expression.trim().split(" ")
            subCmd = subCmd ?? ""

            if (cmdName === undefined ||
              (cmdName === "game" && subCmd === "")
            ) {
              this.ShowErrMsg(`Unknown command: ${expression}`, "❌")
              showChromeHelp()
              return
            }

            switch (cmdName) {
              case "game":
                cmdName = ""
                break
              case "media":
                if (subCmd.length > 0) {
                  subCmd = "-" + subCmd
                }
                break
            }
            return OpenURL(`chrome://${cmdName}${subCmd}`)
          }
          if (argObj.help || argObj.h) {
            showChromeHelp()
            return
          }
          this.ShowErrMsg(`Unknown command: ${expression}`, "❌")
          showChromeHelp()
        }
      )
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

  addTabInfo(tab) {
    const frag = this.addElem(`<img class="bg-white" src="${tab.favIconUrl}" alt="" style="max-width: 32px; max-height:32px"/>
<a tabindex="0" class="text-decoration-none">${tab.title}</a>
<small><button class="light-gray bg-red">Close</button></small>
`,
      "div", {className: "mt-3", needAppend: false})

    const a = frag.querySelector('a')
    const closeBtn = frag.querySelector('button')
    const curFlag = frag.querySelector('div[class^="mt-3"]')
    a.onclick = () => {
      this.showExistsTab(tab)
    }

    a.onkeyup = (keyboardEvent) => {
      if (keyboardEvent.key === "Enter") {
        this.showExistsTab(tab)
      }
    }

    closeBtn.onclick = () => {
      chrome.tabs.remove(tab.id, () => {
          curFlag.remove()
        }
      )
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
        const match = /data-(?<eventName>.*)-(?<actionName>.*)="(?<value>.*)"/g.exec(colCell)
        if (match) {
          const {groups: {eventName, actionName, value}} = match
          td.addEventListener(eventName, () => {
            if (actionName === "open") {
              OpenURL(value)
            }
          })
        }
        td.innerHTML = colCell
        tr.append(td)
      }
      tbody.append(tr)
    }
    this.node.append(fragTable)
  }

  List() {
    chrome.windows.getAll({populate: true, windowTypes: ["normal", "panel", "app"]}, (windowArray) => { // "devtools" is ``Inspect ctrl+shift+I``
      windowArray.forEach(item => {
        item.tabs.sort( // Let the same icons be arranged together.
          (a, b) => {
            a.favIconUrl = a.favIconUrl ?? ""
            b.favIconUrl = b.favIconUrl ?? ""
            return a.favIconUrl.localeCompare(b.favIconUrl)
          }
        ).forEach(tab => { // sort((tab)=>tab.favIconUrl)
          this.addTabInfo(tab)
        })
      })
    })
  }

  showExistsTab(tab) {
    chrome.windows.update(tab.windowId, {focused: true}) // Open the window. A window contains many tabs.
    // chrome.tabs.update(tab.id, {active: true}) // <-- not working
    chrome.tabs.query({title: tab.title}, (tabs) => {
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

function CreateAutocomplete() {
  const autocompleteTable = {
    [`<i class="fas fa-eraser"></i>cls`]: [],
    [`<span>📋</span>list`]: [],
    [`<span>📋</span>ls`]: [],
    [`<i class="fab fa-chrome"></i>chrome`]: {
      [`about<small>List of Chrome URLs</small>`]: [],
      version: [],
      settings: [],

      [`<span>🔨</span>extensions<small>Manage your chrome extension.</small>`]: {
        shortcuts: [],
      },

      media: {
        internals: [],
        engagement: [],
      },

      [`<span>🎮</span>game`]: [`<i class="fas fa-running"></i>dino<small>A small game for you to relax.</small>`]
    },
    [`<i class="fas fa-info-circle"></i>help`]: [],
    [`<i class="fas fa-calculator"></i>=`]: [],
  }
  return new Autocomplete(document.querySelector(`div[data-com="autocomplete"]`), autocompleteTable)
}

(() => {
  // Autocomplete.HighlightColor = "#fae698"
  window.onload = () => {

    // Obj
    const cmdObj = new CommandCenter(document.getElementById(`msg-area`))

    // build autocompleteTable
    CreateAutocomplete()

    // DOM
    const input = document.querySelector(`input`)
    const commitBtn = document.querySelector(`input[type="submit"]`)
    input.addEventListener("keydown", (keyboardEvent) => {

      if (keyboardEvent.key !== "Enter") {
        return
      }
      keyboardEvent.preventDefault()
      if (null === document.querySelector(`div[class="autocomplete-active"]`)) {
        commitBtn.click()
      }
    })

    commitBtn.onclick = async (event) => {
      const inputValue = input.value

      for (const cmd of cmdObj.cmdArray) {
        for (const aliases of cmd.aliases) {
          if (inputValue.startsWith(aliases) && cmd.func !== undefined) {

            cmd.func(inputValue.slice(aliases.length))

            input.value = ""
            await new Promise(resolve => setTimeout(resolve, 1)) // wait process done.

            const msgNode = document.getElementById("msg-area")
            if (msgNode) {
              msgNode.scrollTop = msgNode.scrollHeight // scroll to bottom
            }
            return
          }
        }
      }

      cmdObj.ShowErrMsg(`Unknown command: ${inputValue}`, "❌")
      cmdObj.Help()
    }
  }
})()
