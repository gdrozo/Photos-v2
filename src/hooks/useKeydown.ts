import { createEffect, onCleanup } from 'solid-js'

export type KeyAction = {
  [key: string]: (e: KeyboardEvent) => void
}

export default function onKeydown(keyActionMap: KeyAction) {
  createEffect(() => {
    // Set the key press event listener
    const keydownListener = (e: KeyboardEvent) => {
      if (keyActionMap[e.key]) {
        keyActionMap[e.key](e)
      }
    }

    window.addEventListener('keydown', keydownListener)

    onCleanup(() => {
      // Remove the key press event listener
      window.removeEventListener('keydown', keydownListener)
    })
  })
}
