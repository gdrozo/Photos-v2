import { Accessor, createEffect, createSignal } from 'solid-js'
import TranslucentPanel from '../../generics/TranslucentPanel'

// prop definitions
interface ProgressBarProps {
  show: Accessor<boolean>
  vidRef: Accessor<HTMLVideoElement | undefined>
  paused: Accessor<boolean>
  isLoaded: Accessor<boolean>
  position: Accessor<number>
  setPosition: (v: number) => void
  duration: Accessor<number>
}

function ProgressBar(props: ProgressBarProps) {
  const [progress, setProgress] = createSignal(0)
  let progressBarRef: HTMLDivElement
  let isDraggingRef = false

  createEffect(() => {
    if (!props.paused() && props.isLoaded()) {
      const ratio = props.position() / props.duration()
      setProgress(ratio)
    }
  })

  function handlePointerDown(e: PointerEvent) {
    e.stopPropagation()
    isDraggingRef = true
    handleSeek(e.clientX)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDraggingRef) return
    e.stopPropagation()
    handleSeek(e.clientX)
  }

  function handlePointerUp(e: PointerEvent) {
    isDraggingRef = false
    e.stopPropagation()
    handleSeek(e.clientX)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }

  function handleSeek(clientX: number) {
    const bar = progressBarRef
    const video = props.vidRef()
    if (!bar || !video || !video.duration) return

    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    setProgress(ratio)
    props.setPosition(ratio * video.duration)
    video.currentTime = ratio * video.duration
  }

  return (
    <div
      ref={el => (progressBarRef = el)}
      class='absolute bottom-0 left-0 right-0 h-10  rounded overflow-hidden pointer-events-auto z-40 flex items-end'
      style={{ opacity: props.show() ? 1 : 0, transition: 'opacity 0.3s ease' }}
      onPointerDown={handlePointerDown}
      id='progressBar'
    >
      <TranslucentPanel class='h-3 w-full flex'>
        <div class='h-full' style={{ width: `${progress() * 100}%` }}></div>
        <div class='h-full w-4 bg-black  border-r-2 border-white'></div>
      </TranslucentPanel>
    </div>
  )
}

export default ProgressBar
