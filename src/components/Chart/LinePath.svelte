<script lang="ts">
  import type { Range } from './utils'

  export interface LinePathData {
    xs: number[]
    ys: number[]
  }

  interface Props {
    data: LinePathData
    dateRange: Range
    valueRange: Range
    strokeWidth: number
    color: string
    height: number
    top: number
    width: number
    left: number
  }

  const {
    data,
    dateRange,
    valueRange,
    strokeWidth,
    color,
    height,
    top,
    width,
    left,
  }: Props = $props()

  const linePath = (
    data: LinePathData,
    dateRange: Range,
    valueRange: Range
  ) => {
    if (data.xs.length !== data.ys.length)
      console.error('Misaligned points in Chart LinePath')

    let path = ''
    let started = false

    for (let i = 0; i < data.xs.length; i++) {
      let x =
        ((data.xs[i] - dateRange.min) / (dateRange.max - dateRange.min)) *
          width +
        left

      let y =
        (1 -
          (data.ys[i] - valueRange.min) / (valueRange.max - valueRange.min)) *
          height +
        top

      path += (!started ? 'M ' : ' L ') + x + ',' + y
      started = true
    }

    return path
  }

  const dAttr = $derived(linePath(data, dateRange, valueRange))
</script>

<path fill="none" stroke={color} stroke-width={strokeWidth} d={dAttr} />
