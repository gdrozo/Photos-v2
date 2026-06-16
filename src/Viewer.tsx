import VideoDisplay from './components/video/VideoDisplay'
import ZoomPanel from './generics/ZoomPanel'
import ProgressBar from './components/video/ProgressBar'
import ImageDisplay from './components/ImageDisplay'
import BackgroundBlur from './components/BackgroundBlur'
import BackgroundVideoBlur from './components/video/BackgroundVideoBlur'
import NavButtons from './components/NavButtons'
import Rating from './components/Rating'
import { Accessor, createEffect, createSignal, Show, untrack } from 'solid-js'
import {
  show as showInfo,
  setShow as setShowInfo,
} from './components/PositionIndicator'

export interface ViewerActions {
  seek: (forward: boolean) => void
}

// prop definitions
interface ViewerProps {
  ref?: (actions: ViewerActions) => void
  mediaSrc: Accessor<string>
  leftEnabled: Accessor<boolean>
  rightEnabled: Accessor<boolean>
  onLeftClick: () => void
  onRightClick: () => void
  nukeImage: () => void
  onHome: () => void
  onEnd: () => void
  muted: Accessor<boolean>
  show: Accessor<boolean>
  onMutedChange: (muted: boolean) => void
  onMoveForward: () => void
  onMoveBackward: () => void
  onMoveToFront: () => void
  onMoveToEnd: () => void
  imageIndex: Accessor<number>
  totalImages: Accessor<number>
  sort_by: Accessor<string>
  containerRef: HTMLDivElement | null
}

function Viewer(props: ViewerProps) {
  //Image zoom
  let container: HTMLDivElement | undefined
  let [img, setImg] = createSignal<HTMLElement>()

  const [scale, setScale] = createSignal(1)
  const [translate, setTranslate] = createSignal({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = createSignal(false)

  const [position, setPosition] = createSignal(0)
  const [duration, setDuration] = createSignal(0)

  const [paused, setPaused] = createSignal(false)

  createEffect(() => {
    props.mediaSrc()

    setScale(1)
    setTranslate({ x: 0, y: 0 })
    setPaused(false)
    setPosition(0)
    setDuration(0)

    if (props.ref) {
      props.ref({
        seek: (forward: boolean) => {
          try {
            const video = img() as HTMLVideoElement
            if (video) {
              // if the video is shorter that 10 seconds, seek by 1 second
              let delta = video.duration < 10 ? 2 : 5
              if (!forward) delta = -delta

              if (video.duration <= video.currentTime + delta) return

              video.currentTime = video.currentTime + delta
              setShowInfo(true)

              let newTime = video.currentTime
              if (newTime < 0) newTime = 0
              if (newTime > video.duration) newTime = video.duration

              setPosition(parseInt(newTime.toString()))
              setDuration(parseInt(video.duration.toString()))
            }
          } catch (error) {
            console.error('Seek error:', error)
          }
        },
      })
    }
  })

  function includesVideo(url: string) {
    url = url.toLowerCase()
    return (
      url.includes('.mp4') ||
      url.includes('.webm') ||
      url.includes('.m4v') ||
      url.includes('.mov') ||
      url.includes('.mkv') ||
      url.includes('.MP4')
    )
  }

  // Accept imageSrc as a prop
  return (
    <div
      ref={container}
      class='h-dvh overflow-hidden flex justify-center relative bg-transparent'
    >
      <Show when={props.mediaSrc() && !includesVideo(props.mediaSrc())}>
        <ZoomPanel
          scale={scale}
          setScale={setScale}
          translate={translate}
          setTranslate={setTranslate}
          mediaSrc={props.mediaSrc}
          containerRef={props.containerRef}
        >
          <ImageDisplay
            imgRef={(el: HTMLImageElement) => setImg(el)}
            translate={translate}
            scale={scale}
            mediaSrc={props.mediaSrc}
          />
        </ZoomPanel>
        <BackgroundBlur mediaSrc={props.mediaSrc} />
      </Show>

      <Show when={props.mediaSrc() && includesVideo(props.mediaSrc())}>
        <ZoomPanel
          scale={scale}
          setScale={setScale}
          translate={translate}
          setTranslate={setTranslate}
          mediaSrc={props.mediaSrc}
          onClick={() => setPaused(!paused())}
          containerRef={props.containerRef}
        >
          <VideoDisplay
            vidRef={img}
            setVidRef={setImg}
            currentVid={img as Accessor<HTMLVideoElement>}
            translate={translate}
            scale={scale}
            mediaSrc={props.mediaSrc}
            muted={props.muted}
            show={props.show}
            paused={paused}
            isLoaded={isLoaded}
            setIsLoaded={setIsLoaded}
            setPaused={setPaused}
            onMutedChange={props.onMutedChange}
            position={position}
            duration={duration}
            setDuration={setDuration}
            setPosition={setPosition}
          />
        </ZoomPanel>
        <ProgressBar
          show={props.show}
          vidRef={img as Accessor<HTMLVideoElement | undefined>}
          paused={paused}
          isLoaded={isLoaded}
          position={position}
          duration={duration}
          setPosition={setPosition}
        />
        <BackgroundVideoBlur mediaSrc={props.mediaSrc} />
      </Show>

      <NavButtons
        leftEnabled={props.leftEnabled}
        rightEnabled={props.rightEnabled}
        onLeftClick={() => {
          if (props.leftEnabled()) {
            container && (container.style.cursor = '')
            props.onLeftClick()
          }
        }}
        onRightClick={() => {
          if (props.rightEnabled()) {
            container && (container.style.cursor = '')
            props.onRightClick()
          }
        }}
      />

      <Show
        when={
          props.mediaSrc() && props.sort_by() && props.sort_by() === 'Rating'
        }
      >
        <div
          class={`fixed flex justify-center bottom-28 left-0 right-0 h-0 z-50 `}
          onClick={e => e.stopPropagation()}
        >
          <Rating
            path={props.mediaSrc}
            onMoveForward={props.onMoveForward}
            onMoveBackward={props.onMoveBackward}
            index={props.imageIndex}
            total={props.totalImages}
            show={props.show}
          />
        </div>
      </Show>
    </div>
  )
}

export default Viewer
