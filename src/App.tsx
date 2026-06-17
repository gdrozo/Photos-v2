import './App.css'
import Viewer from './Viewer'
import onKeydown from './hooks/useKeydown'
import useGallery, { OpenType } from './hooks/useGallery'
import useConfiguration from './hooks/useConfiguration'
import { parseSortBy } from './types/media'
import useAutoHideCursor from './hooks/useAutoHideCursor'
import TopBar from './components/topbar/TopBar'
import BottomBar from './BottomBar'
import { moveAs, saveAs } from './util/fileUtil'
import { createSignal, Show } from 'solid-js'
import { ViewerActions } from './Viewer'
import Gallery from './components/Gallery'

function App() {
  // configuration (persisted)
  const [sort_by, setSortByBase] = useConfiguration('sort_by', () => {}, 'Date')

  const [muted, setMuted] = useConfiguration('muted', () => {}, 'false')
  const [lastSaveFolder, setLastSaveFolder] =
    useConfiguration('last_save_folder')

  // local UI state
  const [showConfig, setShowConfig] = createSignal(false)
  const [showGallery, setShowGallery] = createSignal(false)
  const [hidable, setHidable] = createSignal(true)
  const [show, setShow] = createSignal(false)

  //if (sort_by === undefined) return <div>Loading...</div>

  // gallery state and actions encapsulated in a hook
  const gallery = useGallery(parseSortBy(sort_by()))

  // wrap the configuration setter so we also tell the gallery to reorder
  const setSortBy = (value: string) => {
    setSortByBase(value)

    if (gallery) gallery.reOrder(parseSortBy(value))
  }

  // auto hide cursor behaviour (moved to a hook)
  const cursorStyle = useAutoHideCursor(hidable, setShow)

  function toggleMute() {
    setMuted(`${!muted}`)
  }

  function onOpen(e: KeyboardEvent) {
    if (!e.ctrlKey) {
      gallery.setOpenType(OpenType.Image)
      gallery.openImage()
    } else {
      gallery.setOpenType(OpenType.Folder)
      gallery.openFolder()
    }
  }

  let viewerActions: ViewerActions | undefined

  async function onSave(e: KeyboardEvent) {
    const src = mediaSrc()
    if (!e.ctrlKey || !src) return

    let result: string | boolean | undefined
    if (e.shiftKey) {
      console.log('moving')
      result = await gallery.moveFile(src, lastSaveFolder())
    } else {
      result = await saveAs(src, lastSaveFolder())
    }

    console.log('Result of move: ', result)

    if (result === false) return

    if (result && typeof result === 'string') {
      const folder = result.substring(0, result.lastIndexOf('\\'))
      setLastSaveFolder(folder)
    }

    const direction = gallery.lastDirection()
    gallery.removeMedia()

    if (direction === 'right') {
      gallery.onRightClick()
    } else if (direction === 'left') {
      gallery.onLeftClick()
    }
  }

  // keyboard bindings
  onKeydown({
    o: onOpen,
    m: toggleMute,
    ArrowLeft: e => {
      if (e.ctrlKey) {
        const idx = gallery.imageIndex()
        if (idx !== null) gallery.moveToFront(idx)
      } else if (e.shiftKey) {
        viewerActions?.seek(false)
      } else if (e.altKey) {
        const idx = gallery.imageIndex()
        if (idx !== null) gallery.moveImageForward(idx)
      } else if (gallery.leftEnabled()) {
        document.body.style.cursor = ''
        gallery.onLeftClick()
      }
    },
    ArrowRight: e => {
      if (e.ctrlKey) {
        const idx = gallery.imageIndex()
        if (idx !== null) gallery.moveToEnd(idx)
      } else if (e.shiftKey) {
        viewerActions?.seek(true)
      } else if (e.altKey) {
        const idx = gallery.imageIndex()
        if (idx !== null) gallery.moveImageBackward(idx)
      } else if (gallery.rightEnabled()) {
        document.body.style.cursor = ''
        gallery.onRightClick()
      }
    },
    s: onSave,
    S: onSave,
    Delete: () => gallery.nukeImage(),
    Home: () => {
      if (gallery.leftEnabled()) {
        document.body.style.cursor = ''
        gallery.onHome()
      }
    },
    End: () => {
      if (gallery.rightEnabled()) {
        document.body.style.cursor = ''
        gallery.onEnd()
      }
    },
    ArrowUp: () => {
      const idx = gallery.imageIndex()
      if (idx !== null) gallery.moveImageForward(idx)
    },
    ArrowDown: () => {
      const idx = gallery.imageIndex()
      if (idx !== null) gallery.moveImageBackward(idx)
    },
  })

  const mediaSrc = () => gallery.imagesState()[gallery.imageIndex()!]?.path

  const imageName = () =>
    gallery.imageIndex() !== null
      ? gallery.imagesState()[gallery.imageIndex()!]
      : null

  let containerRef: HTMLElement | null = null

  return (
    <main
      ref={(el: HTMLElement) => (containerRef = el)}
      style={cursorStyle()}
      class='bg-black/50 h-dvh w-dvw text-white grid grid-rows-1 grid-cols-1 overflow-hidden'
    >
      <TopBar
        openImage={() => {
          gallery.setOpenType(OpenType.Image)
          gallery.openImage()
        }}
        openFolder={() => {
          gallery.setOpenType(OpenType.Folder)
          gallery.openFolder()
        }}
        imageName={imageName()}
        savePosition={gallery.savePosition}
        restorePosition={gallery.restorePosition}
        show={show}
        onDelete={gallery.nukeImage}
        setHidable={setHidable}
        showConfig={setShowConfig}
        setSortBy={setSortBy}
        sortBy={sort_by}
        toggleGallery={() => setShowGallery(!showGallery())}
        isGalleryOpen={showGallery}
      />

      <Show when={showGallery()}>
        <Gallery
          show={showGallery()}
          onClose={() => setShowGallery(false)}
          images={gallery.imagesState()}
          currentPath={mediaSrc()}
          onSelect={index => {
            gallery.setImageIndex(index)
            setShowGallery(false)
          }}
        />
      </Show>

      <Show
        when={
          gallery.imagesState().length > 0 &&
          gallery.imageIndex() !== null &&
          mediaSrc
        }
      >
        <Viewer
          ref={(actions: ViewerActions) => (viewerActions = actions)}
          mediaSrc={mediaSrc}
          leftEnabled={gallery.leftEnabled}
          rightEnabled={gallery.rightEnabled}
          onLeftClick={gallery.onLeftClick}
          onRightClick={gallery.onRightClick}
          onHome={gallery.onHome}
          onEnd={gallery.onEnd}
          nukeImage={gallery.nukeImage}
          muted={() => muted() === 'true'}
          show={show}
          sort_by={sort_by}
          onMutedChange={muted => setMuted(`${muted}`)}
          onMoveForward={() => {
            const idx = gallery.imageIndex()
            if (idx !== null) gallery.moveImageForward(idx)
          }}
          onMoveBackward={() => {
            const idx = gallery.imageIndex()
            if (idx !== null) gallery.moveImageBackward(idx)
          }}
          onMoveToFront={() => {
            const idx = gallery.imageIndex()
            if (idx !== null) gallery.moveToFront(idx)
          }}
          onMoveToEnd={() => {
            const idx = gallery.imageIndex()
            if (idx !== null) gallery.moveToEnd(idx)
          }}
          imageIndex={() => {
            const index = gallery.imageIndex()
            return index !== null ? index : -1
          }}
          totalImages={() => gallery.imagesState().length}
          containerRef={containerRef}
        />
      </Show>

      <Show when={gallery.imageIndex() !== null}>
        {show()}
        <BottomBar
          at={() => gallery.imageIndex() || -1}
          total={() => gallery.imagesState().length}
          show={show}
          setHidable={setHidable}
          setAt={gallery.setImageIndex}
        />
      </Show>

      {/* 
      
      <Show when={showConfig()}>
        <Config />
      </Show>
      */}
    </main>
  )
}

export default App
