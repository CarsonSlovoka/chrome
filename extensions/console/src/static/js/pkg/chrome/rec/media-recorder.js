class CanvasRecord {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Number} fps
   * @param {string} mediaType: video/mp4, video/webm, ...
   * */
  constructor(canvas, fps, mediaType) {
    this.canvas = canvas
    const stream = canvas.captureStream(fps) // fps // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
    this.mediaRecorder = new MediaRecorder(stream, { // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
      // audioBitsPerSecond : 128000,
      // videoBitsPerSecond : 2500000,
      // bitsPerSecond:2500000,
      mimeType: mediaType,
    })
    this.chunks = []
  }

  start() {
    this.chunks = [] // clear
    this.mediaRecorder.start() // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start
    console.log(this.mediaRecorder.state)
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
    return new Promise(resolve => {
      this.mediaRecorder.ondataavailable = (event) => {
        this.chunks.push(event.data)
      }
      this.mediaRecorder.onstop = async (event) => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder.mimeType
        })

        /*
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        const dataURI = await new Promise(resolve => {
          reader.onloadend = (event) => {
            resolve(event.target.result)
          }
        })
        resolve(dataURI)
        */
        resolve(URL.createObjectURL(blob)) // blobURL
      }
      this.mediaRecorder.requestData() // trigger ``ondataavailable``  // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/requestData
      this.mediaRecorder.stop()
    })
  }
}


export class RTCMediaRecorder { // real time communicate

  /** @type {HTMLElement} */
  #parentNode

  /** @type {Object} */
  #constraints

  /**
   * @param {HTMLElement} parentNode
   * @param {Number} width
   * @param {Number} height
   * @param {Number} fps
   * @param {boolean} display
   * @param {boolean} debug  show settings and constraint
   * */
  constructor(parentNode,
              {
                width = undefined, height = undefined, fps = 25,
                display = true,
                debug = false,
              }) {
    this.#parentNode = parentNode
    this.#constraints = {
      width, height, fps,
      display,
      debug
    }
  }

  /**
   * @param {Array} desktopCaptureSourceType
   * */
  chooseDesktopMedia(desktopCaptureSourceType = ["screen", "window", "tab", "audio"]) {
    chrome.desktopCapture.chooseDesktopMedia( // https://developer.chrome.com/docs/extensions/reference/desktopCapture/#method-chooseDesktopMedia
      desktopCaptureSourceType,
      (id) => {
        this.#accessToRecord(id)
      }
    )
  }

  dumpOptionsInfo(mediaStream) {
    const videoTrack = mediaStream.getVideoTracks()[0]
    this.log("Track settings:")
    this.log(JSON.stringify(videoTrack.getSettings(), null, 2))
    this.log("Track constraints:")
    this.log(JSON.stringify(videoTrack.getConstraints(), null, 2))
  }

  log(msg) {
    const frag = document.createRange().createContextualFragment(`<pre>${msg}</pre>`)
    this.#parentNode.append(frag)
  }

  async StartRecordingMedia(videoElement = undefined) {
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        // width: {ideal: 600, max: 1920 },
        // height: {ideal: 400, max: 1080 },
        frameRate: this.#constraints.fps,
        cursor: "always" // "opera" support only
      },
      audio: true
    })
    if (this.#constraints.debug) {
      this.dumpOptionsInfo(mediaStream)
    }
    const video = videoElement ?? document.createElement(`video`)
    video.srcObject = mediaStream // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject#supporting_fallback_to_the_src_property
    video.muted = true // otherwise will conflict the device (both sides with voice)
    if (!this.#constraints.display) {
      video.style.visibility = "hidden"
    }

    const [track] = mediaStream.getVideoTracks()
    track.onended = (e) => {
      // Click the stop button, which was created by the system.
      const tracks = mediaStream.getTracks()
      tracks.forEach(track => track.stop()) // stop audio and video
      video.srcObject = null
      video.remove()
    }

    this.#parentNode.append(video)

    const chunks = []
    const videoStream = video.captureStream()
    const mediaRecorder = new MediaRecorder(videoStream, {
      // mimeType : "video/webm",
    })

    mediaRecorder.ondataavailable = e => {
      chunks.push(e.data)
    }

    mediaRecorder.onstop = async (event) => {
      const blob = new Blob(chunks, {
        type: mediaRecorder.mimeType
      })

      const blobURL = URL.createObjectURL(blob)

      const frag = document.createRange().createContextualFragment(`<video controls>
<source src="${blobURL}">
</video>
<div>
<a href="${blobURL}" download="result.webm"><button class="btn btn-primary">result.webm</button></a>
<button id="release" class="ms-3 btn btn-primary">${chrome.i18n.getMessage("ReleaseResource")}</button>
</div>

`)

      frag.querySelector(`button[id="release"]`).onclick = (e) => {
        if (blobURL.startsWith("blob")) {
          URL.revokeObjectURL(blobURL)
        }
      }

      this.#parentNode.append(frag)
    }

    video.onloadedmetadata = (e) => {
      video.width = this.#constraints.width ?? video.clientWidth
      video.height = this.#constraints.height ?? video.clientHeight
      video.play()
      video.controls = true
      mediaRecorder.start()
    }

    video.addEventListener("play", (event) => {
      if (mediaRecorder.state === "inactive") {
        return
      }
      mediaRecorder.resume()
    })
    video.addEventListener("pause", (event) => {
      if (mediaRecorder.state === "inactive") {
        return
      }
      mediaRecorder.pause()
    })

    return mediaRecorder
  }

  static DisplayController(parentNode, isDebugMode) {
    const frag = document.createRange().createContextualFragment(`
<form>
    <fieldset>
      <legend>${chrome.i18n.getMessage("Settings")}</legend>
      <input id="width" type="number" max="9999" placeholder="${chrome.i18n.getMessage("Width")}">
      <input id="height" type="number" max="9999" placeholder="${chrome.i18n.getMessage("Height")}">
      <br>
      <input id="fps" type="number" min="0" class="mt-2" placeholder="${chrome.i18n.getMessage("FPS")}">
      <br>
      <fieldset id="options">
        <input id="debug" type="checkbox"><label>debug (show the information of media)</label><br>
        <input id="display" type="checkbox" checked><label>display</label>
      </fieldset>

      <input type="submit" value="${chrome.i18n.getMessage("Start")}">
    </fieldset>
</form>
    <br>
    <section class="mt-2">
        <video controls></video>
    </section>
    <fieldset>
        <legend>${chrome.i18n.getMessage("Result")}</legend>
        <details id="result" open></details>
    </fieldset>
    `)

    const fieldsetSettings = frag.querySelector(`fieldset`)
    const fieldsetOptions = frag.getElementById(`options`)
    fieldsetOptions.style.display = isDebugMode ? "inherit" : "none"

    const inputWidth = frag.getElementById(`width`)
    const inputHeight = frag.getElementById(`height`)
    const inputFPS = frag.getElementById(`fps`)
    const inputDebug = frag.getElementById(`debug`)
    const inputDisplay = frag.getElementById(`display`)

    const form = frag.querySelector(`form`)
    const video = frag.querySelector("video")

    const resultElem = frag.getElementById(`result`)

    parentNode.append(frag)

    let fps // if undefined will use the default settings
    inputWidth.onchange = e => {
      if (form.checkValidity()) {
        video.width = e.target.value // will change the clientWidth also
      }
    }
    inputHeight.onchange = e => {
      if (form.checkValidity()) {
        video.height = e.target.value
      }
    }
    inputFPS.onchange = e => {
      if (form.checkValidity()) {
        fps = e.target.value
      }
    }

    let debug = false,
      display = true
    inputDebug.onchange = e => debug = e.target.checked
    inputDisplay.onchange = e => display = e.target.checked

    form.onsubmit = async (e) => {
      e.preventDefault()
      fieldsetSettings.disabled = true
      resultElem.querySelectorAll(`*`).forEach(e => e.remove())
      video.muted = true
      video.autoplay = true
      video.controls = true
      resultElem.appendChild(video)

      const rtc = new RTCMediaRecorder(resultElem, {
        width: video.clientWidth, height: video.clientHeight,
        fps, display, debug
      })
      try {
        const mediaRecorder = await rtc.StartRecordingMedia(video)

        mediaRecorder.addEventListener(`stop`, () => {
          fieldsetSettings.disabled = false
        })
      } catch (err) {
        fieldsetSettings.disabled = false
      }
      return false // cancel submit. use the form check the type of field only.
    }
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {Number} fps
   * @param {HTMLCanvasElement} canvas
   * */
  #drawVideo2Canvas(video, fps, canvas = undefined) {
    canvas = canvas ?? document.createElement(`canvas`);
    [canvas.width, canvas.height] = [video.clientWidth, video.clientHeight]
    const ctx = canvas.getContext(`2d`)
    video.addEventListener("play", () => {
      const timeStep = Math.round(1000 / fps)
      const width = canvas.width
      const height = canvas.height
      const recordFunc = () => {
        if (video.paused || video.ended) {
          return
        }
        ctx.drawImage(video, 0, 0, width, height)
        const frame = ctx.getImageData(0, 0, width, height)
        setTimeout(recordFunc, timeStep)
      }
      setTimeout(recordFunc, timeStep)
    })
    return canvas
  }

  #accessToRecord(id) {
    const fps = this.#constraints.fps

    // const supports = navigator.mediaDevices.getSupportedConstraints()
    navigator.mediaDevices.getUserMedia({ // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
      audio: false,
      video: { // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#syntax
        // width: { min: 640, ideal: 1920, max: 1920 }, //  Cannot use both optional/mandatory and specific or advanced constraints.
        mandatory: { // https://github.com/hokein/electron-sample-apps/issues/62
          chromeMediaSource: "desktop",
          chromeMediaSourceId: id,
          /*
          minWidth: this.#constraints.width,
          maxWidth: this.#constraints.width, // 1920
          minHeight: this.#constraints.height,
          maxHeight: this.#constraints.height, // 1080
           */
          minFrameRate: fps,
          maxFrameRate: fps,
        }
      }
    }).then(async (mediaStream) => {
      const video = document.createElement(`video`)
      video.srcObject = mediaStream // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject#supporting_fallback_to_the_src_property
      if (!this.#constraints.display) {
        video.style.visibility = "hidden"
      }
      const canvas = document.createElement(`canvas`)
      // this.#drawVideo2Canvas(video, fps, canvas)
      const canvasREC = new CanvasRecord(canvas, this.#constraints.fps, "video/webm") // ;codecs=vp9

      video.onloadedmetadata = (e) => {
        video.width = this.#constraints.width ?? video.clientWidth
        video.height = this.#constraints.height ?? video.clientHeight
        video.play()
        video.controls = true
        this.#drawVideo2Canvas(video, fps, canvas)
        canvasREC.start()
        video.addEventListener("play", (event) => {
          if (canvasREC.mediaRecorder.state === "inactive") {
            return
          }
          canvasREC.resume()
        })
        video.addEventListener("pause", (event) => {
          if (canvasREC.mediaRecorder.state === "inactive") {
            return
          }
          canvasREC.pause()
        })
      }

      /*
      // const allTracks = mediaStream.getTracks()
      const [track] = mediaStream.getVideoTracks()
      track.applyConstraints({
          width: {min: 1000, ideal: 1920, max: 1920},
          height: {min: 800, ideal: 1080},
        }
      )
       */

      mediaStream.oninactive = async () => { // same as ``track.onended  = (e) => {}``
        const blobURL = await canvasREC.stop()

        const range = document.createRange()
        const frag = range.createContextualFragment(`<video crossorigin="anonymous" controls>
<source src="${blobURL}" type="video/mp4">
</video>
<div>
<a href="${blobURL}" download="result.webm"><button class="btn btn-primary">result.webm</button></a>
<button data-name="release" class="ms-3 btn btn-primary">${chrome.i18n.getMessage("ReleaseResource")}</button>
</div>`)
        // frag.querySelector(`source`).type = 'video/webm' //canvasREC.mediaRecorder.mimeType
        /*
        frag.querySelector(`video`).onloadeddata = (e) => {
          if (blobURL.startsWith("blob")) {
            // URL.revokeObjectURL(blobURL) // If free the memory, then you can't play anymore.
          }
        }
         */

        frag.querySelector(`button[data-name="release"]`).onclick = (e) => {
          if (blobURL.startsWith("blob")) {
            URL.revokeObjectURL(blobURL)
          }
        }

        this.#parentNode.append(frag)
        video.srcObject = null
        video.remove()
      }
      this.#parentNode.append(video)
      // await new Promise(resolve => setTimeout(()=>{resolve()}, 2000))
    }).catch(err => {
      alert(err.message)
    })
  }
}


