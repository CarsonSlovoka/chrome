## Install

1. 打開chrome擴充功能
2. 勾起開發人員模式
3. 選擇載入未封裝項目
4. 餵入含有manifest.json的資料夾

## Open the Extension Management page

> ``chrome://extensions``

## [manifest.json](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)

It is a JSON-formatted file, with one exception: it is allowed to contain ``//`` -style comments. (可以使用註解)

一般的json格式不支持註解，可以把它改成json5即可

## Error

### [Service worker registration failed.](https://stackoverflow.com/a/66115801/9935654)

如果您確定chrome的版本至少在93，那麼可以加上

### [chrome.tabs.executeScript: Cannot access a chrome:// URL](https://stackoverflow.com/a/24606853/9935654)

基於安全性的考量，chrome不允許您變更他的主題內容，你可以試試其他的頁面

```
"minimum_chrome_version": 93,
```

這樣就不必要把文件放在root之下

**Service worker registration failed. Chrome extension**

## About permissions

```json
{"permissions": ["storage"]}
```

we may need to use some API, for example,
```
chrome.storage.sync.set({ color })
```

that is why we need to add it.

> see more: https://developer.chrome.com/docs/extensions/reference/storage/

## Reference

- https://developer.chrome.com/docs/extensions/mv3/getstarted/
