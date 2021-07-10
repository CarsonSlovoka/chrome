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
      const tab = await this.getTab()
      // tab.title
      // tab.pageName = '' // tab本身是一個object所以可以直接設定
      // https://developer.chrome.com/docs/extensions/reference/commands/
      this.injectScript(tab, ()=>{
        document.body.style.backgroundColor = "initial"
      })
    }
    // this.node.insertAdjacentHTML("afterend", btn.outerHTML) // 這沒辦法認得onclick的內容，他只能純字串
    this.node.parentNode.insertBefore(btn, this.node.nextSibling)
  }

  async getTab() {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true}) // https://developer.chrome.com/docs/extensions/reference/tabs/#get-the-current-tab
    return tab
  }

  injectScript(tab, func) {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: func,
    })
  }

  ListenClickEvent(func) {
    this.node.addEventListener("click", async () => {
      const tab = await this.getTab()
      this.injectScript(tab, func)
    })
  }
}

function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({color}) => { // 這邊是一個技巧 原本會寫 (result)=>{result.color}，這裡直接放一個Object，所以他會直接展開，並且{color: color}，所以裡面的color就已經知道是甚麼了
    document.body.style.backgroundColor = color;
  })
}

(() => {
  const bgHandler = new BGHandler(document.getElementById("changeColor"))
  bgHandler.ListenClickEvent(setPageBackgroundColor)
})()
