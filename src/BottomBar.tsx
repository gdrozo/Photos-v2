import { Accessor, createEffect, createSignal, Show } from 'solid-js'
import './BottomBar.css'
import TranslucentPanel from './generics/TranslucentPanel'

// prop definitions
interface BottomBarProps {
  at: Accessor<number>
  total: Accessor<number>
  show: Accessor<boolean>
  setHidable: (hidable: boolean) => void
  setAt: (at: number) => void
}

function BottomBar(props: BottomBarProps) {
  const [isEditing, setIsEditing] = createSignal(false)
  const [input, setInput] = createSignal(props.at() + 1)

  const [animation, setAnimation] = createSignal('slide-in')

  createEffect(() => {
    if (props.show()) setAnimation('slide-in')
    else setAnimation('slide-out')
  })

  function onClick() {
    if (isEditing()) {
      setIsEditing(false)
      props.setHidable(true)
      props.setAt(input() - 1)
    } else {
      setIsEditing(true)
      props.setHidable(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') onClick()
    else if (e.key === 'Escape') setIsEditing(false)
    else if (e.key === 'ArrowUp' && input() !== undefined) setInput(input() - 1)
    else if (e.key === 'ArrowDown' && input() !== undefined)
      setInput(input() + 1)
  }

  return (
    <div class='fixed left-0 right-0 bottom-0 flex justify-center pointer-events-nones'>
      <Show when={props.total() > 0 && props.at() !== undefined}>
        <div
          class='absolute bottom-4'
          style={{
            animation: `${animation()} 0.5s ease-in-out forwards`,
          }}
        >
          <TranslucentPanel class='text-sm px-2 py-1 rounded-lg text-white/50'>
            <Show when={!isEditing()}>
              <div onClick={onClick}>
                {props.at() + 1} / {props.total()}
              </div>
            </Show>
            <Show when={isEditing()}>
              <div>
                <input
                  autofocus={true}
                  type='number'
                  min={0}
                  max={props.total() - 1}
                  default-value={props.at() + 1}
                  class='focus:outline-none'
                  onChange={e => {
                    const value = parseInt(e.target.value)
                    if (!isNaN(value)) setInput(value)
                  }}
                  onKeyDown={onKeyDown}
                />
              </div>
            </Show>
          </TranslucentPanel>
        </div>
      </Show>
    </div>
  )
}

export default BottomBar
