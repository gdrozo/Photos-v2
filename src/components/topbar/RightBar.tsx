import { Cog } from 'lucide-solid'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
// @ts-ignore: SVG module declarations may not exist in this project setup
import closeIcon from './assets/close.svg'
// @ts-ignore: SVG module declarations may not exist in this project setup
import minimizeIcon from './assets/minimize.svg'
// @ts-ignore: SVG module declarations may not exist in this project setup
import maximizeIcon from './assets/maximize.svg'
// @ts-ignore: SVG module declarations may not exist in this project setup
import restoreIcon from './assets/restore.svg'

import TranslucentPanel from '../../generics/TranslucentPanel'
import { Accessor, createSignal, Setter } from 'solid-js'

// props declaration
interface RightBarProps {
  show: Accessor<boolean>
  showConfig: Setter<boolean>
}

function RightBar({ show, showConfig }: RightBarProps) {
  const appWindow = getCurrentWebviewWindow()
  const [minimized, setMinimized] = createSignal(false)

  return (
    <div class='flex justify-end gap-4' data-tauri-drag-region>
      <TranslucentPanel
        class={
          'flex space-x-4 px-3 py-2 | ' +
          (show() ? 'expand-animation' : 'collapse-animation') +
          ' 0.5s ease-in-out forwards'
        }
      >
        <button
          class='opacity-70 hover:opacity-100 hidden | toHide'
          onClick={() => showConfig(true)}
        >
          <Cog class='size-5 stroke-[1.5px]' />
        </button>
        <div class={'controls flex gap-4'}>
          <button
            id='titlebar-minimize'
            title='minimize'
            onClick={() => appWindow.minimize()}
          >
            <img class='size-3' src={minimizeIcon} alt='' />
          </button>
          <button
            id='titlebar-maximize'
            title='maximize'
            onClick={() => {
              appWindow.toggleMaximize()
              setMinimized(!minimized())
            }}
          >
            {minimized() ? (
              <img class='size-3' src={restoreIcon} alt='' />
            ) : (
              <img class='size-3' src={maximizeIcon} alt='' />
            )}
          </button>

          <button
            id='titlebar-close'
            title='close'
            onClick={() => appWindow.close()}
          >
            <img class='size-3' src={closeIcon} alt='' />
          </button>
        </div>
      </TranslucentPanel>
    </div>
  )
}

export default RightBar
