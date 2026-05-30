export enum SortByOptions {
  Name = 'Name',
  Date = 'Date',
  Size = 'Size',
  Rating = 'Rating',
}

export type MediaInfo = {
  path: string
  size: number
  modified: Date
  rating: number
}

export function parseSortBy(sort_by?: string): SortByOptions {
  switch (sort_by) {
    case SortByOptions.Name:
      return SortByOptions.Name
    case SortByOptions.Date:
      return SortByOptions.Date
    case SortByOptions.Rating:
      return SortByOptions.Rating
    case SortByOptions.Size:
      return SortByOptions.Size
    default:
      return SortByOptions.Date
    //throw new Error('Invalid sort_by option: ' + sort_by)
  }
}
