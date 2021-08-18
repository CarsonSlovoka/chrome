## None

### [PWA (progressive web application)](https://en.wikipedia.org/wiki/Progressive_web_application)


## Documentation

### Extensions

#### ★ [API Reference](https://developer.chrome.com/docs/extensions/reference/)

- [chrome.i18n](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [manifest](https://developer.chrome.com/docs/extensions/mv3/manifest/#overview)
  - icon: https://github.com/CarsonSlovoka/chrome/issues/3#issue-947710397
- [messages.json](https://developer.chrome.com/docs/extensions/mv3/i18n-messages/#overview)

很重要，讓您知道有那些API可以用


#### messages.json

```json5
{
  "name": "...",
  "description": "...",
  "manifest_version": 3,
  "version": "1.0.0.0", // 版號的第一碼不能為0
  "icons": {
    "16": "static/image/favicon/16.png",
    "32": "static/image/favicon/32.png",
    "48": "static/image/favicon/48.png",
    "128": "static/image/favicon/128.png"
  },
  "action": {
    "default_popup": "templates/popup.html"
  },
  "background": {
    "service_worker": "service-worker.js"
  },
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs", // https://developer.chrome.com/docs/extensions/reference/windows/#type-WindowType // The Tab objects only contain the url, pendingUrl, title, and favIconUrl properties if the extension's manifest file includes the "tabs" permission. // It is for "chrome.windows.getAll" to get more details.
    "bookmarks"
  ],

  "content_scripts": [ // 注入的腳本，可以餵給它js和css，它就會把這些檔案注入到您開啟的tab之中，並且要符合matches的條件
    {
      "matches": [ // https://developer.chrome.com/docs/extensions/mv3/match_patterns/
        "http://*/*",
        "https://*/*"
      ],
      "js": ["static/js/src/scripting/video-controls.js"]
    }
  ],

  "commands": {
    "show-console-screen": { // 快捷鍵名稱，除了_execute_action的名稱，都是指在popup的視窗被開啟之後，可以接收到的快捷鍵
      "description": "...", // 不重要
      "suggested_key": { // https://developer.chrome.com/docs/extensions/reference/commands/#supported-keys
        "default": "Alt+C"
      }
    },
    "_execute_action": {
      "description": "This hotkey can quickly open the extension. (same as you click extension by mouse.)",
      "suggested_key": {
        "default": "Alt+1"
      }
    }
  },
  "content_security_policy": { // https://content-security-policy.com/
    // "extension_pages": "default-src 'self'; connect-src * data: blob: filesystem:; style-src 'self'; img-src 'self' data:; frame-src 'self' data:; font-src 'self' data:; media-src * data: blob: filesystem:;"
  }
}

```


#### Develop extensions and themes

##### [Declare permissions](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)

```json
{
    "permissions": [
        "tabs",
        "bookmarks",
        "unlimitedStorage"
    ],
    "optional_permissions": [
        "unlimitedStorage"
    ],
    "host_permissions": [
        "http://www.blogger.com/",
        "http://*.google.com/"
    ]
}
```


## Reference
[![Google/Chrome](https://github-readme-stats.vercel.app/api/pin?username=GoogleChrome&repo=chrome-extensions-samples)](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/tutorials) |
