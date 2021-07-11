(() => {
  const color = '#3aa757'

  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({color}, // {color:color}
      () => { // options: function (可選項，可以省略)
        console.log(`Value is set to ${color}`)

        // 👇 test locale
        /*
        const messageApp  = chrome.i18n.getMessage("app") // error // chrome.i18n.getMessage() is a sync method that needs to read files, so I guess it's not suitable for (async) service workers.
         */
      }
    )

    /*
    chrome.storage.sync.set({key: value}, function () {
      console.log('Value is set to ' + value);
    });

    chrome.storage.sync.get(['key'], function (result) {
      console.log('Value currently is ' + result.key);
    });
     */

    // alert(`Default background color set to ${color} green`) //  ReferenceError: alert is not defined: https://stackoverflow.com/a/11258916/9935654
    console.log(`Default background color set to ${color} green`) // 查看檢視模式中可以點開，就可以看到這段話
  })
})()


