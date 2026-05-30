import { createEffect } from 'solid-js'

export default function useAnimation(onChange: () => string) {
  let element: HTMLElement | undefined
  let prevAnimation: string | null = null

  createEffect(() => {
    if (!element) return
    const animation = onChange()

    setAnimation(animation)
  })

  const setAnimation = (animation: string) => {
    if (
      !element ||
      animation === undefined ||
      animation === null ||
      animation === ''
    )
      return

    if (prevAnimation) {
      element.classList.remove(prevAnimation)
      prevAnimation = null
    }

    prevAnimation = animation

    element.classList.remove(animation)
    element.classList.add(animation)
  }

  return [
    (el: HTMLElement) => {
      element = el
    },
    setAnimation,
  ] as const
}
