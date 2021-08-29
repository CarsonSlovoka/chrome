window.onload = () => {
  const frag = document.createRange().createContextualFragment(`
<section><h3 class="white-30"></h3></section>
<section>
  <button class="btn-start">Start</button>
  <button class="btn-resumeOrPaused">Pause</button>
  <button class="btn-stop">Stop</button>
  <button class="btn-result">Show result</button>
</section>
`)

  /*
  * <section>
    <canvas></canvas>
</section>
  * */

  const titleNode = frag.querySelector(`h3`)
  // const canvas = frag.querySelector(`canvas`)
  const btnStart = frag.querySelector(`button[class="btn-start"]`)
  const btnStop = frag.querySelector(`button[class="btn-stop"]`)
  const btnPlayOrPaused = frag.querySelector(`button[class="btn-resumeOrPaused"]`)
  const btnResult = frag.querySelector(`button[class="btn-result"]`)

  let lastTabID = 0
  chrome.tabs.onActivated.addListener(({tabId, windowId}) => { // https://stackoverflow.com/a/68632591/9935654
    lastTabID = tabId
    chrome.tabs.get(lastTabID, (tab) => {
      titleNode.innerText = tab.title
    })
  })

  btnStop.disabled = true
  btnPlayOrPaused.disabled = true

  btnStart.onclick = async () => {
    btnStart.disabled = true
    await chrome.tabs.sendMessage(lastTabID, {event: 'start-REC'})
    await chrome.tabs.sendMessage(lastTabID, {event: 'video-resume'})
    btnStop.disabled = false
    btnPlayOrPaused.disabled = false
  }

  btnPlayOrPaused.onclick = async (event) => {
    const target = event.target
    if (target.innerText === "Pause") {
      await chrome.tabs.sendMessage(lastTabID, {event: 'video-pause'})
      target.innerText = "Play"
    } else {
      await chrome.tabs.sendMessage(lastTabID, {event: 'video-resume'})
      btnPlayOrPaused.innerText = "Pause"
    }
  }

  btnStop.onclick = () => {
    chrome.tabs.sendMessage(lastTabID, {event: 'stop-REC'})
  }

  btnResult.onclick = () => {
    chrome.tabs.sendMessage(lastTabID, {event: 'finished-REC'}, ({dataURI, mimeType}) => {
      btnStop.disabled = true
      btnPlayOrPaused.disabled = true

      const range = document.createRange()
      const frag = range.createContextualFragment(`<video crossorigin="anonymous" controls>
<source/>
</video>`)
      const source = frag.querySelector(`source`)
      source.src = dataURI
      source.type = mimeType
      source.onend = (e) => {
        if (this.src.startsWith("blob")) {
          URL.revokeObjectURL(this.src)
        }
      }
      document.querySelector(`section[data-name="message"]`).append(frag)

      btnStart.disabled = false
    })
  }

  document.querySelector('body').append(frag)
}
