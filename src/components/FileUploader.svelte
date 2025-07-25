<script lang="ts">
    import { onMount } from "svelte";
  import type { GraphData } from "../stores/graphData.svelte";
  import { createFieldMapping, loadCSV } from "../utils/csv";

  interface Props {
    loadCSVPopover: any;
    graphData: GraphData;
  }

  let { loadCSVPopover = $bindable(), graphData }: Props = $props();

  let files: FileList = $state();

  onMount(() => {
    const dropZoneEl = document.getElementById("file-drop-zone");

    if (dropZoneEl) {
      dropZoneEl.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      dropZoneEl.addEventListener("drop", async (e) => {
        e.preventDefault();

        let csv = "";
        let fileName = "";

        if (e.dataTransfer && e.dataTransfer.items) {
          const item = e.dataTransfer.items[0];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file !== null) {
              fileName = file.name;
              csv = await file?.text();
            }
          } else if (item.kind === "text") {
            item.getAsString((str) => {
              csv = str;
            });
          }
        }

        let loadedCSV = loadCSV(csv, fileName);

        if (loadedCSV.error) {
          toast.error(loadedCSV.error);
          return;
        } else {
          loadCSVPopover.rawCSV = loadedCSV;
        }

        loadCSVPopover.fieldMapping = createFieldMapping(
          loadCSVPopover.rawCSV.fieldNames,
        );

        document.getElementById("load-csv")?.showPopover();
      });
    }
  });

  // Handle files from upload button
  $effect(() => {
    if (files?.[0]) {
      console.log("effect");
      files[0].text().then((csv) => {
        const loaded = loadCSV(csv, files[0].name);
        if (!loaded.error) {
          loadCSVPopover.rawCSV = loaded;

          loadCSVPopover.fieldMapping = createFieldMapping(
            loadCSVPopover.rawCSV.fieldNames,
          );

          document.getElementById("load-csv")?.showPopover();
        } else {
          toast.error(loaded.error);
        }
      });
    }
  });
</script>

<div class="preset-load-buttons">
  <h2>Preset Data</h2>
  {#each [{ name: "gold", color: "goldenrod" }, { name: "silver", color: "silver" }, { name: "copper", color: "sandybrown" }, { name: "platinum", color: "ghostwhite" }] as b}
    <button
      class={graphData.series.some((s) => s.name === b.name) ? "active" : ""}
      onclick={async () => {
        const csv = (await import(`./../assets/${b.name}.csv?raw`)).default;
        let loadedCSV = loadCSV(csv, b.name);
        if (loadedCSV?.error !== undefined) {
          toast.error(loadedCSV.error);
        } else {
          loadCSVPopover.rawCSV = loadedCSV;
        }

        loadCSVPopover.fieldMapping = createFieldMapping(
          loadCSVPopover.rawCSV.fieldNames,
        );

        document.getElementById("load-csv")?.showPopover();
      }}
    >
      {b.name.toTitleCase()}
    </button>
  {/each}
</div>

<div id="file-drop-zone" class="file-drop-zone">
  Drag or

  <input
    type="file"
    id="file-input"
    bind:files
    accept=".csv"
    style="display: none;"
  />

  <button
    class="button-inline"
    onclick={() => {
      document.getElementById("file-input")?.click();
    }}
  >
    {" upload "}
  </button> a CSV file.
</div>

<style>
  .preset-load-buttons {
    display: flex;
    gap: 1rem;
  }
</style>
