<script lang="ts">
  import { DataType, parseCSV } from '../utils/csv'

  let { graphData, loadCSVPopover = $bindable() }: any = $props()
</script>

<div id="load-csv" popover>
  <input
    type="color"
    value={loadCSVPopover.color}
    oninput={({ target }) =>
      (loadCSVPopover.color = (target as HTMLInputElement).value)}
  />

  <button
    class="button-inline"
    aria-label="cancel-loading"
    onclick={() => {
      document.getElementById('load-csv')?.hidePopover()
    }}
  >
    <div
      style="mask: url(/close_fill.svg) no-repeat center; width: 1rem; height: 1rem; background: var(--destructive);"
    ></div>
  </button>

  <div>
    <label for="dataset-name">Name Dataset</label>
    <input id="dataset-name" value={loadCSVPopover.rawCSV?.name} />
  </div>

  Pick Columns

  {#each loadCSVPopover.rawCSV?.fieldNames ?? [] as fieldName, i}
    <div>
      {#if (fieldName ?? '') === ''}
        Column {i}
      {:else}
        {fieldName.toTitleCase()}
      {/if}

      {#if loadCSVPopover.fieldMapping !== undefined}
        <select bind:value={loadCSVPopover.fieldMapping[fieldName]}>
          {#each [...Object.values(DataType), null] as value}
            <option {value}>
              {value === null ? 'Ignored' : value.toTitleCase()}
            </option>
          {/each}
        </select>
      {/if}
    </div>
  {/each}

  {#if loadCSVPopover.error}
    <span style="color: red;">{loadCSVPopover.error}</span>
  {/if}

  <button
    onclick={() => {
      let parseResult = parseCSV(
        loadCSVPopover.rawCSV,
        loadCSVPopover.fieldMapping
      )

      if ('error' in parseResult) {
        loadCSVPopover.error = parseResult.error
      } else {
        graphData.series.push({ ...parseResult, color: loadCSVPopover.color })
        document.getElementById('load-csv')?.hidePopover()
      }
    }}
  >
    Finish Loading
  </button>
</div>
