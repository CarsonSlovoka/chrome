// https://stackoverflow.com/questions/19758028/chrome-extension-get-dom-content

(() => {
  chrome.windows.getCurrent((tabWindow) => { // https://developer.chrome.com/docs/extensions/reference/windows/#type-Window
    const targetURL = 'templates/control.html'
    chrome.windows.getAll({populate: true, windowTypes: ['popup']}, (windowArray) => {
      const queryURL = `chrome-extension://${chrome.runtime.id}/${targetURL}`
      const targetWindow = windowArray.find(item => item.tabs[0].url === queryURL)
      if (windowArray.length > 0 && targetWindow !== undefined) {
        // Show the window that you made before.
        chrome.windows.update(targetWindow.id, {focused: true})
        return
      }

      // Otherwise, Create
      const width = Math.round(tabWindow.width * 0.5)
      const height = Math.round(tabWindow.height * 0.75)
      const left = Math.round((tabWindow.width - width) * 0.5 + tabWindow.left)
      const top = Math.round((tabWindow.height - height) * 0.5 + tabWindow.top)

      chrome.windows.create(
        {
          focused: true,
          url: targetURL,
          type: 'popup',
          width, height,
          left, top
        },
        (subWindow) => {
        }
      )
    })
  })


  chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {

    chrome.scripting.executeScript({ // https://stackoverflow.com/q/66772626/9935654
        target: {tabId: tab.id},
        files:["/static/js/src/canvas-recorder.js"],
        // function: () => {},
        // args: [],
      },
      // (para) => {} // callback
    )
  })
})()
