import { save } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { MediaInfo, SortByOptions } from '../types/media'
import { IndexedMediaList } from './imageUtil'

export async function saveAs(
  path: string,
  defaultDir?: string,
): Promise<string | undefined> {
  const fileName = path.split('\\').pop()

  const extension = path.split('.').pop()?.toLowerCase()

  if (!extension) return

  // Ask user where to save
  const filePath = await save({
    filters: [{ name: 'Media File', extensions: [extension] }],
    defaultPath: defaultDir ? `${defaultDir}\\${fileName}` : fileName,
  })

  if (!filePath) return // user cancelled

  const cleanedPath = path.replace(/\\/g, '/')
  copyMediaFile(cleanedPath, filePath)
  return filePath
}

export async function moveAs(
  path: string,
  defaultDir?: string,
): Promise<string | boolean> {
  const fileName = path.split('\\').pop()

  const extension = path.split('.').pop()?.toLowerCase()

  if (!extension) return false

  // Ask user where to save
  const filePath = await save({
    filters: [{ name: 'Media File', extensions: [extension] }],
    defaultPath: defaultDir ? `${defaultDir}\\${fileName}` : fileName,
  })

  if (!filePath) return false // user cancelled

  const cleanedPath = path.replace(/\\/g, '/')
  const success = await moveMediaFile(cleanedPath, filePath)

  return success ? filePath : false
}

export async function nukeFile(filePath: string): Promise<boolean> {
  try {
    await invoke('delete_file', { path: filePath })
    console.log('File deleted successfully')
    return true
  } catch (err) {
    console.error('Failed to delete file:', err)
    return false
  }
}

export async function listMediaFiles(
  folderPath: string,
  sort_by: SortByOptions = SortByOptions.Date,
): Promise<MediaInfo[]> {
  try {
    const files: IndexedMediaList = await invoke('list_media_files', {
      dir: folderPath,
      sb: sort_by,
    })
    return files.items
  } catch (err) {
    console.error('Error fetching media files:', err)
    return []
  }
}

export async function listMediaFilesRecursive(
  folderPath: string,
  sort_by: SortByOptions = SortByOptions.Date,
): Promise<MediaInfo[]> {
  try {
    const files: IndexedMediaList = await invoke('list_media_files_recursive', {
      dir: folderPath,
      sb: sort_by,
    })
    return files.items
  } catch (err) {
    console.error('Error fetching media files:', err)
    return []
  }
}

async function moveMediaFile(src: string, dst: string): Promise<boolean> {
  try {
    await invoke('move_file_command', {
      src: src,
      dst: dst,
    })
    return true
  } catch (err) {
    return false
  }
}

async function copyMediaFile(src: string, dst: string) {
  try {
    await invoke('copy_file_command', {
      src: src,
      dst: dst,
    })
    console.log('File moved successfully')
  } catch (err) {
    console.error('Failed to move file:', err)
  }
}

export async function showInFolder(filePath: string) {
  try {
    await invoke('reveal_in_explorer', { path: filePath })
  } catch (err) {
    console.error('Failed to show file in folder:', err)
  }
}

export async function watchDirectory(path: string): Promise<void> {
  try {
    await invoke('watch_directory', { dir: path })
    console.log('Started watching directory:', path)
  } catch (err) {
    console.error('Failed to watch directory:', err)
  }
}

export async function onDirectoryChanged(
  callback: (payload: any) => void,
): Promise<UnlistenFn> {
  return await listen('dir-change', payload => {
    console.log('Directory changed event received')
    callback(payload)
  })
}
