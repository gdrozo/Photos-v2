import {
  Trash2,
  FolderOpen,
  Folder,
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
import { Accessor, Setter, Show, createSignal } from 'solid-js'

// prop definitions
interface LeftBarProps {
  openImage: () => void
  openFolder: () => void
  openFolderByPath: (folder: string) => void
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

  const [showDropdown, setShowDropdown] = createSignal(false)
  const [recentFolders, setRecentFolders] = createSignal<string[]>([])

  const loadRecentFolders = () => {
    try {
      const recentStr = localStorage.getItem('recent_folders')
      if (recentStr) {
        const parsed = JSON.parse(recentStr)
        if (Array.isArray(parsed)) {
          setRecentFolders(parsed)
          return
        }
      }
    } catch (e) {
      console.error(e)
    }
    setRecentFolders([])
  }

  const getFolderName = (path: string) => {
    const parts = path.split(/[\\/]/)
    return parts[parts.length - 1] || path
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

          <div
            class='relative mr-3 flex items-center'
            onMouseEnter={() => {
              loadRecentFolders()
              setShowDropdown(true)
            }}
            onMouseLeave={() => setTimeout(() => setShowDropdown(false), 300)}
          >
            <button
              class={`hover:opacity-100 overflow-hidden w-5 opacity-70  | toHide`}
              onClick={props.openImage}
              onContextMenu={props.openFolder}
              title='Left Click: Open Image | Right Click: Open Folder'
            >
              <FolderOpen class='size-5 stroke-[1.5px]' />
            </button>

            <div class='absolute h-10 w-10 top-full'></div>

            <Show when={showDropdown() && recentFolders().length > 0}>
              <div class='absolute left-0 top-full -ml-3 mt-2 w-80 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 transition-all duration-300'>
                <div class='px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white/45 uppercase border-b border-white/5 pb-1.5 mb-0.5'>
                  Recent Folders
                </div>
                <div class='flex flex-col gap-0.5 max-h-60 overflow-y-auto'>
                  {recentFolders().map(folder => (
                    <button
                      class='flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-all duration-200 group/item w-full'
                      onClick={() => {
                        props.openFolderByPath(folder)
                        setShowDropdown(false)
                      }}
                      title={folder}
                    >
                      <Folder class='size-4 text-white/50 group-hover/item:text-white/95 stroke-[1.5px] shrink-0' />
                      <div class='flex flex-col min-w-0 flex-1'>
                        <span class='text-xs font-semibold text-white/80 group-hover/item:text-white truncate'>
                          {getFolderName(folder)}
                        </span>
                        <span class='text-[9px] text-white/40 group-hover/item:text-white/60 truncate'>
                          {folder}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Show>
          </div>

          <button
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide`}
            onClick={props.restorePosition}
            title='Restore Position'
          >
            <ArchiveRestore class='size-5 stroke-[1.5px]' />
          </button>

          <button
            disabled={!props.image}
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide ${props.isGalleryOpen() ? 'text-white' : ''} ${!props.image ? 'text-white/70 cursor-not-allowed pointer-events-none' : ''}`}
            onClick={props.toggleGallery}
            title='Toggle Gallery View'
          >
            <LayoutGrid class='size-5 stroke-[1.5px]' />
          </button>

          <button
            disabled={!props.image}
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide ${!props.image ? 'text-white/70 cursor-not-allowed pointer-events-none' : ''}`}
            onClick={props.savePosition}
            title='Save Position'
          >
            <Bookmark class='size-5 stroke-[1.5px]' />
          </button>

          <button
            disabled={!props.image}
            class={`hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide ${!props.image ? 'text-white/70 cursor-not-allowed pointer-events-none' : ''}`}
            onClick={props.onDelete}
            title='Delete'
          >
            <Trash2 class='size-5 stroke-[1.5px]' />
          </button>

          <button
            disabled={!props.image}
            class={`order-button hover:opacity-100 overflow-hidden w-5 mr-3 opacity-70 | toHide ${!props.image ? 'text-white/70 cursor-not-allowed pointer-events-none' : ''}`}
            onClick={onOrder}
            title='Order'
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
