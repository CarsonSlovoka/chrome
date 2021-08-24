export async function GetTree() {
  const treeArray = await chrome.bookmarks.getTree()
  return treeArray[0]
}

function convertTreeTitle2AutocompleteOuterHTML(tree) {
  if (tree.title === "") {
    return ""
  }
  const [icon, desc] = tree.url === undefined ?
    [`<span>📂</span>`, ""] :
    [`<span>🔗</span>`, `<a class="text-decoration-none" href="${tree.url}" target="_blank">${tree.url}</a>`]
  return `${icon}${tree.title}${desc}`
}

/**
 * @param {Object} tree https://github.com/chromium/chromium/blob/2d4a97f1ed2dd875557849b4281c599a7ffaba03/chrome/common/extensions/api/bookmarks.json#L28-L80
 * @see https://developer.chrome.com/docs/extensions/reference/bookmarks/#type-BookmarkTreeNode
 * */
export function Tree2AutocompleteTable(tree) {

  const treeTitle = convertTreeTitle2AutocompleteOuterHTML(tree)

  if (tree.children === undefined) {
    return {[treeTitle]: []}
  }

  const resultObj = {}
  resultObj[treeTitle] = {}
  for (const subTree of tree.children) {
    const data = Tree2AutocompleteTable(subTree)
    for (const [key, val] of Object.entries(data)) {
      resultObj[treeTitle][key] = val
    }
  }
  return resultObj
}


export function Tree2AutocompleteArray(tree, array, includeDir=false) {
  const treeTitle = convertTreeTitle2AutocompleteOuterHTML(tree)

  if (tree.children === undefined) {
    array.push(treeTitle)
    return
  }

  for (const subTree of tree.children) {
    if (includeDir && subTree.children) {
      const _subTree = subTree
      _subTree.title = tree.title !== ""?  tree.title + "→" + _subTree.title : _subTree.title
      const subTreeDirTitle = convertTreeTitle2AutocompleteOuterHTML(_subTree)
      array.push(subTreeDirTitle)
    }
    Tree2AutocompleteArray(subTree, array, includeDir)
  }
}
