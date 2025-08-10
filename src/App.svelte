<script lang="ts">
  import { Toaster } from 'svelte-french-toast'
  import Header from './components/Header.svelte'
  import LoadCsvPopover from './components/LoadCSVPopover.svelte'
  import FileUploader from './components/FileUploader.svelte'
  import Chart from './components/Chart/Chart.svelte'
  import DatasetList from './components/DatasetList.svelte'
  import { GraphData } from './stores/graphData.svelte'

  let graphData = new GraphData()

  let loadCSVPopover = $state({
    rawCSV: undefined,
    fieldMapping: undefined,
    color: undefined,
  })

  let sidebarOpen = $state(true)
</script>

<Header bind:sidebarOpen />

<div class="content-area">
  <div class="sidebar">
    <DatasetList
      {sidebarOpen}
      series={graphData.series}
      onRemove={(i: number) => {
        graphData.series.splice(i, 1)
      }}
      onRemoveAll={() => {
        graphData.series.splice(0, graphData.series.length)
      }}
    />
  </div>

  <div class="main" style:margin-left={sidebarOpen ? '200px' : '40px'}>
    <Chart
      {graphData}
      graphSize={{ w: 16, h: 9, backtestResultHeightRatio: 0.25 }}
    />

    <FileUploader bind:loadCSVPopover {graphData} />
  </div>
</div>

<LoadCsvPopover bind:loadCSVPopover {graphData} />

<Toaster />

<style>
  .content-area {
    display: flex;
    flex-direction: row;
    height: 100%;
  }

  .main {
    max-width: 1280px;
    padding: 8rem 2rem 2rem 4rem;
    text-align: center;

    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
    text-align: center;
    flex: 1;

    transition: margin-left 0.3s ease-in-out;
  }
</style>
