import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { MediaInfo, SortByOptions } from '../types/media'
import { removeAtIndex } from '../util/arrayUtil'
import { getImageIndex } from '../util/imageUtil'
import {
  listMediaFilesRecursive,
  nukeFile,
  watchDirectory,
  onDirectoryChanged,
  listMediaFiles,
  moveAs,
} from '../util/fileUtil'
import { setRating as saveRating } from '../util/ratingUtil'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import useConfiguration from './useConfiguration'

export enum OpenType {
  Image,
  Folder,
}

export default function useGallery(sort_by: SortByOptions) {
  const [folderPath, setFolderPath] = createSignal<string | null>(null)

  const [imagesState, setImagesState] = createSignal<MediaInfo[]>([])
  const [imagesStateId, setImagesStateId] = createSignal(0)

  const [imageIndex, setImageIndex] = createSignal<number | null>(null)
  const [leftEnabled, setLeftEnabled] = createSignal<boolean>(false)
  const [rightEnabled, setRightEnabled] = createSignal<boolean>(false)
  const [openType, setOpenType] = createSignal(OpenType.Image)

  const [lastOpenFolder, setLastOpenFolder] =
    useConfiguration('last_open_folder')

  window.reloadVersion = 0

  const [lastDirection, setLastDirection] = createSignal<string | undefined>(
    undefined,
  )

  createEffect(() => {
    ;(async () => {
      const startupFile: string = await invoke('get_startup_file')
      if (!startupFile || sort_by === undefined || imageIndex() !== null) return

      const folder = getFolderPath(startupFile)
      setFolderPath(folder)

      const { items, index } = await getImageIndex(
        folder,
        sort_by,
        false,
        startupFile,
      )

      setImageIndex(index)

      setLeftEnabled(index > 0)
      setRightEnabled(items.length > 1 && index < items.length - 1)

      setImagesState(items)
    })()
  })

  // Watch for folder changes
  createEffect(() => {
    const folder = folderPath()
    if (folder) {
      watchDirectory(folder)
    }
  })

  // Listen for directory update events
  createEffect(() => {
    if (!folderPath()) return

    let unlisten: (() => void) | undefined

    const setupListener = async () => {
      unlisten = await onDirectoryChanged(payload => {
        let ver = parseInt(payload.payload)

        console.log('reloadVersion: ' + window.reloadVersion)
        console.log('ver: ' + ver)

        if (window.reloadVersion >= ver) return

        window.reloadVersion = ver
        const folder = folderPath()
        if (!folder) return

        if (openType() === OpenType.Folder) internalOpenFolderRecusive(folder)
        else openFolder(folder)
      })
    }

    setupListener()

    onCleanup(() => {
      if (unlisten) unlisten()
    })
  })

  const openImage = async () => {
    try {
      const selected = await open({
        multiple: false,
        defaultPath: lastOpenFolder(),
        filters: [
          {
            name: 'Image',
            extensions: [
              'png',
              'jpeg',
              'jpg',
              'gif',
              'bmp',
              'webp',
              'mp4',
              'm4v',
              'MP4',
              'webm',
            ],
          },
        ],
      })

      if (!selected) return
      setLastOpenFolder(getParentFolder(selected))
      openGivenImage(selected)
    } catch (error) {
      console.error('Error opening image:', error)
    }
  }

  function getParentFolder(path: string) {
    return path.substring(0, path.lastIndexOf('\\'))
  }

  async function openGivenImage(path: string) {
    const folder = getParentFolder(path)
    setFolderPath(folder)

    const { items, index } = await getImageIndex(folder, sort_by, false, path)

    setImageIndex(index)

    setLeftEnabled(index > 0)
    setRightEnabled(items.length > 1 && index < items.length - 1)

    setImagesState(items)
  }

  async function reOrder(newSortBy: SortByOptions) {
    let iInx = imageIndex()
    if (iInx === null) return
    const current = imagesState()[iInx]

    const folder = folderPath()
    if (!folder) return

    const { items, index } = await getImageIndex(
      folder,
      newSortBy,
      openType() === OpenType.Folder,
      current.path,
    )

    setImageIndex(index)

    setLeftEnabled(index > 0)
    setRightEnabled(items.length > 1 && index < items.length - 1)

    setImagesState(items)
  }

  function onLeftClick() {
    setLastDirection('left')
    const nextImage = (imageIndex() || 0) - 1

    if (nextImage < 0) return
    setImageIndex(nextImage)

    setLeftEnabled(nextImage > 0)

    setRightEnabled(
      imagesState().length > 1 && nextImage < imagesState().length - 1,
    )
  }

  function onHome(images?: MediaInfo[]) {
    let is = images ? images : imagesState()

    setLastDirection('left')
    const nextImage = 0

    if (nextImage < 0) return
    setImageIndex(nextImage)

    setLeftEnabled(nextImage > 0)

    setRightEnabled(is.length > 1 && nextImage < is.length - 1)
  }

  function onEnd() {
    setLastDirection('right')
    let nextImage = imagesState().length - 1

    if (nextImage >= imagesState().length) return
    setImageIndex(nextImage)

    setLeftEnabled(nextImage > 0)

    setRightEnabled(
      imagesState().length > 1 && nextImage < imagesState().length - 1,
    )
  }

  async function removeMedia() {
    const iInx = imageIndex()

    if (iInx === null) return

    if (iInx === imagesState().length - 1) {
      if (iInx === 0) {
        setImageIndex(null)
      } else {
        setImageIndex(iInx - 1)
      }
    } else if (lastDirection() === 'left' && iInx > 0) {
      setImageIndex(iInx - 1)
    }
    setImagesStateId(imagesStateId() + 1)
    setImagesState(removeAtIndex(imagesState(), iInx))
  }

  async function nukeImage() {
    if (imageIndex() === null) return
    window.reloadVersion++
    // will throw if index invalid, but keep same behaviour as original
    const success = await nukeFile(imagesState()[imageIndex() || 0]?.path)

    if (!success) return

    removeMedia()
  }

  function onRightClick() {
    setLastDirection('right')
    let nextImage = (imageIndex() || 0) + 1

    if (nextImage >= imagesState().length) return
    setImageIndex(nextImage)

    setLeftEnabled(nextImage > 0)

    setRightEnabled(
      imagesState().length > 1 && nextImage < imagesState().length - 1,
    )
  }

  type SavedPosition = {
    path: string
    type: OpenType
    index: number
    folder: string
  }

  function stringifyPosition(position: SavedPosition) {
    return JSON.stringify(position)
  }

  function savePosition() {
    const iInx = imageIndex()
    const fPath = folderPath()

    if (iInx === null) return

    if (imagesState()[iInx] === undefined) return
    if (fPath === undefined || fPath === null) return

    localStorage.setItem(
      'savedImage',
      stringifyPosition({
        folder: fPath,
        path: imagesState()[iInx].path,
        type: openType(),
        index: iInx,
      }),
    )
  }

  async function restorePosition() {
    const savedImage = localStorage.getItem('savedImage')
    if (savedImage === null) return

    const info = JSON.parse(savedImage) as SavedPosition
    const openType = info.type === 0 ? OpenType.Image : OpenType.Folder
    setOpenType(openType)

    if (openType === OpenType.Image) openGivenImage(info.path)
    else {
      setFolderPath(info.folder)
      listMediaFilesRecursive(info.folder, sort_by).then(files => {
        setImagesState(files)
        setImageIndex(info.index)

        if (info.index < 0) return
        if (info.index > files.length - 1) return

        setLeftEnabled(info.index > 0)

        setRightEnabled(info.index < files.length - 1)
      })
    }
  }

  function getFolderPath(path: string) {
    return path.substring(0, path.lastIndexOf('\\'))
  }

  function openFolderRecusive() {
    open({
      multiple: false,
      directory: true,
      defaultPath: lastOpenFolder(),
    }).then(folder => {
      if (!folder) return
      setLastOpenFolder(folder)
      internalOpenFolderRecusive(folder)
    })
  }

  function openFolder(folder: string) {
    const iInx = imageIndex()

    if (iInx === null) return

    setFolderPath(folder)
    listMediaFiles(folder, sort_by).then(files => {
      setImagesState(files)

      if (iInx === null) {
        onHome(files)
        return
      }

      if (iInx >= files.length) {
        if (iInx - 1 >= files.length || iInx - 1 < 0) {
          onHome(files)
          return
        }
        setImageIndex(iInx - 1)
        return
      }
    })
  }

  function internalOpenFolderRecusive(folder: string) {
    setFolderPath(folder)
    listMediaFilesRecursive(folder, sort_by).then(files => {
      setImagesState(files)
      onHome(files)
    })
  }

  async function updateRating(index: number, rating: number) {
    const item = imagesState()[index]
    if (!item) return

    await saveRating(item.path, rating)

    setImagesState(prev => {
      const next = [...prev]
      if (next[index]) {
        next[index] = { ...next[index], rating }
      }
      return next
    })
  }

  async function moveImage(index: number, direction: 'forward' | 'backward') {
    if (imagesState().length < 2) return
    const neighborIndex = direction === 'forward' ? index - 1 : index + 1
    if (neighborIndex < 0 || neighborIndex >= imagesState().length) return

    const current = imagesState()[index]
    const neighbor = imagesState()[neighborIndex]

    let newRating: number
    if (direction === 'forward') {
      newRating = neighbor.rating + 1
    } else {
      newRating = neighbor.rating - 1
    }

    await saveRating(current.path, newRating)

    const updatedCurrent = { ...current, rating: newRating }
    setImagesState(prev => {
      const next = [...prev]
      const temp = updatedCurrent
      next[index] = next[neighborIndex]
      next[neighborIndex] = temp
      return next
    })
  }

  async function moveToExtreme(index: number, direction: 'front' | 'end') {
    if (imagesState().length < 2) return
    const current = imagesState()[index]
    if (!current) return

    let newRating: number
    if (direction === 'front') {
      newRating = (imagesState()[0]?.rating ?? 0) + 1
    } else {
      newRating = (imagesState()[imagesState().length - 1]?.rating ?? 0) - 1
    }

    await saveRating(current.path, newRating)

    const updatedCurrent = { ...current, rating: newRating }
    setImagesState(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (direction === 'front') {
        next.unshift(updatedCurrent)
      } else {
        next.push(updatedCurrent)
      }
      return next
    })
  }

  async function moveFile(path: string, defaultDir?: string) {
    window.reloadVersion++

    const result = await moveAs(path, defaultDir)
    if (result === false) {
      window.reloadVersion--
      return false
    }

    console.log('File moved to ' + result)

    console.log('reloadVersion: ' + window.reloadVersion)

    return result
  }

  return {
    folderPath,
    imagesState,
    imagesStateId,
    imageIndex,
    leftEnabled,
    rightEnabled,
    openType,
    setOpenType,
    openImage,
    reOrder,
    onLeftClick,
    onRightClick,
    onHome,
    onEnd,
    nukeImage,
    removeMedia,
    savePosition,
    restorePosition,
    openFolder: openFolderRecusive,
    setFolderPath,
    setImagesState,
    setImageIndex,
    updateRating,
    moveImageForward: (index: number) => moveImage(index, 'forward'),
    moveImageBackward: (index: number) => moveImage(index, 'backward'),
    moveToFront: (index: number) => moveToExtreme(index, 'front'),
    moveToEnd: (index: number) => moveToExtreme(index, 'end'),
    lastDirection,
    setLastDirection,
    moveFile,
  }
}
