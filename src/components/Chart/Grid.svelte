<script lang="ts">
  import { verticalGridLines, horizontalGridLines, colors } from './utils'

  interface Props {
    xCount: number
    yCount: number
    width: number
    height: number
    strokeWidth?: number
  }

  const { xCount, yCount, width, height, strokeWidth = 0.025 }: Props = $props()
</script>

<path
  fill="none"
  stroke={colors.grid}
  stroke-width={strokeWidth}
  d={`${verticalGridLines(xCount, width, 0, height)} ${horizontalGridLines(yCount, height, 0, width)}`}
/>
