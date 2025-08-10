<script lang="ts">
  interface Props {
    sidebarOpen: boolean
    series: any
    onRemove: any
    onRemoveAll: any
  }

  let { sidebarOpen, series, onRemove, onRemoveAll }: Props = $props()
</script>

<aside class="sidebar" style:left={sidebarOpen ? '0px' : '-160px'}>
  <div class="dataset-list">
    <h3 class="dataset-list-title">Datasets</h3>
    {#if series.length === 0}
      <p>Empty</p>
    {:else}
      <ul>
        {#each series as data, i}
          <li class="dataset-item">
            <button
              class="button-inline"
              onclick={() => onRemove(i)}
              aria-label="Remove dataset."
            >
              <div
                class="icon"
                style="mask: url(/close_fill.svg) no-repeat center; background: var(--destructive);"
              ></div>
            </button>

            {data.name}

            <input
              type="color"
              value={data.color}
              oninput={(e) => console.log(e)}
            />
          </li>
        {/each}
      </ul>

      <button class="button-inline clear-all-btn" onclick={onRemoveAll}>
        Clear all
      </button>
    {/if}
  </div>

  <div class="button-row">
    <h3>Settings</h3>
    <div class="icon" style="mask: url(/settings.svg) no-repeat center;"></div>
  </div>
</aside>

<style>
  .sidebar {
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    top: 0;
    width: 200px;
    padding: 8rem 1rem 1rem 1rem;
    height: calc(100vh - 9rem);
    background-color: var(--background3);
    transition: left 0.3s ease-in-out;
    z-index: 1;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  .dataset-list {
    display: flex;
    flex-direction: column;
  }

  .dataset-list-title {
    margin-bottom: 0;
    font-weight: 600;
  }

  .dataset-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    background: var(--background);
    border-radius: 1rem;
    padding-right: 1rem;
  }

  .clear-all-btn {
    text-align: center;
  }

  .icon {
    width: 3rem;
    height: 3rem;
    background-color: var(--primary);
  }

  input[type='color'] {
    margin-left: auto;
    width: 1.75rem;
    height: 1.75rem;
  }

  .button-row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
</style>
