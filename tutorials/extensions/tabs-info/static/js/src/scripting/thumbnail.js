console.log("Initialize get thumbnail plugin.")

/*
chrome.tabs.captureVisibleTab(null, {format:"jpeg"},
  (imageURI) => {
    sendResponse({imageURI})
  }
)
 */

window.addEventListener(`load`, () => {
  chrome.runtime.onMessage.addListener( (media, sender, sendResponse) => {
    if (media.event === 'get-thumbnail') {
      const targetID = media.parentID // where the result putting.

      /* NO PERMISSION TO USE THE FUNCTION (chrome.tabs) ON THE "content_scripts"
      const capturing = chrome.tabs.captureVisibleTab(targetID, {
        format: "jpeg", // png
        // quality: 75, // 0~100 integer (for jpeg use only)
      })
      capturing.then((imageURI)=>{
        sendResponse({title: document.title, imageURI})
      }, (error)=>{
        console.log(`Error: ${error}`)
      })
      return true

       */
      sendResponse({title: document.title, imageURL:""})
    }
  })
})
