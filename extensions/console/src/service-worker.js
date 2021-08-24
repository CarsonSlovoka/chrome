(() => {
  chrome.runtime.onInstalled.addListener(() => {
    console.log(`Install successfully.`)
  })
})()
