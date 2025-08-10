<script lang="ts">
  let { sidebarOpen = $bindable() } = $props();
</script>

<header>
  <button
    class="sidebar-button"
    aria-label="sidebar"
    onclick={() => {
      sidebarOpen = !sidebarOpen;
    }}
  >
    <div
      class="header-icon"
      style="mask: url(/menu_fill.svg) no-repeat center;"
    ></div>
  </button>
  <h1>Backtracker</h1>
</header>

<style>
  header {
    position: fixed;
    display: flex;
    gap: 1rem;
    align-items: center;
    height: 6rem;
    width: 100%;
    padding: 0 2rem;
    top: 0;
    left: 0;
    background: var(--background2);
    z-index: 2;
  }

  header .sidebar-button {
    font-size: 3rem;
    line-height: 0;
    padding: 0;
    background: none;
  }

  .header-icon {
    width: 2rem;
    height: 2rem;
    background: var(--primary);
  }

  header h1 {
    margin: 0;
    font-size: 2.6em;
    line-height: 1.1;
  }
</style>
