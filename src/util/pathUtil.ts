export function getFolderPath(imagePath: string): string {
  // Normalize backslashes and remove trailing slashes
  const normalizedPath = imagePath.replace(/\\/g, '/').replace(/\/+$/, '')

  // Extract folder path by removing the file name
  const lastSlashIndex = normalizedPath.lastIndexOf('/')
  if (lastSlashIndex === -1) return '' // No folder found

  return normalizedPath.substring(0, lastSlashIndex)
}
