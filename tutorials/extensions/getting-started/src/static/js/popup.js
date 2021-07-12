class BGHandler {
  /**
   * @param {HTMLElement} targetNode
   */
  constructor(targetNode) {
    this.node = targetNode

    // Initialize button with users' preferred color
    chrome.storage.sync.get("color", ({color}) => {
      this.node.style.backgroundColor = color
    })

    // Add another button to restore to the original color.
    const btn = document.createElement("button")
    btn.title = "restore"
    btn.onclick = async () => {
      await resetBGColor(this)
    }
    // this.node.insertAdjacentHTML("afterend", btn.outerHTML) // 這沒辦法認得onclick的內容，他只能純字串
    this.node.parentNode.insertBefore(btn, this.node.nextSibling)
  }

  async getTab() {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true}) // https://developer.chrome.com/docs/extensions/reference/tabs/#get-the-current-tab
    return tab
  }

  async injectScript(func) {
    const tab = await this.getTab()
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      // 人家已經有說，這個function不會銜接任何的上下文，換句話說您傳甚麼參數進去都沒有用，但他也有推薦解決方法: You can work around this by using the Storage API or by passing messages. // https://developer.chrome.com/docs/extensions/reference/storage/
      // function: (func, funOptions)=>{func(funOptions)}, // This function will be executed in the context of injection target. However, this will not carry over any of the current execution context of the function. As such, bound parameters (including the this object) and externally-referenced variables will result in errors. For instance, the following code will not work, and will throw a ReferenceError because color is undefined when the function executes: // https://developer.chrome.com/docs/extensions/reference/scripting/#runtime-functions
      function: func
    })
  }

  ListenClickEvent(func) {
    this.node.addEventListener("click", async () => {
      await this.injectScript(func)
    })
  }
}

async function resetBGColor(bgHandler) {
  // tab.title
  // tab.pageName = '' // tab本身是一個object所以可以直接設定
  // https://developer.chrome.com/docs/extensions/reference/commands/
  await bgHandler.injectScript(() => {
    document.body.style.backgroundColor = "initial"
  })
}

function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({color}) => { // 這邊是一個技巧 原本會寫 (result)=>{result.color}，這裡直接放一個Object，所以他會直接展開，並且{color: color}，所以裡面的color就已經知道是甚麼了
    document.body.style.backgroundColor = color;
  })
}

(() => {
  const messageApp = chrome.i18n.getMessage("app")
  console.log(messageApp)
  const bgHandler = new BGHandler(document.getElementById("changeColor"))
  bgHandler.ListenClickEvent(setPageBackgroundColor)

  chrome.commands.onCommand.addListener((cmdName) => {
    switch (cmdName) {
      case "show-alert":
        /*
        chrome.storage.sync.set({key: value}, function () {
          console.log('Value is set to ' + value);
        });

        chrome.storage.sync.get(['key'], function (result) {
          console.log('Value currently is ' + result.key);
        });
         */

        // window.alert(`Command: ${cmdName}`) // 這是顯示在popup.html
        // console.log("...") // 這也是在popup.html的視窗中

        const msg = cmdName
        chrome.storage.sync.set({msg})
        bgHandler.injectScript(() => {
          chrome.storage.sync.get(['msg'], ({msg})=> {
            console.log(`Command: ${msg}`)
            alert(`Command: ${msg}`)
          })
        })
        break
      case "undo":
        new Promise(resolve => {
          resolve(resetBGColor(bgHandler))
        }).then()
        break
      default:
        alert(`Unknown Command: ${cmdName}`)
    }
  })
})()
