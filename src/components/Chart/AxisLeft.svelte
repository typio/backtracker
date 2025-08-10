<script lang="ts">
  import { colors, type Range } from './utils'

  interface Props {
    tickCount: number
    valueRange: Range
    height: number
    top: number
    format?: (v: number) => string
    x?: number
    fontSize?: number
    alignFirstInside?: boolean
    alignLastInside?: boolean
  }

  const {
    tickCount,
    valueRange,
    height,
    top = 0,
    format = (v) => `$${v.toFixed(2)}`,
    x = 0,
    fontSize = 0.2,
    alignFirstInside = false,
    alignLastInside = false,
  }: Props = $props()
</script>

<g>
  {#each { length: tickCount }, i}
    <text
      {x}
      y={// labels are drawn in reverse so i is "backwards"
      top +
        (1 - i / (tickCount - 1)) * height +
        (alignFirstInside && i == tickCount - 1
          ? fontSize * 0.75
          : alignLastInside && i == 0
            ? -fontSize * 0.75
            : 0)}
      font-size={fontSize}
      fill={colors.labels}
      alignment-baseline={'middle'}
    >
      {format(
        (i / (tickCount - 1)) * (valueRange.max - valueRange.min) +
          valueRange.min
      )}
    </text>
  {/each}
</g>
