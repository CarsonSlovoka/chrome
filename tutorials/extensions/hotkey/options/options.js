class Hotkey {

  /**
   * @param {string} key
   * @param {boolean} ctrlKey
   * @param {boolean} shiftKey
   * @param {boolean} altKey
   * @param {boolean} metaKey
   * */
  constructor({key = "", ctrlKey = false, shiftKey = false, altKey = false, metaKey = false}) {
    this.key = key
    this.ctrlKey = ctrlKey
    this.shiftKey = shiftKey
    this.altKey = altKey
    this.metaKey = metaKey
    this.disabled = true
  }

  /**
   * @param {Hotkey} hotkey
   * */
  static GetInfo = (hotkey) => {
    const ctrlName = hotkey.ctrlKey ? "Ctrl" : ""
    const shiftName = hotkey.shiftKey ? "Shift" : ""
    const altName = hotkey.altKey ? "Alt" : ""
    const metaKeyName = hotkey.metaKey ? "metaKey" : ""
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
    return [
      metaKeyName, ctrlName, shiftName, altName,
      ["Control", "Alt", "Shift", "Meta"].includes(hotkey.key) ? "" : hotkey.key
    ]
      .filter(e => e !== "").join("+")
  }
}

const DefaultConfig = {
  keyboard: {
    paste: new Hotkey({})
  }
};

async function InitConfigPanel() {
  const oldConfig = await new Promise(resolve => {
    chrome.storage.sync.get("config", ({config}) => {
      resolve(config)
    })
  })
  const config = oldConfig ?? DefaultConfig

  const divHotkey = document.querySelector(`#div-hotkey`)
  for (const [keyName, curHotkey] of Object.entries(config.keyboard)) {
    const orgHotkey = JSON.parse(JSON.stringify(curHotkey)) // copy object
    const placeholder = Hotkey.GetInfo(curHotkey)
    const elemString = [
      `<label class="col-md-2">${keyName}</label>`,
      `<input class="ms-2" type="text" aria-label="${keyName}" placeholder="${placeholder}" readonly disabled>`,
      `<i class="fas fa-pen ms-2 hover-blue"></i>`,
      `<i class="fas fa-undo ms-2 hover-green"></i>`,
      `<i class="fas fa-times ms-2 hover-dark-red"></i>`,
      `<br>`
    ].join("")
    const frag = document.createRange()
      .createContextualFragment(elemString);
    const editBtn = frag.querySelector(`i[class^="fas fa-pen"]`)
    const undoBtn = frag.querySelector(`i[class^="fas fa-undo"]`)
    const clearBtn = frag.querySelector(`i[class^="fas fa-times"]`)
    const input = frag.querySelector(`input`)

    editBtn.onclick = () => {
      input.disabled = false
      input.focus()

      const controller = new AbortController()
      input.addEventListener("mouseleave", (e) => {
        input.disabled = true
        controller.abort()
      }, {ocee: true})

      document.addEventListener("keydown", (e) => {
        e.preventDefault()
        const inputHotkey = new Hotkey({key, ctrlKey, shiftKey, altKey, metaKey} = e)
        input.value = Hotkey.GetInfo(inputHotkey)
        Object.assign(curHotkey, inputHotkey) // update
        curHotkey.disabled = false
      }, {
        once: false,
        signal: controller.signal,
      })
    }
    undoBtn.onclick = () => {
      Object.assign(curHotkey, orgHotkey)
      input.value = Hotkey.GetInfo(orgHotkey)
    }
    clearBtn.onclick = () => {
      Object.assign(curHotkey, new Hotkey({}))
      input.value = " " // If you set "" it will use default value (may not equal to empty string) since the element is under the form.
    }
    divHotkey.append(frag)
  }
  return config
}


(async () => {
  const config = await InitConfigPanel()
  const logElem = document.querySelector(`#log`)
  const form = document.querySelector(`form`)
  form.onsubmit = async (e) => {
    e.preventDefault()
    logElem.innerHTML += `<span class="text-success">${JSON.stringify({"msg": "Saved successfully"})}</span>`
    setTimeout(() => {
        logElem.innerHTML = ""
      },
      2000
    )
    chrome.storage.sync.set({config})
    return false
  }
})()
