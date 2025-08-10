<script lang="ts">
  import { colors, type Range } from './utils'

  interface Props {
    tickCount: number
    dateRange: Range
    y: number
    width: number
    fontSize?: number
    format?: (v: number) => string
  }

  const {
    tickCount,
    dateRange,
    y,
    width,
    fontSize = 0.2,
    format = (date: number) =>
      new Date(date).toLocaleDateString(undefined, { dateStyle: 'short' }),
  }: Props = $props()
</script>

<g>
  {#each { length: tickCount }, i}
    <text
      x={(i / (tickCount - 1)) * width}
      {y}
      font-size={fontSize}
      fill={colors.labels}
      text-anchor={'middle'}
      alignment-baseline={'hanging'}
    >
      {format(
        (i / (tickCount - 1)) * (dateRange.max - dateRange.min) + dateRange.min
      )}
    </text>
  {/each}
</g>
