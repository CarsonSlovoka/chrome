## Introduction

You can use this extension to get the favIcon from the web page.

The code of the kernel is

```js
chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
    const iconURL = tab.favIconUrl
})
```

Once you get the URL, then you can use it to create a button or link, whatever, you could download with it.
