<script lang="ts">
  import toast from 'svelte-french-toast'
  import type { GraphData } from '../../stores/graphData.svelte'
  import {
    runBacktest,
    metalCrossoverStrategy,
    type BacktestResult,
  } from '../../backtesting'
  import Legend from './Legend.svelte'
  import { type Range } from './utils'
  import AxisLeft from './AxisLeft.svelte'
  import LinePath from './LinePath.svelte'
  import AxisBottom from './AxisBottom.svelte'
  import Grid from './Grid.svelte'

  interface Props {
    graphData: GraphData
    graphSize: {
      w: number
      h: number
      backtestResultHeightRatio: number
    }
  }

  let { graphData, graphSize }: Props = $props()

  let backtestResult = $state<BacktestResult | null>(null)

  const handleRunBacktest = () => {
    const sounds = ['rewind_time.mp3', 'bizness.mp3']
    new Audio(sounds[Math.floor(Math.random() * sounds.length)]).play()

    if (graphData.series.length < 2) {
      toast.error('Load at least 2 datasets for crossover strategy')
      return
    }
    backtestResult = runBacktest({
      datasets: graphData.series,
      strategy: metalCrossoverStrategy,
      cash: 10_000,
      commission: 0.0,
      tradeOnClose: false,
      normalize: true,
    })
  }

  const gridDim = { x: 10, y: 10 }
  const backtestGridDim = { x: gridDim.x, y: 3 }

  const dateRange = $derived({
    min: graphData.series.reduce(
      (acc, curr) => Math.min(acc, curr.date.at(0) ?? Infinity),
      Infinity
    ),
    max: graphData.series.reduce(
      (acc, curr) => Math.max(acc, curr.date.at(-1) ?? -Infinity),
      -Infinity
    ),
  })

  const backtestPlotValueRange: Range = $derived(
    backtestResult
      ? {
          min: backtestResult.timeSeries.reduce(
            (acc, curr) => Math.min(acc, curr.cash, curr.portfolioValue),
            Infinity
          ),
          max: backtestResult.timeSeries.reduce(
            (acc, curr) => Math.max(acc, curr.cash, curr.portfolioValue),
            -Infinity
          ),
        }
      : {
          min: 0,
          max: 1,
        }
  )
</script>

<svg
  viewBox={`0 0 ${graphSize.w} ${graphSize.h}`}
  xmlns="http://www.w3.org/2000/svg"
  class="chart-svg"
>
  <!-- Top Backtest result plot -->
  {#if backtestResult}
    <Grid
      xCount={backtestGridDim.x}
      yCount={backtestGridDim.y}
      width={graphSize.w}
      height={graphSize.h *
        (backtestResult ? graphSize.backtestResultHeightRatio : 1)}
    />

    <AxisLeft
      tickCount={backtestGridDim.y}
      valueRange={backtestPlotValueRange}
      height={graphSize.h * graphSize.backtestResultHeightRatio}
      top={0}
      x={-1}
      alignLastInside={true}
    />

    {#each [{ timeSeriesKey: 'portfolioValue', color: 'green' }, { timeSeriesKey: 'cash', color: 'red' }] as series}
      <LinePath
        data={{
          xs: backtestResult.timeSeries.map((ts) => ts.date),
          ys: backtestResult.timeSeries.map((ts) => ts[series.timeSeriesKey]),
        }}
        {dateRange}
        valueRange={backtestPlotValueRange}
        strokeWidth={0.025}
        color={series.color}
        height={graphSize.h * graphSize.backtestResultHeightRatio}
        top={0}
        width={graphSize.w}
        left={0}
      />
    {/each}
  {/if}

  <!-- Datasets plot -->
  <g
    transform={`translate(0, ${graphSize.h * (backtestResult ? graphSize.backtestResultHeightRatio : 0)})`}
  >
    <Grid
      xCount={gridDim.x}
      yCount={gridDim.y}
      width={graphSize.w}
      height={graphSize.h *
        (backtestResult ? 1 - graphSize.backtestResultHeightRatio : 1)}
    />
  </g>

  {#each graphData.series as data, i}
    {#key Object.keys(graphData.series).length}
      <Legend
        items={graphData.series.map((ds) => ({
          label: ds.name,
          color: ds.color,
        }))}
        x={0.4}
        y={0.4 +
          (backtestResult
            ? graphSize.h * graphSize.backtestResultHeightRatio
            : 0)}
        rowHeight={0.4}
      />

      <AxisLeft
        tickCount={gridDim.y}
        valueRange={{ min: graphData.meta.min, max: graphData.meta.max }}
        height={backtestResult
          ? graphSize.h * (1 - graphSize.backtestResultHeightRatio)
          : graphSize.h}
        top={backtestResult
          ? graphSize.h * graphSize.backtestResultHeightRatio
          : 0}
        x={-1}
        alignFirstInside={backtestResult !== null}
      />

      <LinePath
        data={{ xs: data.date, ys: data.close }}
        {dateRange}
        valueRange={{ min: graphData.meta.min, max: graphData.meta.max }}
        strokeWidth={0.025}
        color={data.color}
        height={graphSize.h *
          (backtestResult ? 1 - graphSize.backtestResultHeightRatio : 1)}
        top={backtestResult
          ? graphSize.h * graphSize.backtestResultHeightRatio
          : 0}
        width={graphSize.w}
        left={0}
      />
    {/key}
  {/each}

  <!-- Date labels -->
  {#if graphData.series[0]?.date.length}
    <AxisBottom
      tickCount={gridDim.x}
      {dateRange}
      y={graphSize.h + 0.2}
      width={graphSize.w}
    />
  {/if}
</svg>

<button onclick={handleRunBacktest}>Run Metal Crossover Backtest</button>
{#if backtestResult}
  <button
    onclick={() => {
      backtestResult = null
    }}>Clear Backtest Result</button
  >
  <div>
    <p>
      Final Equity: ${backtestResult.timeSeries
        .at(-1)
        ?.portfolioValue.toFixed(2)}
    </p>
    <p>
      Total Return: {(
        (backtestResult.timeSeries.at(-1)?.portfolioValue /
          backtestResult.timeSeries[0].cash) *
        100
      ).toFixed(2)}%
    </p>
  </div>
{/if}
