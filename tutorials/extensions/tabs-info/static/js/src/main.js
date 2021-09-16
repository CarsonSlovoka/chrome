(() => {
  window.onload = () => {
    const log = document.querySelector(`#log`)
    document.querySelector(`button`).onclick = async () => {
      const tabs = await chrome.tabs.query({})
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {event: "get-thumbnail", parentID: tab.id}, (response) => {
          if (response !== undefined) {
            // const info = {title: response.title}
            // JSON.stringify(info) + `<img alt="${info.title}" src="${response.imageURI}">`
            log.innerHTML += JSON.stringify(response) + `<br>`
          }
        })
      })
    }
  }
})()
