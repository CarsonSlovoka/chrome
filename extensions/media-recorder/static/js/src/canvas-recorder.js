class CanvasRecord {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Number} fps
   * @param {string} mediaType: video/mp4, video/webm, ...
   * */
  constructor(canvas, fps, mediaType) {
    this.canvas = canvas
    const stream = canvas.captureStream(25) // fps // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
    this.mediaRecorder = new MediaRecorder(stream, { // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
      mimeType: mediaType
    })

    this.chunks = []
    this.mediaRecorder.ondataavailable = (event) => {
      this.chunks.push(event.data)
    }
    this.mediaRecorder.onstop = async (event) => {
      const blob = new Blob(this.chunks, {
        type: this.mediaRecorder.mimeType
      })
      // URL.createObjectURL(blob) // 這個只能沒辦法傳送到chrome的extension之中

      const reader = new FileReader()
      reader.readAsDataURL(blob)
      const dataURI =  await new Promise(resolve => {
        reader.onloadend = (event) => {
          resolve(event.target.result)
        }
      })

      /*  executeScript 之中沒辦法直接調用
      chrome.tabs.getCurrent((tab)=>{ // https://stackoverflow.com/a/68148611/9935654
        chrome.tabs.sendMessage(tab.id, {event: 'finished-REC', dataURI})
      })
       */

      /*
      chrome.tabs.query({currentWindow: true, active: true }, async (tabs) => {
        await chrome.tabs.sendMessage(tab.id, {event: 'finished-REC', dataURI})
      })
       */



      // 👇 Below is a test code for you to know you are successful. Also, you can download it if you wish.
      /*
      const url = URL.createObjectURL(blob)
      const video = document.createElement('video')
      video.src = url
      video.onend = (e) => {
        URL.revokeObjectURL(this.src);
      }
      video.controls = true
      document.querySelector("body").append(video)

       */
      console.log(dataURI.slice(0, 30))

      chrome.runtime.onMessage.addListener((media, sender, sendResponse) => {
        if (media.event === 'finished-REC') {
          sendResponse({dataURI, mimeType: "video/webm"})
        }
      })
    }
  }

  start() {
    this.chunks = [] // clear
    this.mediaRecorder.start() // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
    console.log(this.mediaRecorder.state) // recording // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/state
  }

  pause() {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/pause
    this.mediaRecorder.pause()
    console.log(this.mediaRecorder.state)
  }

  resume() {
    this.mediaRecorder.resume()
    console.log(this.mediaRecorder.state)
  }

  stop() {
    this.mediaRecorder.requestData() // trigger ``ondataavailable``  // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/requestData
    this.mediaRecorder.stop()
    console.log(this.mediaRecorder.state)
  }
}

class Video2Canvas {
  /**
   * @description Create a canvas and save the frame of the video that you are giving.
   * @param {HTMLVideoElement} video
   * @param {Number} fps
   * @see https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_manipulation#video_manipulation
   * */
  constructor(video, fps) {
    this.video = video
    this.fps = fps
    this.canvas = document.createElement("canvas");
    [this.canvas.width, this.canvas.height] = [video.width, video.height]
    document.querySelector("body").append(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.initEventListener()
  }

  initEventListener() {
    this.video.addEventListener("play", () => {
      const timeStep = Math.round(1000 / this.fps)
      const width = this.canvas.width
      const height = this.canvas.height
      const recordFunc = () => {
        if (this.video.paused || this.video.ended) {
          return
        }
        this.ctx.drawImage(this.video, 0, 0, width, height)
        const frame = this.ctx.getImageData(0, 0, width, height)
        setTimeout(recordFunc, timeStep)
      }
      setTimeout(recordFunc, timeStep)
    })
  }
}

function main() {
  const video = document.querySelector("video")
  video.width = 480
  video.height = 700
  const v2c = new Video2Canvas(video, 60)
  const canvasRecord = new CanvasRecord(v2c.canvas, 25, 'video/webm')
  canvasRecord.start()

  // 👇 video event
  v2c.video.addEventListener("play", (event) => {
    if (canvasRecord.mediaRecorder.state === "inactive") {
      return
    }
    canvasRecord.resume()
  })

  v2c.video.addEventListener("pause", (event) => {
    if (canvasRecord.mediaRecorder.state === "inactive") {
      return
    }
    canvasRecord.pause()
  })

  // 👇 chrome event
  /*
  chrome.runtime.onMessage.addListener((media, sender, sendResponse) => {
    // https://www.w3schools.com/tags/ref_av_dom.asp
    if (media.event === "start-REC" && canvasRecord.mediaRecorder.state === "inactive") {
      canvasRecord.start()
    }
  })
   */

  chrome.runtime.onMessage.addListener((media, sender, sendResponse) => {
    if (media.event === "video-resume") {
      v2c.video.play()
    }
  })

  chrome.runtime.onMessage.addListener((media, sender, sendResponse) => {
    if (media.event === 'video-pause') {
      v2c.video.pause()
    }
  })

  chrome.runtime.onMessage.addListener(async (media, sender, sendResponse) => {
    if (media.event === 'stop-REC') {
      canvasRecord.stop()
    }
  })
}

(() => {
  console.log("add-in")
  chrome.runtime.onMessage.addListener((media, sender, sendResponse) => {
    // https://www.w3schools.com/tags/ref_av_dom.asp
    if (media.event === "start-REC") {
      alert("start-REC")
      main()
    }
  })
})()
