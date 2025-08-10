<script lang="ts">
  interface Props {
    items: { label: string; color: string }[]
    x: number
    y: number
    rowHeight: number
  }

  const { items, x = 0, y = 0, rowHeight = 0 }: Props = $props()
</script>

<g>
  {#each items as item, i}
    <circle cx={x} cy={y + i * rowHeight} r={0.1} fill={item.color} />
    <text
      x={x + 0.25}
      y={y + i * rowHeight}
      alignment-baseline="middle"
      font-size={0.25}
      fill={item.color}
    >
      {item.label}
    </text>
  {/each}
</g>
