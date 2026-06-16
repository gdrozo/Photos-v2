import TranslucentPanel from '../generics/TranslucentPanel'
import './MuteIndicator.css'
import { Accessor, createEffect, createSignal, Show, untrack } from 'solid-js'

interface PositionIndicatorProps {
  position: Accessor<number>
  duration: Accessor<number>
  show: Accessor<boolean>
}

export const [show, setShow] = createSignal(true)

export default function PositionIndicator(props: PositionIndicatorProps) {
  const [timer, setTimer] = createSignal<number | undefined>(undefined)

  createEffect(() => {
    const s = show()
    if (!s) return
    untrack(() => {
      if (timer() !== undefined) clearTimeout(timer())
    })
    let t = setTimeout(() => {
      setTimer(undefined)
      setShow(false)
    }, 1000)
    setTimer(t)
  })

  createEffect(() => {
    const s = props.show()
    if (s) {
      setShow(true)
      if (timer() !== undefined) {
        untrack(() => {
          clearTimeout(timer())
          setTimer(undefined)
        })
      }
    } else if (timer() === undefined) setShow(false)
  })

  createEffect(() => {
    const d = props.duration()

    setShow(true)
  })

  const stringTime = () => {
    return prettyTime(props.position()) + ' / ' + prettyTime(props.duration())
  }

  return (
    <Show
      when={show() /*&& !isNaN(props.position()) && !isNaN(props.duration())*/}
    >
      <div
        class={`fixed bottom-4 left-4 transition-opacity duration-300 
        ${!show() ? 'pop-up-animation' : ''}`}
      >
        <TranslucentPanel class='px-3 py-1 rounded-xl'>
          {stringTime()}
        </TranslucentPanel>
      </div>
    </Show>
  )
}

function prettyTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  let remainingSeconds = Math.floor(seconds % 60)

  if (remainingSeconds <= 0) remainingSeconds = 1

  if (hours > 0)
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${
      remainingSeconds < 10 ? '0' : ''
    }${remainingSeconds}`

  return `${minutes < 10 ? '0' : ''}${minutes}:${
    remainingSeconds < 10 ? '0' : ''
  }${remainingSeconds}`
}
