import { Component, For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { MediaInfo } from '../types/media'
import { Video } from 'lucide-solid'

interface GalleryProps {
  images: MediaInfo[]
  currentPath: string | undefined
  onSelect: (index: number) => void
  show: boolean
  onClose: () => void
}

const SERVER_URL = 'http://127.0.0.1:3001/media?path='

function isVideo(path: string) {
  const videoExtensions = [
    '.mp4',
    '.avi',
    '.mkv',
    '.mov',
    '.wmv',
    '.flv',
    '.webm',
  ]
  return videoExtensions.some(ext => path.toLowerCase().endsWith(ext))
}

const Gallery: Component<GalleryProps> = props => {
  let containerRef: HTMLDivElement | undefined
  const [scrollTop, setScrollTop] = createSignal(0)
  const [containerWidth, setContainerWidth] = createSignal(0)

  // Layout constants
  const MIN_ITEM_WIDTH = 200
  const GAP = 16 // gap-4
  const PADDING = 32 // p-4 on container

  const updateDimensions = () => {
    if (containerRef) {
      setContainerWidth(containerRef.clientWidth)
    }
  }

  onMount(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
  })

  onCleanup(() => {
    window.removeEventListener('resize', updateDimensions)
  })

  const layout = createMemo(() => {
    const width = Math.min(containerWidth(), 1600 + PADDING) - PADDING
    const columns = Math.max(1, Math.floor((width + GAP) / (MIN_ITEM_WIDTH + GAP)))
    const itemWidth = (width - (columns - 1) * GAP) / columns
    const rowHeight = itemWidth + GAP
    return { columns, rowHeight }
  })

  const currentIndex = createMemo(() => {
    const idx = props.images.findIndex(img => img.path === props.currentPath)
    return idx === -1 ? 0 : idx
  })

  // Set initial scroll position when gallery opens
  createEffect(() => {
    if (props.show && containerRef && props.images.length > 0) {
      const { columns, rowHeight } = layout()
      const row = Math.floor(currentIndex() / columns)
      containerRef.scrollTop = row * rowHeight
    }
  })

  const displayRange = createMemo(() => {
    const { columns, rowHeight } = layout()
    const viewportHeight = containerRef?.clientHeight || 800
    
    const startRow = Math.floor(scrollTop() / rowHeight)
    const visibleRows = Math.ceil(viewportHeight / rowHeight)
    
    // We want ~50 images around the visible area
    // 50 images is roughly (50 / columns) rows
    const bufferRows = Math.max(2, Math.ceil(25 / columns))
    
    const start = Math.max(0, (startRow - bufferRows) * columns)
    const end = Math.min(props.images.length, (startRow + visibleRows + bufferRows) * columns)
    
    return { start, end }
  })

  const displayImages = createMemo(() => {
    const { start, end } = displayRange()
    return props.images.slice(start, end).map((image, i) => ({
      image,
      originalIndex: start + i,
    }))
  })

  const containerStyle = createMemo(() => {
    const { columns, rowHeight } = layout()
    const totalRows = Math.ceil(props.images.length / columns)
    return {
      height: `${totalRows * rowHeight}px`,
      position: 'relative' as const,
    }
  })

  const gridStyle = createMemo(() => {
    const { columns, rowHeight } = layout()
    const { start } = displayRange()
    const startRow = Math.floor(start / columns)
    return {
      'padding-top': `${startRow * rowHeight}px`,
    }
  })

  return (
    <Show when={props.show}>
      <div
        ref={containerRef}
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        class='fixed inset-0 bg-black/95 overflow-y-auto p-4 pt-24 animate-in fade-in duration-200 z-10'
        tabIndex={0}
      >
        <div style={containerStyle()}>
          <div 
            class='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 max-w-[1600px] mx-auto'
            style={gridStyle()}
          >
            <For each={displayImages()}>
              {({ image, originalIndex }) => {
                const isSelected = () => image.path === props.currentPath

                return (
                  <div
                    class={`
                      group relative aspect-square overflow-hidden rounded-xl cursor-pointer
                      transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20
                      ${isSelected() ? 'ring-4 ring-primary ring-offset-2 ring-offset-black' : 'hover:ring-2 hover:ring-white/50'}
                    `}
                    onClick={() => {
                      props.onSelect(originalIndex)
                      props.onClose()
                    }}
                  >
                    <img
                      src={`${SERVER_URL}${encodeURIComponent(image.path)}&size=400`}
                      alt={image.path.split('\\').pop()}
                      loading='lazy'
                      class='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                    />

                    <div class='absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3'>
                      <span class='text-white text-sm font-medium truncate select-none'>
                        {image.path.split('\\').pop()}
                      </span>
                      <div class='flex items-center justify-between mt-1 text-xs text-white/70'>
                        <span>
                          {new Date(image.modified).toLocaleDateString()}
                        </span>
                        <span>{(image.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    </div>
                    <Show when={isVideo(image.path)}>
                      <Video class='absolute bottom-2 right-3' />
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default Gallery
