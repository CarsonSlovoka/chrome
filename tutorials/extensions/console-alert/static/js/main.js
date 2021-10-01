(() => {
  chrome.commands.onCommand.addListener((cmdName) => {
    switch (cmdName) {
      case "show-alert":
        const myObj = {
          msg: "Hi",
          myNum: 1,
          myFunc: () => {
            return "hi"
          },
          myFunc2: function () {
            return ""
          }
        }

        chrome.storage.sync.set({msg: cmdName, myObj}) // You can not get the context on the function, so using the Storage API to help you. // https://developer.chrome.com/docs/extensions/reference/storage/
        chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
          const para1 = "Hello world!!!"
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: (para0, para1, para2MyObj) => {
              console.log(para0) // "one"
              console.log(para1) // "Hello world"
              console.log(JSON.stringify(para2MyObj)) // {msg: 'Hi', myNum: 1} // myFunc and myFunc2 are missing. You can't get the variable if its type is function.
              chrome.storage.sync.get(['msg', "myObj"], ({msg, myObj}) => {
                console.log(`${msg}`)
                console.log(JSON.stringify(myObj)) // {"msg":"Hi","myNum":1}
                alert(`Command: ${msg}`)
              })
            },
            args: ["one", para1, myObj]
          })
        })
        break
      default:
        alert(`Unknown Command: ${cmdName}`)
    }
  })
})()
