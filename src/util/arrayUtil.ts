export function removeAtIndex(arr: any[], index: number) {
  if (index < 0 || index >= arr.length) {
    throw new Error('Index out of range, genius.')
  }
  const newArr = [...arr]
  newArr.splice(index, 1)
  return newArr
}
