import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import './index.css'
import App from './App'
import { store } from './state/store'

if (typeof window.showOpenFilePicker !== 'undefined') {
  ReactDOM.render(
    <Provider store={store}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>,
    document.getElementById('root'),
  )
} else {
  ReactDOM.render(
    <div>This app is not supported on your browser, Chrome is recommended.</div>,
    document.getElementById('root'),
  )
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/srt-player/sw.js').then(reg => {})
}
