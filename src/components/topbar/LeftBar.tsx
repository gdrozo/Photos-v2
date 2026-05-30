import {
  Trash2,
  FolderOpen,
  ArchiveRestore,
  Brush,
  ArrowDownWideNarrow,
  Bookmark,
  X,
  LayoutGrid,
} from 'lucide-solid'
import useAnimation from '../../hooks/useAnimation'
import { MediaInfo } from '../../types/media'
import TranslucentPanel from '../../generics/TranslucentPanel'
import { Accessor, Setter, Show } from 'solid-js'

// prop definitions
interface LeftBarProps {
  openImage: () => void
  openFolder: () => void
  restorePosition: () => void
  savePosition: () => void
  onDelete: () => void
  show: Accessor<boolean>
  setSortBy: Setter<string> | ((value: string) => void)
  sortBy: Accessor<string>
  setHidable: Setter<boolean>
  image: MediaInfo | null
  toggleGallery: () => void
  isGalleryOpen: Accessor<boolean>
}

function LeftBar(props: LeftBarProps) {
  const [leftBar, setAnimation] = useAnimation(() => {
    return props.show() ? 'expand-animation' : 'collapse-animation'
  })

  function onOrder() {
    setAnimation('order-animation')
    props.setHidable(false)
  }

  function onCloseOrder() {
    setAnimation('close-order-animation')
    props.setHidable(true)
  }

  return (
    <div class='flex items-center' data-tauri-drag-region>
      <TranslucentPanel
        class={
          'flex flex-col justify-center px-3 py-2 relative 0.5s ease-in-out forwards max-w-full'
        }
        ref={leftBar}
      >
        <div class='relative flex'>
          <button class='opacity-70 hover:opacity-100 overflow-hidden w-5 | toShow'>
            <Brush class='size-5 stroke-[1.5px]' />
          </button>

          <button
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide`}
            onClick={props.openImage}
            onContextMenu={props.openFolder}
          >
            <FolderOpen class='size-5 stroke-[1.5px]' />
          </button>

          <button
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide ${props.isGalleryOpen() ? 'text-primary opacity-100' : ''}`}
            onClick={props.toggleGallery}
            title='Toggle Gallery View'
          >
            <LayoutGrid class='size-5 stroke-[1.5px]' />
          </button>

          <button
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide`}
            onClick={props.restorePosition}
          >
            <ArchiveRestore class='size-5 stroke-[1.5px]' />
          </button>

          <button
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide`}
            onClick={props.savePosition}
          >
            <Bookmark class='size-5 stroke-[1.5px]' />
          </button>

          <button
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide`}
            onClick={props.onDelete}
          >
            <Trash2 class='size-5 stroke-[1.5px]' />
          </button>

          <button
            class={
              'opacity-70 hover:opacity-100 overflow-hidden w-5 | toHide order-button'
            }
            onClick={onOrder}
          >
            <ArrowDownWideNarrow class='size-5 stroke-[1.5px]' />
          </button>

          <div
            class={
              'opacity-70 hover:opacity-100 overflow-hidden text-sm ml-2 | stoHide'
            }
          >
            <Show when={props.image && props.image?.size}>
              {(() => {
                const i = props.image
                if (!i || i?.size === undefined) return
                const size = i.size
                return fromBytesToProperUnit(size)
              })()}
            </Show>
          </div>

          <button
            class={
              'opacity-70 hover:opacity-100 overflow-hidden w-5 hidden | close-button'
            }
            onClick={onCloseOrder}
          >
            <X class='size-5 stroke-[1.5px]' />
          </button>
        </div>

        <button
          disabled={props.sortBy() === 'Date'}
          class={`pl-2 pb-1 hidden text-start ${
            props.sortBy() === 'Date' ? 'chosen-order' : ''
          } | order-option`}
          onClick={() => props.setSortBy('Date')}
        >
          Date
        </button>
        <button
          disabled={props.sortBy() === 'Name'}
          class={`pl-2 pb-1 hidden text-start ${
            props.sortBy() === 'Name' ? 'chosen-order' : ''
          } | order-option`}
          onClick={() => props.setSortBy('Name')}
        >
          Name
        </button>
        <button
          disabled={props.sortBy() === 'Size'}
          class={`pl-2 pb-1 hidden text-start ${
            props.sortBy() === 'Size' ? 'chosen-order' : ''
          } | order-option`}
          onClick={() => props.setSortBy('Size')}
        >
          Size
        </button>
        <button
          disabled={props.sortBy() === 'Rating'}
          class={`pl-2 pb-1 hidden text-start ${
            props.sortBy() === 'Rating' ? 'chosen-order' : ''
          } | order-option`}
          onClick={() => props.setSortBy('Rating')}
        >
          Rating
        </button>
      </TranslucentPanel>
    </div>
  )
}

function fromBytesToProperUnit(bytes: number) {
  // No decimal point, all round to whole number
  // Convert bytes to MB if greater than 1Mb
  if (bytes > 1024 * 1024) {
    return Math.round(bytes / (1024 * 1024)) + 'MB'
  }

  // Convert bytes to KB if greater than 1Kb
  if (bytes > 1024) {
    return Math.round(bytes / 1024) + 'KB'
  }

  // Convert bytes to bytes if less than 1Kb
  return Math.round(bytes) + 'bytes'
}

export default LeftBar
