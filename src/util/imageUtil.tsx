import { invoke } from '@tauri-apps/api/core'
import { MediaInfo, SortByOptions } from '../types/media'

export type IndexedMediaList = {
  items: MediaInfo[]
  index: number
}

export async function getImageIndex(
  folder_path: string,
  sort_by: SortByOptions,
  recursive: boolean,
  imagePath: string
): Promise<IndexedMediaList> {
  try {
    const result: IndexedMediaList = await invoke('list_image_index', {
      imagePath: imagePath + '',
      folderPath: folder_path,
      sb: sort_by,
      recursive: recursive,
    })
    return result
  } catch (err) {
    console.error('Error reading images:', err)
  }

  return { items: [], index: 0 }
}
