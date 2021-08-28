'use strict';

import * as MathEval from "../pkg/math/math-eval.js"
import {ArgumentParser} from "../pkg/flag/argument-parser.js"
import {Autocomplete} from "../pkg/com/autocomplete.js"
import * as Bookmarks from "../pkg/chrome/bookmarks/bookmarks.js"
import * as Rec from "../pkg/chrome/rec/media-recorder.js"


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

    this.lastTabID = 0
    chrome.tabs.onActivated.addListener(({tabId, windowId}) => { // https://stackoverflow.com/a/68632591/9935654
      this.lastTabID = tabId
    })

    this.cmdArray = [
      new Cmd("list", ["list", "ls"], chrome.i18n.getMessage("CMDList"), () => this.List()),
      new Cmd("cls", ["cls"], chrome.i18n.getMessage("CMDClsHTML"), () => this.Cls()),
      new Cmd("help", ["help", "h"], chrome.i18n.getMessage("CMDHelp"), () => this.Help()),
      new Cmd("=", ["="], chrome.i18n.getMessage("CMDArithmetic"),
        (expression) => {
          const argObj = ArgumentParser(expression)
          if (argObj === undefined) {
            return this.DoArithmetic(expression.replaceAll(" ", ""))
          }
          if (argObj.help || argObj.h) {
            this.addTable([chrome.i18n.getMessage("Operator"), chrome.i18n.getMessage("Example")], [
                ["<kbd>+</kbd>", "<code>1+2</code>=3"],
                ["<kbd>-</kbd>", "<code>1-2</code>=-1"],
                ["<kbd>*</kbd>", "<code>2*3</code>=6"],
                ["<kbd>/</kbd>", "<code>6/3</code>=2"],
                ["<kbd>%</kbd>", "<code>7%5</code>=2"],
                ["<kbd>**</kbd>", "<code>2**3</code>=8"],
              ]
            )

            this.addTable([chrome.i18n.getMessage("Variable"), chrome.i18n.getMessage("Value")], [
              ["<kbd>e</kbd>", `${Math.exp(1)}`],
              ["<kbd>pi</kbd>", `${Math.atan2(0, -1)}`],
            ])

            this.addTable([chrome.i18n.getMessage("Function"), chrome.i18n.getMessage("Example")], [
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
      new Cmd("chrome", ["chrome"], chrome.i18n.getMessage("CMDChromeHTML"),
        async (expression) => {
          const argObj = ArgumentParser(expression)

          const showChromeHelp = () => {
            this.addTable([chrome.i18n.getMessage("Commands"), chrome.i18n.getMessage("Desc")], [
              [`<kbd data-click-open="chrome://about">chrome about</kbd>`, chrome.i18n.getMessage("ChromeAbout")],
              [`<kbd data-click-open="chrome://bookmarks">chrome bookmarks</kbd>`, chrome.i18n.getMessage("ManageBMHTML")],
              [`<kbd data-click-open="chrome://version">chrome version</kbd>`, chrome.i18n.getMessage("ChromeVersionHTML")],
              [`<kbd data-click-open="chrome://settings">chrome settings</kbd>`, chrome.i18n.getMessage("ChromeSettingsHTML")],
              [`<kbd data-click-open="chrome://settings/languages">chrome settings languages</kbd>`, chrome.i18n.getMessage("ChromeSetLangHTML")],
              [`<kbd data-click-open="chrome://history">chrome history</kbd>`, chrome.i18n.getMessage("ChromeHistoryHTML")],
              ["extensions", "<hr>"],
              [`<kbd data-click-open="chrome://extensions">chrome extensions</kbd>`, chrome.i18n.getMessage("ChromeExtHTML")],
              [`<kbd data-click-open="chrome://extensions/shortcuts">chrome extensions shortcuts</kbd>`, chrome.i18n.getMessage("ChromeExtHotkeyHTML")],
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
              this.ShowErrMsg(chrome.i18n.getMessage("UnknownCommand", expression), "❌")
              showChromeHelp()
              return
            }

            let sep = "/"
            switch (cmdName) {
              case "game":
                cmdName = ""
                break
              case "media":
                if (subCmd.length > 0) {
                  sep = '-'
                }
                break
            }
            return OpenURL(`chrome://${[cmdName, subCmd].join(sep)}`)
          }
          if (argObj.help || argObj.h) {
            showChromeHelp()
            return
          }
          this.ShowErrMsg(chrome.i18n.getMessage("UnknownCommand", expression), "❌")
          showChromeHelp()
        }
      ),
      new Cmd("bookmarks", ["bm"], chrome.i18n.getMessage("CMDBM"), async (expression) => {
        const argObj = ArgumentParser(expression)

        const showBookmarksHelp = () => {
          this.addTable([chrome.i18n.getMessage("Commands"), chrome.i18n.getMessage("Desc")], [])
        }

        if (argObj === undefined || argObj.h || argObj.help) {
          showBookmarksHelp()
          return
        }

        // const regex = new RegExp(argObj.search ?? "", "i")

        const showLayerInfo = (treeNode, parentTitle = "") => {
          this.addElem(`<i class="me-2">${parentTitle}</i><code>${treeNode.title}</code>`, "p", {})
          if (treeNode.children !== undefined) {
            treeNode.children.forEach(subTree => {
                const subTitle = parentTitle === "" ? treeNode.title
                  : parentTitle + "<code>=></code>" + treeNode.title
                showLayerInfo(subTree, subTitle)
              }
            )
          }
        }

        /** @type {Array} */
        const bookmarkTreeNode = await chrome.bookmarks.getTree()
        bookmarkTreeNode.forEach(treeNode => {
          showLayerInfo(treeNode)
        })
      }),
      new Cmd("video", ["video"], chrome.i18n.getMessage("CMDVideo"), async (expression) => {
        const argObj = ArgumentParser(expression)

        const showVideoHelp = () => {
          this.addTable([chrome.i18n.getMessage("Commands"), chrome.i18n.getMessage("Desc")], [
            [`<kbd data-click-typing='video -speed=2.5'>video -speed=2.5</kbd>`, chrome.i18n.getMessage("CMDVideoSpeedExample", "2.5"),],
            ["rec", "<hr>"],
            [`<kbd data-click-typing='video -rec -controller'>video -rec -controller</kbd>`, chrome.i18n.getMessage("CMDVideoRECController")],
            [`<kbd data-click-typing='video -rec -width=200 -height=200 -fps=1'>video -rec -width=200 -height=200 -fps=1</kbd>`, chrome.i18n.getMessage("CMDVideoRECOptions")],
            [`<kbd data-click-typing='video -rec -w=200 -h=200 -f=1'>video -rec -w=200 -h=200 -f=1</kbd>`, chrome.i18n.getMessage("CMDVideoRECOptions")],
            [`<kbd data-click-typing='video -rec -f=1'>video -rec -f=1</kbd>`, chrome.i18n.getMessage("CMDVideoRECOptionsFPS")]
          ])
        }

        if (argObj === undefined || argObj.help) {
          showVideoHelp()
          return
        }

        const speed = argObj.speed
        if (speed) {
          chrome.tabs.get(this.lastTabID, (tab) => {
            chrome.tabs.sendMessage(tab.id, {name: "change-video-speed", speed}, (result) => {
              if (result) {
                alert(result.msg)
              }
            })
          })
        }

        if (argObj.rec) {
          const videoOptions = {
            width: argObj.width ?? argObj.w,
            height: argObj.height ?? argObj.h,
            fps: argObj.fps ?? argObj.f ?? 25,
            display: argObj.display ?? true,
            debug: argObj.debug ?? false,
          }

          const parentNode = document.getElementById(`msg-area`)
          if (argObj.controller) {
            this.Cls() // To avoid ID have existed already.
            Rec.RTCMediaRecorder.DisplayController(parentNode, argObj.debug ?? false)
          } else {
            const rec = new Rec.RTCMediaRecorder(parentNode, videoOptions)
            await rec.StartRecordingMedia()
          }
        }
      })
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
        const match = /data-(?<eventName>[a-z0-9]*)-(?<actionName>[a-z0-9]*)=['"](?<value>.*)['"]>/.exec(colCell)
        if (match) {
          const {groups: {eventName, actionName, value}} = match
          td.addEventListener(eventName, () => {
            switch (actionName) {
              case "open":
                OpenURL(value)
                break
              case "typing":
                const input = document.getElementById('user-input')
                input.value = value
                break
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
    this.addTable([chrome.i18n.getMessage("Desc"), chrome.i18n.getMessage("AvailableCMDs")], rowArray)
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
        <cite class="f7 ttu tracked fs-normal">―<i>${chrome.i18n.getMessage("SystemMessage")}</i></cite>
    </blockquote>
    `)
    this.node.append(frag)
  }
}

async function CreateAutocomplete() {

  const bookmarkTree = await Bookmarks.GetTree()
  const bookmarkTable = (Bookmarks.Tree2AutocompleteTable(bookmarkTree))[""]
  const bookmarkFileArray = []
  const bookmarkArray = []
  Bookmarks.Tree2AutocompleteArray(bookmarkTree, bookmarkFileArray)
  Bookmarks.Tree2AutocompleteArray(bookmarkTree, bookmarkArray, true)

  const autocompleteTable = {
    [`<span>⭐</span>bm<small>${chrome.i18n.getMessage("BMDesc")}</small>`]: bookmarkTable,
    [`<span>⭐</span>bm-file<small>${chrome.i18n.getMessage("BMFileDesc")}</small>`]: bookmarkFileArray,
    [`<span>⭐</span>bm-all<small>${chrome.i18n.getMessage("BMAllDesc")}</small>`]: bookmarkArray,
    [`<i class="fas fa-eraser"></i>cls<small>${chrome.i18n.getMessage("CMDCls")}</small>`]: [],
    [`<span>📋</span>list`]: [],
    [`<span>📋</span>ls`]: [],
    [`<i class="fab fa-chrome"></i>chrome`]: {
      [`about<small>${chrome.i18n.getMessage("ChromeAbout")}</small>`]: [],
      [`<span>⭐</span>bookmarks<small>${chrome.i18n.getMessage("ManageBM")}</small>`]: [],
      version: [],
      [`<span>⚙</span>settings`]: [
        "<i class=\"fas fa-language\"></i>languages"
      ],

      [`<i class="fas fa-puzzle-piece"></i>extensions<small>${chrome.i18n.getMessage("MangeChromeExtension")}</small>`]: {
        shortcuts: [],
      },
      [`<i class="fas fa-history"></i>history`]: [],

      media: {
        internals: [],
        engagement: [],
      },

      [`<span>🎮</span>game`]: [`<i class="fas fa-running"></i>dino<small>A small game for you to relax.</small>`]
    },
    [`<i class="fas fa-info-circle" style="color: #0088ff"></i>help`]: [],
    [`<i class="fab fab fa-youtube" style="color: #ff0000"></i>video`]: {
      [`<i class="fas fa-question-circle" style="color: #0088ff"></i>-help<small>${chrome.i18n.getMessage("Help")}</small>`]: [],
      [`<i class=\"fas fa-angle-double-right\"></i>-speed=<small>${chrome.i18n.getMessage("PlaybackRate")}</small>`]: [],
      [`<span>📹</span>-rec<small>${chrome.i18n.getMessage("CMDVideoREC")}</small>`]: [
        "<span>🕹️</span>-controller",
        "<span>🕹️🕷️</span>-controller -debug"
      ]
    },
    [`<i class="fas fa-calculator"></i>=<small>${chrome.i18n.getMessage("CMDArithmeticHint")}</small>`]: [],
  }
  return new Autocomplete(document.querySelector(`div[data-com="autocomplete"]`), autocompleteTable)
}

class CMDHistory extends Array {

  #maxNum
  #curIndex

  /**
   * @param {HTMLInputElement} input
   * @param {Number} maxNum
   * @param {any} items
   * */
  constructor(input, maxNum, ...items) {
    super(...items)
    this.#maxNum = maxNum
    this.#curIndex = 0
    this.#initEventListener(input)
  }

  push(...items) {
    if ((this.length + items.length) <= this.#maxNum) {
      return super.push(...items)
    }

    items.forEach(item => {
      const remain = this.#maxNum - this.length
      let updateIndex = this.#curIndex
      if (remain > 0) {
        updateIndex = this.length
      } else {
        this.#updateIndex(++this.#curIndex)
      }
      this[updateIndex] = item
    })
  }

  #updateIndex(indexNum) {
    if (indexNum >= this.length) {
      this.#curIndex = 0
    } else if (indexNum < 0) {
      this.#curIndex = (this.length - 1)
    } else {
      this.#curIndex = indexNum
    }
  }

  #initEventListener(input) {
    input.addEventListener("keyup", (keyboardEvent) => {
      if (this.length === 0) {
        return
      }

      if (input.parentNode.querySelector(`div [class="autocomplete-items"]`) !== null) {
        return
      }

      let haveMatch = true
      switch (keyboardEvent.key) {
        case "ArrowDown":
          this.#updateIndex(this.#curIndex + 1)
          break

        case "ArrowUp":
          this.#updateIndex(this.#curIndex - 1)
          break

        default:
          haveMatch = false
      }

      if (haveMatch) {
        keyboardEvent.target.value = this[this.#curIndex]
      }
    })
  }
}

(() => {
  // Autocomplete.HighlightColor = "#fae698"
  window.onload = async (a) => {

    // DOM
    const input = document.querySelector(`input`)
    const commitBtn = document.querySelector(`input[type="submit"]`)

    // Obj
    const cmdObj = new CommandCenter(document.getElementById(`msg-area`))
    const cmdHistory = new CMDHistory(input, 20)
    // cmdHistory.push([...Array(100).keys()]) // test push function

    // build autocompleteTable
    await CreateAutocomplete()

    // Event
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

            await new Promise(resolve => setTimeout(resolve, 1)) // wait process done.

            const msgNode = document.getElementById("msg-area")
            if (msgNode) {
              msgNode.scrollTop = msgNode.scrollHeight // scroll to bottom
            }
            cmdHistory.push(input.value)
            input.value = ""
            return
          }
        }
      }

      cmdObj.ShowErrMsg(chrome.i18n.getMessage("UnknownCommand", inputValue), "❌")
      cmdObj.Help()
    }
  }
})()
