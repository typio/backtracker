import type { Data } from '../utils/csv'

export class GraphData {
  series: (Data & { color: string })[] = $state([])
  meta = $derived(
    this.series.reduce(
      (acc, curr) => {
        let currMin = Math.min(...curr.low)
        let currMax = Math.max(...curr.high)
        return {
          min: Math.min(acc.min, currMin),
          max: Math.max(acc.max, currMax),
        }
      },
      { min: Infinity, max: -Infinity }
    )
  )
}
