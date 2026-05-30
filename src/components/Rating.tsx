import { ChevronLeft, ChevronRight, Hash } from 'lucide-solid'
import { Accessor, createSignal, createEffect } from 'solid-js'
import { getRating } from '../util/ratingUtil'

interface RatingProps {
  path: Accessor<string>
  onMoveForward?: () => void
  onMoveBackward?: () => void
  index: Accessor<number>
  total: Accessor<number>
  show: Accessor<boolean>
}

export default function Rating(props: RatingProps) {
  const [_, setRating] = createSignal(0)
  const [showState, setShowState] = createSignal(props.show())

  const [timeout, setTimeoutId] = createSignal<number>()

  const opacity = () =>
    showState() ? 'opacity-100' : 'opacity-0 pointer-events-none'

  let previusPathRef = props.path()

  createEffect(() => {
    if (previusPathRef === props.path()) {
      setShowState(true)
      setTimeoutId(
        setTimeout(() => {
          setShowState(false)
        }, 300)
      )
    }
    previusPathRef = props.path()
  })

  createEffect(() => {
    const externalShow = props.show()
    if (externalShow) {
      if (timeout()) {
        clearTimeout(timeout())
        setTimeoutId(undefined)
      }
      setShowState(true)
    } else {
      setShowState(false)
      setTimeoutId(undefined)
    }
  })

  createEffect(() => {
    getRating(props.path()).then(setRating)
  })

  return (
    <div
      class={`absolute top-0 flex gap-4 items-center bg-white/5 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 
                    shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all hover:bg-white/10  duration-300 ${opacity()}`}
    >
      <button
        title='Move Forward (To Front)'
        class='focus:outline-none transition-all duration-200 hover:scale-125 active:scale-90 group p-1 hover:bg-white/10 rounded-full disabled:opacity-30'
        onClick={props.onMoveForward}
        disabled={props.index() === 0}
      >
        <ChevronLeft class='size-6 text-white/60 group-hover:text-white transition-colors' />
      </button>
      <div class='flex flex-col items-center min-w-60px'>
        <div class='flex items-center gap-1 text-white/40 text-[10px] uppercase font-bold tracking-tighter'>
          <Hash size={10} />
          <span>Position</span>
        </div>
        <span class='text-white font-mono text-lg leading-none'>
          {props.index() !== undefined ? props.index() + 1 : '-'}
        </span>
      </div>
      <button
        title='Move Backward (To Back)'
        class='focus:outline-none transition-all duration-200 hover:scale-125 active:scale-90 group p-1 hover:bg-white/10 rounded-full disabled:opacity-30'
        onClick={props.onMoveBackward}
        disabled={
          props.index() !== undefined &&
          props.total() !== undefined &&
          props.index() >= props.total() - 1
        }
      >
        <ChevronRight class='size-6 text-white/60 group-hover:text-white transition-colors' />
      </button>
    </div>
  )
}
