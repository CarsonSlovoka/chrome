There has some method to let you know the error message or to debug.

1. go to ``chrome://extensions/``, and then click ``Service Worker``

   ![image](https://user-images.githubusercontent.com/17170765/125274417-885adb80-e340-11eb-875d-775a95764282.png)


2. Right-click on your icon, click ``Inspect popup on your browser``, and then find your source start debugging.

    ![image](https://user-images.githubusercontent.com/17170765/125275802-0cfa2980-e342-11eb-8336-4133ed6f41a9.png)

3. use the [chrome.scripting.executeScript.runtime function](https://developer.chrome.com/docs/extensions/reference/scripting/#runtime-functions)

    and you can directly inspect (F12) on the webpage. Click the ``Console`` tab, it will show you a source id(for example ``VM87:3``) You can click it, and then start debugging.

    https://github.com/CarsonSlovoka/chrome/blob/d04f38c62d4131da38d3e624a66d18beff1f0788/tutorials/extensions/console-alert/static/js/main.js#L5-L16

    ![image](https://user-images.githubusercontent.com/17170765/125277651-49c72000-e344-11eb-8712-b325477fc795.png)

    ❗ [chrome.scripting.executeScript.function](https://developer.chrome.com/docs/extensions/reference/scripting/#runtime-functions) can't get any context.

    > This function will be executed in the context of injection target. However, **this will not carry over any of the current execution context of the function**. As such, bound parameters (including the this object) and externally-referenced variables will result in errors. For instance, the following code will not work, and will throw a ReferenceError because color is undefined when the function execute
    >
    > You can work around this by using the [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/) or by passing messages.
