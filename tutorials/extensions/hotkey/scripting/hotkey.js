function IsSameKey(key1, key2) {
  const compareList = ["key", "ctrlKey", "shiftKey", "altKey", "metaKey"]
  for (const curAttr of compareList) {
    if (key1[curAttr] !== key2[curAttr]) {
      return false
    }
  }
  return true
}

(async () => {
  const config = await new Promise(resolve => {
    chrome.storage.sync.get("config", ({config}) => {
      resolve(config)
    })
  })

  if (config === undefined) {
    console.error("Your hotkey list is empty. Please set the hotkey on the optional page.")
    return
  }
  console.log("hotkey is ready.")
  window.addEventListener("load", () => {
    document.addEventListener("keydown", async (keyboardEvent) => {

      const filterHotkey = Object.fromEntries(
        Object.entries(config.keyboard).filter(([key, hotkey]) => {
          const key2 = {key, ctrlKey, altKey, shiftKey, metaKey} = keyboardEvent
          return IsSameKey(hotkey, key2)
        })
      )

      for (const [actionName, hotkey] of Object.entries(filterHotkey)) {
        keyboardEvent.preventDefault()
        switch (actionName) {
          case "paste":
            const pasteData = await navigator.clipboard.readText()
            document.execCommand('insertText', false, pasteData)
            break
          default:
            document.dispatchEvent(actionName)
        }
      }
    })
  })
})()
