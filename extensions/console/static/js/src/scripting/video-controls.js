(() => {
  console.log("Initialize video controls plugin.")
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.name === "change-video-speed") {
      const videoNode = document.querySelector('video')
      if (videoNode) {
        document.querySelector('video').playbackRate = message.speed
        sendResponse({msg:`change playbackRate=${message.speed}`})
        return
      }
      sendResponse({msg:"Video tag does not exist."})
    }
  })
})()
