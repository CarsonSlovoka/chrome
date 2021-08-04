(()=>{
  chrome.commands.onCommand.addListener((cmdName) => {
    switch (cmdName) {
      case "show-alert":
        chrome.storage.sync.set({msg: cmdName}) // You can not get the context on the function, so using the Storage API to help you. // https://developer.chrome.com/docs/extensions/reference/storage/
        chrome.tabs.query({active: true, currentWindow: true}).then(([tab])=>{
          const para = "Hello world!!!"
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: (args) => {
              alert(args)
              chrome.storage.sync.get(['msg'], ({msg})=> {
                console.log(`${msg}`)
                alert(`Command: ${msg}`)
              })
            },
            args: [para]
          })
        })
        break
      default:
        alert(`Unknown Command: ${cmdName}`)
    }
  })
})()
