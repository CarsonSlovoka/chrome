export class SVG2IMG {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string | Blob} src "http://.../xxx.svg"  or "data:image/svg+xml;base64,${base64}" or Blob
   * @param {"high" | "low" | "medium"} quality
   * */
  constructor(canvas, src, {quality=undefined}) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d")
    quality ? this.ctx.imageSmoothingQuality = quality : "" // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingQuality
    this.src = src
    this.addTextList = []
  }

  /**
   * @param {HTMLElement} node
   * @param {string} mediaType: https://en.wikipedia.org/wiki/Media_type#Common_examples_%5B10%5D
   * @see https://en.wikipedia.org/wiki/List_of_URI_schemes
   * */
  static Convert2URIData(node, mediaType = 'data:image/svg+xml') {
    const base64 = btoa(node.outerHTML)
    return `${mediaType};base64,${base64}`
  }

  /**
   * @param {string} text
   * @param {int} x
   * @param {int} y
   * @param {"stroke"|"fill"} mode
   * @param {string} size, "30px"
   * @param {string} font, example: "Arial"
   * @param {string} color, example: "#3ae016" or "yellow"
   * @param {int} alpha, 0.0 (fully transparent) to 1.0 (fully opaque) // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors#transparency
   * */
  AddText(text, x, y, {mode = "fill", size = "32px", font = "Arial", color = "black", alpha = 1.0}) {
    const drawFunc = (text, x, y, mode, font) => {
      return () => {
        const ctx = this.ctx
        const originAlpha = ctx.globalAlpha
        ctx.globalAlpha = alpha
        ctx.font = `${size} ${font}`

        switch (mode) {
          case "fill":
            ctx.fillStyle = color
            ctx.fillText(text, x, y)
            break
          case "stroke":
            ctx.strokeStyle = color
            ctx.strokeText(text, x, y)
            break
          default:
            throw Error(`Unknown mode:${mode}`)
        }
        ctx.globalAlpha = originAlpha
      }
    }
    this.addTextList.push(drawFunc(text, x, y, mode, font))
  }

  /**
   * @description When the build is finished, you can click the filename to download the PNG or mouse enters to copy PNG to the clipboard.
   * */
  async Build(parentNode, filename = "download.png") {
    const img = new Image(/*this.canvas.width, this.canvas.height*/)
    img.src = this.src instanceof Blob ? URL.createObjectURL(this.src) : this.src
    img.crossOrigin = "anonymous" // Fixes: Tainted canvases may not be exported

    await new Promise(resolve=>{
      img.onload = (event) => {
        const target = event.target
        if (target.src.startsWith("blob")) {
          URL.revokeObjectURL(target.src) // free memory
        }
        this.ctx.drawImage(target, 0, 0, this.canvas.width, this.canvas.height)

        for (const drawTextFunc of this.addTextList) {
          drawTextFunc()
        }

        const a = document.createElement('a')
        a.dataset.loadok = "true" // data-loadok
        parentNode.append(a)
        a.innerText = filename
        a.download = filename

        const quality = 1.0
        a.href = this.canvas.toDataURL("image/png", quality)
        a.append(this.canvas)
        resolve()
      }
      setTimeout(resolve, 125)
    })

    this.canvas.onmouseenter = (event) => {
      document.featurePolicy.allowedFeatures() // Fixes: DOMException: The Clipboard API has been blocked because of a permissions policy applied to the current document
      this.ctx.globalCompositeOperation = "destination-over" // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation // https://www.w3schools.com/tags/canvas_globalcompositeoperation.asp
      this.ctx.fillStyle = "rgb(255,255,255)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({'image/png': blob})])) // copy to clipboard // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/clipboard
    }
  }
}

export async function Src2Blob(src) {
  const response = await fetch(src)

  if (!response.ok) {
    const errMsg = await response.text()
    throw Error(`${response.statusText} (${response.status}) | ${errMsg} `)
  }
  return await response.blob()
}

export class Canvas {
  /**
   * @description for do something like that: ``<canvas width="" height=""></>canvas>``
   **/
  constructor(parentNode, w, h) {
    const canvas = document.createElement("canvas")
    parentNode.append(canvas)
    this.canvas = canvas;
    [this.canvas.width, this.canvas.height] = [w, h]
  }
}
