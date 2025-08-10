export const colors = {
  grid: '#ffffff77',
  labels: '#ffffff',
}

export interface Range {
  min: number
  max: number
}

export const verticalGridLines = (
  lineCount: number,
  width: number,
  y0: number,
  y1: number
): string =>
  Array.from({ length: lineCount + 1 })
    .map((_, i) => {
      return `M${(i / lineCount) * width},${y0} L${(i / lineCount) * width},${y1}`
    })
    .join(' ')

export const horizontalGridLines = (
  lineCount: number,
  height: number,
  x0: number,
  x1: number
): string =>
  Array.from({ length: lineCount + 1 })
    .map((_, i) => {
      return `M${x0},${(i / lineCount) * height} L${x1},${(i / lineCount) * height}`
    })
    .join(' ')
