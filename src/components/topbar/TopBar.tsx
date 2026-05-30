import { getCurrentWindow } from '@tauri-apps/api/window'
import './TopBar.css'
import onKeydown from '../../hooks/useKeydown'
import LeftBar from './LeftBar'
import { MediaInfo } from '../../types/media'
import CenterBar from './CenterBar'
import RightBar from './RightBar'
import { Accessor, Setter } from 'solid-js'

// prop definitions
interface TopBarProps {
  openImage: () => void
  openFolder: () => void
  savePosition: () => void
  restorePosition: () => void
  onDelete: () => void
  show: Accessor<boolean>
  setHidable: Setter<boolean>
  showConfig: Setter<boolean>
  setSortBy: Setter<string> | ((value: string) => void)
  imageName: MediaInfo | null
  sortBy: Accessor<string>
  toggleGallery: () => void
  isGalleryOpen: Accessor<boolean>
}

function TopBar(props: TopBarProps) {
  const appWindow = getCurrentWindow()

  onKeydown({ Escape: () => appWindow.close() })

  function onMouseEnter() {
    props.setHidable(false)
  }

  function onMouseLeave() {
    props.setHidable(true)
  }

  return (
    <div
      class='fixed top-0 left-0 right-0 z-20'
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div class='hidden expand-animation'></div>
      <div
        data-tauri-drag-region
        class='grid grid-cols-[25%_50%_25%] justify-items-stretch items-start p-2 h-full'
      >
        <LeftBar
          openImage={props.openImage}
          openFolder={props.openFolder}
          restorePosition={props.restorePosition}
          savePosition={props.savePosition}
          onDelete={props.onDelete}
          show={props.show}
          setSortBy={props.setSortBy}
          sortBy={props.sortBy}
          setHidable={props.setHidable}
          image={props.imageName}
          toggleGallery={props.toggleGallery}
          isGalleryOpen={props.isGalleryOpen}
        />
        <CenterBar imageName={props.imageName} show={props.show} />
        <RightBar show={props.show} showConfig={props.showConfig} />
      </div>
    </div>
  )
}

export default TopBar
