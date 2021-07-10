/*
* Create 5 buttons on the options page to let the user choose.
* */
class OptionPage {
  static ButtonColors = ["#3aa757", "#e8453c", "#f9bb2d", "#4688f1", "#FFAABB"]
  static selectedClassName = "current"

  /**
   * @param {HTMLElement} targetNode
   */
  constructor(targetNode) {
    this.body = targetNode
    this.curColor = ""
    chrome.storage.sync.get("color", (data) => {
      this.curColor = data.color
    })
  }

  buildButtons() {
    const fragButtons = document.createDocumentFragment()
    for (const curColor of OptionPage.ButtonColors) {
      const range = document.createRange()
      const frag = range.createContextualFragment(`<button data-color="${curColor}" style="background-color:${curColor}">`)
      const btn = frag.querySelector(`button`)
      if (curColor === this.curColor) {
        btn.classList.add(OptionPage.selectedClassName)
      }

      btn.addEventListener("click", (event) => {
        const selectedClassName = OptionPage.selectedClassName
        const clickBtn = event.target
        // Remove styling from the previously selected color
        const selectedBtn = clickBtn.parentElement.querySelector(`.${selectedClassName}`)
        if (selectedBtn && selectedBtn !== clickBtn) {
          selectedBtn.classList.remove(selectedClassName)
        }

        // Mark the button as selected
        clickBtn.classList.add(selectedClassName)
        const color = event.target.dataset.color // data-color
        chrome.storage.sync.set({color})

      })
      fragButtons.append(frag)
    }
    this.body.append(fragButtons)
  }
}

obj = new OptionPage(document.getElementById("buttonDiv"))
obj.buildButtons()

