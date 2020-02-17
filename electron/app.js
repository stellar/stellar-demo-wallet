const { menubar } = require('menubar')
const path = require('path')

const cb = menubar({
  preloadWindow: true,
  icon: path.join(__dirname, 'assets', 'img', 'iconTemplate.png'),
  browserWindow: {
    height: 600,
    width: 500,
    alwaysOnTop: true,
    frame: true,
    webPreferences: {
      nativeWindowOpen: true
    }
  }
})