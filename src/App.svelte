<script lang="ts">
  import { Toaster } from "svelte-french-toast";
  import Header from "./components/Header.svelte";
  import LoadCsvPopover from "./components/LoadCSVPopover.svelte";
  import FileUploader from "./components/FileUploader.svelte";
  import Chart from "./components/Chart.svelte";
  import DatasetList from "./components/DatasetList.svelte";
  import { GraphData } from "./stores/graphData.svelte";

  let graphData = new GraphData();
  let loadCSVPopover = $state({
    rawCSV: undefined,
    fieldMapping: undefined,
  });
</script>

<main>
  <Header />
  <div class='main'>
    <DatasetList series={graphData.series} onRemove={(i: number) => {
       graphData.series.splice(i, 1)
    }} />

    <div>
      <Chart {graphData} graphSize={{ w: 16, h: 9 }} />

      <div class="chart-controls">
        <FileUploader bind:loadCSVPopover {graphData} />
        <LoadCsvPopover bind:loadCSVPopover {graphData} />
      </div>
    </div>
  </div>

  <Toaster />
</main>

<style>
  .main {
    display: flex;
  }
</style>
