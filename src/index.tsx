/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import { invoke } from '@tauri-apps/api/core'

window.addEventListener('DOMContentLoaded', async () => {
  // Optional: wait for your data fetching
  //await fetch('/api/whatever')
  // maybe wait a bit to let the UI paint
  requestAnimationFrame(() => invoke('show_main_window'))
})

render(() => <App />, document.getElementById('root') as HTMLElement)
