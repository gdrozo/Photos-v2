import { Accessor, Setter, createMemo, createSignal } from 'solid-js'
import { useMouseListener } from './useMouseListener'

export default function useAutoHideCursor(
  hidable: Accessor<boolean>,
  setShow: Setter<boolean>,
) {
  let lastMouseMove: number | null = null
  let prevMouse = document.body.style.cursor

  const [style, setStyle] = createSignal('auto')
  const fullStyle = createMemo(() => `cursor: ${style()};`)

  useMouseListener(() => {
    if (lastMouseMove) clearTimeout(lastMouseMove)

    // if the mouse is hidden, show it
    setStyle(prevMouse)
    setShow(true)

    function onTimeout() {
      if (!hidable()) return

      prevMouse = document.body.style.cursor
      prevMouse = prevMouse === 'none' ? 'auto' : prevMouse
      setStyle('none')
      lastMouseMove = null
      setShow(false)
    }

    // in one second, hide the mouse
    if (lastMouseMove !== null) clearTimeout(lastMouseMove)
    lastMouseMove = setTimeout(onTimeout, 1500)
  })

  return fullStyle
}
