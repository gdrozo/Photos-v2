import { createEffect } from 'solid-js'

export function useMouseListener(onMouseMove: (e: MouseEvent) => void) {
  createEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
    }
  })
}
