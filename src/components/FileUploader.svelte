<script lang="ts">
  import { onMount } from 'svelte'
  import type { GraphData } from '../stores/graphData.svelte'
  import { createFieldMapping, loadCSV } from '../utils/csv'
  import toast from 'svelte-french-toast'

  interface Props {
    loadCSVPopover: any
    graphData: GraphData
  }

  let { loadCSVPopover = $bindable(), graphData }: Props = $props()

  let files: FileList | undefined = $state()

  onMount(() => {
    const dropZoneEl = document.getElementById('file-drop-zone')

    if (dropZoneEl) {
      dropZoneEl.addEventListener('dragover', (e) => {
        e.preventDefault()
      })
      dropZoneEl.addEventListener('drop', async (e) => {
        e.preventDefault()

        let csv = ''
        let name = ''

        if (e.dataTransfer && e.dataTransfer.items) {
          const item = e.dataTransfer.items[0]
          if (item.kind === 'file') {
            const file = item.getAsFile()
            if (file !== null) {
              name = file.name

              const nameLastDotIndex = name.lastIndexOf('.')
              if (nameLastDotIndex !== -1)
                name = name.substring(0, nameLastDotIndex)

              csv = await file?.text()
            }
          } else if (item.kind === 'text') {
            item.getAsString((str) => {
              csv = str
            })
          }
        }

        let loadedCSV = loadCSV(csv, name)

        if ('error' in loadedCSV) {
          toast.error(loadedCSV.error)
          return
        } else {
          loadCSVPopover.rawCSV = loadedCSV
        }

        loadCSVPopover.fieldMapping = createFieldMapping(
          loadCSVPopover.rawCSV.fieldNames
        )

        document.getElementById('load-csv')?.showPopover()
        // loadCSVPopover.color = loadCSVPopover.colorList.find(c => graphData.series);
      })
    }
  })

  // Handle files from upload button
  $effect(() => {
    if (files !== undefined && files?.[0]) {
      let name = files[0].name
      const nameLastDotIndex = name.lastIndexOf('.')
      if (nameLastDotIndex !== -1) name = name.substring(0, nameLastDotIndex)

      files[0].text().then((csv) => {
        const loaded = loadCSV(csv, name)
        if ('error' in loaded) toast.error(loaded.error)
        else {
          loadCSVPopover.rawCSV = loaded

          loadCSVPopover.fieldMapping = createFieldMapping(
            loadCSVPopover.rawCSV.fieldNames
          )

          document.getElementById('load-csv')?.showPopover()
        }
      })
    }
  })
</script>

<h2 class="load-title">Load data</h2>

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
      document.getElementById('file-input')?.click()
    }}
  >
    {' upload '}
  </button> a CSV file.
</div>

<div class="preset-section">
  <h3 class="preset-title">Preset Data</h3>
  <ul class="preset-list">
    {#each [{ n: 'gold', c: '#FFD700' }, { n: 'platinum', c: '#E5E4E2' }, { n: 'silver', c: '#C0C0C0' }, { n: 'copper', c: '#B87333' }] as ds}
      <li>
        <button
          class={graphData.series.some((s) => s.name === ds.n) ? 'active' : ''}
          onclick={async () => {
            const csv = (await import(`./../assets/${ds.n}.csv?raw`)).default;
            let loadedCSV = loadCSV(csv, ds.n);
            loadCSVPopover.color = ds.c

            if ("error" in loadedCSV) toast.error(loadedCSV.error);
            else loadCSVPopover.rawCSV = loadedCSV;

            loadCSVPopover.fieldMapping = createFieldMapping(
              loadCSVPopover.rawCSV.fieldNames,
            );

            document.getElementById("load-csv")?.showPopover();
          }}
        >
          {ds.n.toTitleCase()}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .load-title {
    text-align: left;
    margin-bottom: 0;
  }

  .preset-title {
    margin: 0 0 1rem 0;
  }

  .preset-list {
    list-style-type: none;
    display: flex;
    margin: 0;
    padding: 0;
    gap: 1rem;
  }

  .preset-section {
    display: flex;
    flex-direction: column;
    align-items: start;
  }
</style>
