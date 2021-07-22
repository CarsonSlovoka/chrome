class CSRFError extends Error {}

(() => {
  chrome.tabs.query({active: true, currentWindow: true}).then(async ([tab]) => {
    const iconURL = tab.favIconUrl
    import("../pkg/svg2png.js").then(async ({SVG2IMG, Canvas})=>{ // dynamic import https://stackoverflow.com/a/68472702/9935654
      const mainNode = document.querySelector(`main`)
      for (const iconSize of [16, 32, 48, 128]) {
        const canvas = new Canvas(mainNode, iconSize, iconSize)
        const svg2img = new SVG2IMG(canvas.canvas, iconURL, {quality:"high"})
        await svg2img.Build(mainNode, `${canvas.canvas.width}.png`) // ctx.drawImage mya occur error: has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
        // await new Promise(resolve => setTimeout(resolve, 250))
      }
    }).then(()=>{
      const canvas = document.querySelector(`a[data-loadok="true"]`)
      if (canvas === null) {
        throw new CSRFError("has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.")
      }
    })
      .catch(err=>{
        const msgNode = document.getElementById("msg")
        msgNode.hidden = false
        const range = document.createRange()
        const frag = range.createContextualFragment(`
        <p class="dark-red">${err.message}</p>
        <p>🐬<span class="purple bg-light-green">Don't worry. You could visit the <a href="${iconURL}"  target="_blank">URL</a> to download.</span></p>
        `)
        msgNode.querySelector(`div`).append(frag)
    })
  })
})()
