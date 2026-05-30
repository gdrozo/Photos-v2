import TranslucentPanel from '../../generics/TranslucentPanel'
import { Accessor, Show } from 'solid-js'
import { MediaInfo } from '../../types/media'
import { showInFolder } from '../../util/fileUtil'

// prop definitions
interface CenterBarProps {
  imageName: MediaInfo | null
  show: Accessor<boolean>
}

function CenterBar(props: CenterBarProps) {
  function onClick() {
    const i = props.imageName
    if (!i || !i.path) return
    showInFolder(i.path)
  }

  return (
    <div data-tauri-drag-region class='flex justify-center '>
      <Show when={props.imageName && props.show()}>
        <TranslucentPanel
          class='flex space-x-4 px-3 py-2'
          style={{
            animation:
              (props.show() ? 'slide-up-down' : 'slide-bottom-up') +
              ' 0.5s ease-in-out forwards',
          }}
        >
          <button
            onClick={onClick}
            class='text-sm font-light truncate max-w-[20rem] opacity-50 hover:opacity-100'
          >
            {props.imageName?.path}
          </button>
        </TranslucentPanel>
      </Show>
    </div>
  )
}

export default CenterBar
