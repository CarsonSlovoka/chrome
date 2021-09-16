// https://stackoverflow.com/a/69010929/9935654

/**
 * @param {string} msg "__MSG_Hello__para1,para2|1"  or "__MSG_Hello__para1,para2|0"
 * */
function convertMsgAsFuncPara(msg) {
  const match = /__MSG_(?<id>\w+)__(?<para>[^|]*)?(\|(?<escapeLt>[01]{1}))?/g.exec(msg) // https://regex101.com/r/OeXezc/1/
  if (match) {
    let {groups: {id, para, escapeLt}} = match
    para = para ?? ""
    escapeLt = escapeLt ?? false
    return [id, para.split(","), Boolean(Number(escapeLt))]
  }
  return [undefined]
}

function InitI18nNode() {
  const msgNodeArray = document.querySelectorAll(`[data-i18n]`)
  msgNodeArray.forEach(msgNode => {
    /*
    let [msgID, ...para] = msgNode.getAttribute("data-i18n").split(",")
    msgID.replace(/__MSG_(\w+)__/g, (match, group1)=> {
      msgID = group1
    })
    const escapeLt = msgNode.getAttribute("data-escapelt") ?? false // default: false. convert to HTML string
     */

    const [id, paraArray, escapeLt] = convertMsgAsFuncPara(msgNode.getAttribute("data-i18n"))
    if (id) {
      msgNode.innerHTML = chrome.i18n.getMessage(id, paraArray, {escapeLt})
    }

    // ↓ handle attr
    for (const attr of msgNode.attributes) {
      const [attrName, attrValue] = [attr.nodeName, attr.nodeValue]
      const [id, paraArray, escapeLt] = convertMsgAsFuncPara(attrValue)
      if (!id) {
        continue
      }
      msgNode.setAttribute(attrName, chrome.i18n.getMessage(id, paraArray, {escapeLt}))
    }
  })
}

(() => {
  window.addEventListener("load", InitI18nNode, {once: true})
})()
