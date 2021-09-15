(() => {
  chrome.windows.getCurrent((tabWindow) => { // https://developer.chrome.com/docs/extensions/reference/windows/#type-Window
    const targetURL = 'templates/console.html'
    chrome.windows.getAll({populate: true, windowTypes: ['popup']}, (windowArray) => {
      const queryURL = `chrome-extension://${chrome.runtime.id}/${targetURL}`
      const targetWindow = windowArray.find(item => item.tabs[0].url === queryURL) // ❗ make sure manifest.json => permissions including "tabs"
      if (windowArray.length > 0 && targetWindow !== undefined) {
        // Show the window that you made before.
        chrome.windows.update(targetWindow.id, {focused: true}) // https://developer.chrome.com/docs/extensions/reference/windows/#method-update
        return
      }

      // Otherwise, Create
      const width = Math.round(tabWindow.width * 0.5)
      const height = Math.round(tabWindow.height * 0.75)
      const left = Math.round((tabWindow.width - width) * 0.5 + tabWindow.left) // tabWindow.left? The distance between the screen left to the browser left.
      const top = Math.round((tabWindow.height - height) * 0.5 + tabWindow.top)

      chrome.windows.create( // https://developer.chrome.com/docs/extensions/reference/windows/#method-create
        {
          focused: true,
          url: targetURL,
          type: 'popup', // https://developer.chrome.com/docs/extensions/reference/windows/#type-WindowType
          width, height,
          left, top
        },
        (subWindow) => {
        }
      )
    })
  })
})()


