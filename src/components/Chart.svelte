<script lang="ts">
  import { quartInOut } from "svelte/easing";
  import { draw } from "svelte/transition";
  import type { GraphData } from "../stores/graphData.svelte";

  interface Props {
    graphData: GraphData;
    graphSize: { w: number; h: number };
  }

  let { graphData, graphSize }: Props = $props();

  const colors = ["red", "green", "blue", "yellow", "cyan", "purple"];
</script>

<svg
  viewBox={`0 0 ${graphSize.w} ${graphSize.h}`}
  xmlns="http://www.w3.org/2000/svg"
>
  <style>
    .label {
      font: italic 13px sans-serif;
    }
  </style>

  <path
    stroke={"#ffffff88"}
    stroke-width={"0.025px"}
    fill="none"
    d={Array.from({ length: 10 }).reduce((acc, _, i) => {
      return (
        acc +
        `M${(i / 10) * graphSize.w},${0} L${(i / 10) * graphSize.w},${graphSize.h} `
      );
    }, "") ?? ""}
  />

  {#each graphData.series as data, i}
    {#key Object.keys(graphData.series).length}
      <text x="20" y="35">{new Date(data.date[0])}</text>
      <text x="0" y={i * graphSize.h / 10} alignment-baseline="hanging"  font-size={graphSize.h / 10} fill={colors[i]}>{data.name}</text>

      <path
        transition:draw={{ duration: 1000, easing: quartInOut }}
        fill="none"
        stroke={colors[i % colors.length]}
        stroke-width={`${Math.min(graphSize.h, graphSize.w) / 256}px`}
        d={data.close.reduce(
          (acc: string, curr: number, i: number) =>
            acc +
            `${i > 0 ? " L " : " "}${(i / data.close.length) * graphSize.w},${
              graphSize.h -
              ((curr - graphData.meta.min) /
                (graphData.meta.max - graphData.meta.min || 1)) *
                graphSize.h
            }`,
          "M",
        )}
      />
    {/key}
  {/each}
</svg>
