<script lang="ts">
  let { series, onRemove }: any = $props();
</script>

<aside class="sidebar">
  <h3>Loaded Datasets</h3>
  {#if series.length === 0}
    <p>No datasets loaded yet.</p>
  {:else}
    <ul>
      {#each series as data, i}
        <li>
          {data.name}
          <button on:click={() => onRemove(i)}>Remove</button>
        </li>
      {/each}
    </ul>
  {/if}
</aside>

<style>
  .sidebar {
    width: 200px;
    padding: 1rem;
    border-right: 1px solid #ccc;
    height: 100%;
    background-color: var(--background2) ;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
</style>
