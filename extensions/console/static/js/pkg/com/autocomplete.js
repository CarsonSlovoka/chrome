/**
 * Author: Carson Tseng
 * Date: 2021/08/07
 * */

export class Autocomplete {

  static HighlightColor = "#ffce43"

  /** @type {Element} */
  #rootNode

  /** @type {HTMLInputElement} */
  #input

  /** @type {string} */
  #sep

  /** @type {Object} */
  #dataTable

  /** @type {Number} */
  #curFocus

  /**
   * @param {Element} rootNode
   * @param {Object|Array} dataTable
   * */
  constructor(rootNode, dataTable, sep = "🚧") {
    if (!rootNode.getAttribute("data-com").startsWith("autocomplete")) {
      throw new Error(`please set the data-com="autocomplete"`)
    }
    rootNode.classList.add("autocomplete")
    this.#rootNode = rootNode
    this.#input = this.#rootNode.querySelector(`input`) ?? this.#createInputElement()
    this.#sep = sep

    Object.defineProperty(this, "input", {
      get() {
        return this.#input
      }
    })

    this.#dataTable = dataTable
    this.#curFocus = 0

    this.#initInputEvent()

    // execute a function when someone clicks in the document
    document.addEventListener("click", (e) => {
      if (e.target !== this.#input) {
        this.closeAllLists()
      }
    })
  }

  static InsertStyleSheet() {
    const range = document.createRange()
    const frag = range.createContextualFragment(`
<style>
* {box-sizing: border-box;}

.autocomplete {
  position: relative;
  display: inline-block;
}

input {
  border: 1px solid transparent;
  background-color: #f1f1f1;
  padding: 10px;
  font-size: 16px;
}

input[type=submit] {
  background-color: DodgerBlue;
  color: #fff;
  cursor: pointer;
}

.autocomplete-items {
  position: absolute;
  border: 1px solid #d4d4d4;
  border-bottom: none;
  border-top: none;
  z-index: 99;
  top: 100%;
  left: 15px;
  width: 40vw;
  max-width: 600px;
}

.autocomplete-items div {
  padding: 10px;
  cursor: pointer;
  background-color: #fff;
  border-bottom: 1px solid #d4d4d4;
}

.autocomplete-items div:hover {
  background-color: #e9e9e9;
}

.autocomplete-active {
  background-color: DodgerBlue !important;
  color: #ffffff;
}

.highlight {
  background-color: ${Autocomplete.HighlightColor};
}
</style>
`
    )
    document.querySelector("head").append(frag)
  }

  static BuildAllTable() {
    document.querySelectorAll(`div[data-com="autocomplete-auto-build"]`).forEach(
      targetNode => {
        let dataTable = []
        if (targetNode.dataset.dataobj) {
          dataTable = JSON.parse(targetNode.dataset.dataobj)
        } else if (targetNode.dataset.dataarray) {
          dataTable = targetNode.dataset.dataarray.split(",").map(e => e.trim())
        }
        new Autocomplete(targetNode, dataTable)
      }
    )
  }


  /**
   * @param {string} htmlText <i class="..."></i>country => country
   * */
  static #getItemDesc(htmlText) {
    const match = htmlText.match(/.(?<desc><.*>.*<\/[a-z]*>)/i) // https://regex101.com/r/toi5II/2
    if (match) {
      return match.groups.desc ?? ""
    }
    return ""
  }

  static #getItemIcon(htmlText) {
    const match = /(?<icon><.*>.*<\/[a-z]*>)./i.exec(`${htmlText}`) // https://regex101.com/r/j64AwO/1 // https://regex101.com/r/XkUB5L/3/
    if (match) {
      return match.groups.icon ?? ""
    }
    return ""
  }

  #createInputElement() {
    const frag = document.createRange().createContextualFragment(`
<input type="text" placeholder="${this.#rootNode.dataset.placeholder}">
`)
    const input = frag.querySelector(`input`)
    this.#rootNode.append(frag)
    return input
  }

  /**
   * @param {Object} obj
   * @param {string} text The input text by the user.
   * */
  #getMatchArray(obj, text) {
    const [root, ...sub] = text.trim().split(' ')
    if (sub.length === 0) {
      obj = obj instanceof Array ? obj : Object.getOwnPropertyNames(obj)

      return obj.filter(
        itemName => {
          try {

            const icon = Autocomplete.#getItemIcon(itemName)
            if (icon) {
              itemName = itemName.replace(icon, "")
            }

            const desc = Autocomplete.#getItemDesc(itemName)
            if (desc) {
              itemName = itemName.replace(desc, "")
            }

            const regex = new RegExp(`${root}`, "i")
            return regex.exec(itemName) !== null
          } catch (e) {
            return false
          }
        }
      )
    }

    // decide subRoot
    const resultArray = []
    for (const [orgKey, value] of Object.entries(obj)) {
      let key = orgKey

      const icon = Autocomplete.#getItemIcon(key)
      if (icon) {
        key = key.replace(icon, "")
      }

      const desc = Autocomplete.#getItemDesc(key)
      if (desc) {
        key = key.replace(desc, "")
      }
      if (key === root) {
        this.#getMatchArray(obj[orgKey], sub.join(" ")).forEach(item => {
          resultArray.push(root + " " + item)
        })
      }
    }

    return resultArray
  }

  #initInputEvent() {

    // create a list that qualifies for input
    this.#input.addEventListener("input", (e) => {
      const inp = e.target
      const val = inp.value.trim()
      this.closeAllLists()
      if (!val) {
        return false
      }
      this.#curFocus = -1

      const fragItemArray = document.createRange().createContextualFragment(`<div class="autocomplete-items"></div>`)

      const dataArray = this.#getMatchArray(this.#dataTable, val)

      for (const curInnerHTML of dataArray) {

        let innerText = curInnerHTML

        let icon = Autocomplete.#getItemIcon(innerText)
        if (icon) {
          innerText = innerText.replace(icon, "")
          icon = icon.replaceAll(this.#sep, " ")
        }

        let desc = Autocomplete.#getItemDesc(innerText)
        if (desc) {
          innerText = innerText.replace(desc, "")
          desc = desc.replaceAll(this.#sep, " ")
        }

        const contentArray = innerText.split(" ")

        let lastContent = contentArray.slice(0).join("").replaceAll(this.#sep, " ")
        if (contentArray.length > 1) {
          lastContent = contentArray.slice(-1)[0].replaceAll(this.#sep, " ")
        }

        const actualContent = contentArray.length === 1 ?
          lastContent :
          contentArray.slice(0, -1).join(" ") + " " + lastContent


        const [head, ...regexStringArray] = val.split(" ")
        const regexString = regexStringArray.length > 0 ? regexStringArray.slice(-1)[0] : head

        const matchContent = lastContent.match(new RegExp(`${regexString}`, "i"))
        let htmlContent = contentArray.length > 1 ? contentArray.slice(0, -1).join(" ") + " " : ""
        if (matchContent) {
          const markText = matchContent[0]
          htmlContent += lastContent.substring(0, matchContent.index) +
            `<strong class="highlight">${lastContent.substring(matchContent.index, matchContent.index + markText.length)}</strong>` +
            lastContent.substring(matchContent.index + markText.length)
        }

        const fragRow = document.createRange().createContextualFragment(`<div>
${icon}${htmlContent}${desc}
<input type="hidden" value="${actualContent}"/>
</div>
`)
        const iconNode = fragRow.querySelector(`span`) ?? fragRow.querySelector(`i`)
        if (iconNode) {
          iconNode.classList.add("me-2")
        }

        const descNode = fragRow.querySelector(`small`)
        if (descNode) {
          descNode.classList.add("ms-3", "text-muted")
        }

        fragRow.querySelector(`div`).onclick = (e) => {
          inp.value = e.target.querySelector(`input`).value
          this.closeAllLists()
        }
        fragItemArray.querySelector('div').append(fragRow)
      }
      inp.parentNode.append(fragItemArray)
    })

    // event for list items
    this.#input.addEventListener("keydown", async (keyboardEvent) => {
      const inp = keyboardEvent.target
      let divAutocompleteList = inp.parentNode.querySelector(`div[class="autocomplete-items"]`)
      if (divAutocompleteList === null) {
        return
      }

      const rowArray = divAutocompleteList.getElementsByTagName("div")
      if (rowArray.length === 0) {
        return
      }

      switch (keyboardEvent.key) {
        case "Tab":
          keyboardEvent.preventDefault()
          if (keyboardEvent.shiftKey) {
            this.#curFocus--
            this.#addActive(rowArray)
          } else {
            this.#curFocus++
            this.#addActive(rowArray)
          }
          break

        case "ArrowDown":
          this.#curFocus++
          this.#addActive(rowArray)
          break

        case "ArrowUp":
          this.#curFocus--
          this.#addActive(rowArray)
          break

        case "Enter": // need test
          keyboardEvent.preventDefault()
          if (this.#curFocus > -1) {
            if (rowArray) {
              await new Promise(resolve => setTimeout(resolve, 20)) // such that you have time to check ``document.querySelector(`div[class="autocomplete-active"]`))``
              rowArray[this.#curFocus].click()
            }
          }
          break
      }
    })
  }

  #addActive(array) {
    if (array.length === 0) {
      return false
    }

    this.#removeActive(array)

    if (this.#curFocus >= array.length) {
      this.#curFocus = 0
    }
    if (this.#curFocus < 0) {
      this.#curFocus = (array.length - 1);
    }
    array[this.#curFocus].classList.add("autocomplete-active")
  }

  #removeActive(array) {
    for (const node of array) {
      node.classList.remove("autocomplete-active")
    }
  }

  closeAllLists() {
    this.#input.parentNode.querySelectorAll(
      `div[class="autocomplete-items"]`
    ).forEach(curItem => curItem.remove())
  }
}


(() => {
  window.addEventListener("load", () => {
    Autocomplete.InsertStyleSheet()
  }, {once: true})
})()
