(() => {
  window.onload = () => {
    const log = document.querySelector(`#log`)
    document.querySelector(`button`).onclick = async () => {
      const tabs = await chrome.tabs.query({})
      tabs.forEach(tab => {
        /* chrome.tabs.sendMessage: When you add callback parameters, it will return undefined.
        if you want to handle the error by yourself, you should omit this parameter, which will return the `Promise`.

        // 👇 you can't handle the error, such as: "Could not establish connection. Receiving end does not exist"
        chrome.tabs.sendMessage(tab.id, {event: "get-thumbnail", parentID: tab.id}, (response) => {
          if (response !== undefined) {
            // const info = {title: response.title}
            // JSON.stringify(info) + `<img alt="${info.title}" src="${response.imageURI}">`
            log.innerHTML += JSON.stringify(response) + `<br>`
          }
        })
         */

        const promise = chrome.tabs.sendMessage(tab.id, {event: "get-thumbnail", parentID: tab.id})
        promise.then((response) => {
          if (response !== undefined) {
            // const info = {title: response.title}
            // JSON.stringify(info) + `<img alt="${info.title}" src="${response.imageURI}">`
            log.innerHTML += JSON.stringify(response) + `<br>`
          }
        }).catch(e=>{
          console.log(tab.url, e)
        })
      })
    }
  }
})()
