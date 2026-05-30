import { Accessor, createEffect, Show } from 'solid-js'
import TranslucentPanel from '../../generics/TranslucentPanel'
import MuteIndicator from '../MuteIndicator'
import onKeydown from '../../hooks/useKeydown'
import { LoaderCircle, Pause, Play } from 'lucide-solid'
import PositionIndicator from '../PositionIndicator'

const VIDEO_SERVER_URL = 'http://127.0.0.1:3001/media?path='

// prop definitions
interface VideoDisplayProps {
  vidRef: Accessor<HTMLElement | undefined>
  setVidRef: (v: HTMLElement | undefined) => void
  currentVid: Accessor<HTMLVideoElement>
  translate: Accessor<{ x: number; y: number }>
  scale: Accessor<number>
  mediaSrc: Accessor<string>
  muted: Accessor<boolean>
  show: Accessor<boolean>
  paused: Accessor<boolean>
  isLoaded: Accessor<boolean>
  setIsLoaded: (v: boolean) => void
  setPaused: (v: boolean | ((p: boolean) => boolean)) => void
  onMutedChange: (muted: boolean) => void
  position: Accessor<number>
  setPosition: (v: number) => void
  duration: Accessor<number>
  setDuration: (v: number) => void
}

export default function VideoDisplay(props: VideoDisplayProps) {
  createEffect(() => {
    props.muted()
    const video = props.currentVid()
    if (video) {
      // Duration might not be available immediately
      const updateDuration = () => {
        props.setDuration(video.duration)
      }

      video.addEventListener('loadedmetadata', updateDuration)
      onKeydown({
        m: () => {
          const m = !props.muted()
          props.onMutedChange(m)
        },
        ' ': () => props.setPaused(p => !p),
      })
    }
  })

  let animationRef: number

  createEffect(() => {
    function updateProgress() {
      const vid = props.vidRef() as HTMLVideoElement

      if (vid === undefined) return

      if (vid.duration) props.setPosition(vid.currentTime)

      animationRef = requestAnimationFrame(updateProgress)
    }

    if (!props.paused() && props.isLoaded()) {
      animationRef = requestAnimationFrame(updateProgress)
    } else animationRef && cancelAnimationFrame(animationRef)
  })

  createEffect(() => {
    props.mediaSrc()
    props.setPaused(false)
    props.setIsLoaded(false)
    props.setDuration(0)
  })

  function playPause() {
    try {
      const video = props.vidRef() as HTMLVideoElement
      if (video) {
        if (!props.paused()) video.play()
        else video.pause()
      }
    } catch (_) {}
  }

  createEffect(() => {
    playPause()
  })

  return (
    <>
      {/* Loader */}
      <Show when={!props.isLoaded()}>
        <div
          class='absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center'
          style={
            {
              transformOrigin: '0 0',
              transform: `translate(${props.translate().x}px, ${
                props.translate().y
              }px) scale(${props.scale()})`,
              userSelect: 'none',
              WebkitUserDrag: 'none',
            } as any
          }
        >
          <LoaderCircle class='size-10 animate-spin' />
        </div>
      </Show>

      {/* Video */}
      <video
        ref={el => props.setVidRef(el)}
        controls={false}
        draggable={false}
        autoplay
        loop
        muted={props.muted()}
        preload='metadata'
        onLoadedData={() => props.setIsLoaded(true)}
        class='h-full object-contain will-change-transform focus-visible:outline-none'
        style={
          {
            visibility: props.isLoaded() ? 'visible' : 'hidden',
            transformOrigin: '0 0',
            transform: `translate(${props.translate().x}px, ${
              props.translate().y
            }px) scale(${props.scale()})`,
            userSelect: 'none',
            WebkitUserDrag: 'none',
          } as any
        }
        src={
          props.mediaSrc()
            ? VIDEO_SERVER_URL + `${encodeURIComponent(props.mediaSrc())}`
            : ''
        }
      ></video>

      {/* Overlay */}
      <div class='fixed top-0 left-0 bottom-0 right-0 pointer-events-none'>
        <div class='absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center'>
          <Show when={props.show()}>
            <TranslucentPanel class='p-5 rounded-full overflow-hidden pointer-events-auto'>
              <Show
                when={props.paused()}
                fallback={<Pause class='size-5 stroke-[1.5px]' />}
              >
                <Play class='size-5 stroke-[1.5px]' />
              </Show>
            </TranslucentPanel>
          </Show>
        </div>
      </div>

      <PositionIndicator
        position={props.position}
        duration={props.duration}
        show={props.show}
      />
      <MuteIndicator muted={props.muted} show={props.show} />
    </>
  )
}
