import type { Data } from './utils/csv'

interface Order {
  asset: string
  size: number
  price: number
}

interface Trade {
  asset?: string
  entryTime: number
  exitTime?: number
  entryPrice: number
  exitPrice?: number
  size: number
  profit?: number
}

interface Position {
  asset?: string
  size: number
  entryPrice: number
}

export type NormData = Record<
  string,
  { open?: number[]; high?: number[]; low?: number[]; close: number[] }
>

export type StrategyFn = (
  datasets: AlignedData,
  index: number,
  cash: number,
  positions: Record<string, Position | null>,
  normData?: NormData
) => Order[]

interface BacktestProps {
  datasets: Data[]
  strategy: StrategyFn
  cash?: number
  commission?: number
  tradeOnClose?: boolean
  normalize?: boolean
}

export interface BacktestResult {
  timeSeries: {
    date: number
    portfolioValue: number
    cash: number
    drawdown: number
    positions: Record<string, number>
  }[]
  trades: Trade[]
  stats: {
    maxDrawdown: number
    avgDrawdown: number
    winRate: number
    profitFactor: number
    expectancy: number
    volatility: number
    exposureTime: number
    numTrades: number
  }
  benchmark: {
    // compared to other strategies e.g. buy and hold asset, SPY
    return: number
    maxDrawdown: number
  }
}

type AlignedData = {
  date: number[]
  datasets: Omit<Data, 'date'>[]
}

const equalizeTimes = (datasets: Data[]): AlignedData => {
  if (datasets.length === 0) return { date: [], datasets: [] }

  const wiggle_room = 1000 * 60 * 60 * 2 // 2 hours

  const latestFirst = Math.max(...datasets.map((ds) => ds.date[0]))
  const earliestLast = Math.min(
    ...datasets.map((ds) => ds.date[ds.date.length - 1])
  )

  const allDates = [...new Set(datasets.flatMap((ds) => ds.date))]
    .sort((a, b) => a - b)
    .filter(
      (d) => d >= latestFirst - wiggle_room && d <= earliestLast + wiggle_room
    )

  if (allDates.length === 0)
    throw new Error('No overlapping dates across datasets')

  const alignedDatasets = datasets.map((ds) => {
    const aligned: Omit<Data, 'date'> = {
      name: ds.name,
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
    }
    let lastOpen = ds.open[0] ?? ds.close[0]
    let lastHigh = ds.high[0] ?? ds.close[0]
    let lastLow = ds.low[0] ?? ds.close[0]
    let lastClose = ds.close[0]
    let lastVolume = ds.volume[0] ?? 0

    let dsIdx = 0

    for (const targetDate of allDates) {
      while (
        dsIdx < ds.date.length &&
        ds.date[dsIdx] < targetDate - wiggle_room
      ) {
        dsIdx++
      }

      if (
        dsIdx < ds.date.length &&
        Math.abs(ds.date[dsIdx] - targetDate) <= wiggle_room
      ) {
        aligned.open.push((lastOpen = ds.open[dsIdx] ?? ds.close[dsIdx]))
        aligned.high.push((lastHigh = ds.high[dsIdx] ?? ds.close[dsIdx]))
        aligned.low.push((lastLow = ds.low[dsIdx] ?? ds.close[dsIdx]))
        aligned.close.push((lastClose = ds.close[dsIdx]))
        aligned.volume.push((lastVolume = ds.volume[dsIdx] ?? 0))
        dsIdx++
      } else {
        aligned.open.push(lastOpen)
        aligned.high.push(lastHigh)
        aligned.low.push(lastLow)
        aligned.close.push(lastClose)
        aligned.volume.push(lastVolume)
      }
    }

    return aligned
  })

  return { date: allDates, datasets: alignedDatasets }
}

const normalizeData = (datasets: Omit<Data, 'date'>[]): NormData =>
  datasets.reduce((acc, data) => {
    const baseClose = data.close[0] || 1
    const normClose = data.close.map((p) => (p / baseClose) * 100)

    const normOpen = data.open
      ? data.open.map((p, i) => (p / (data.open?.[0] || baseClose)) * 100)
      : normClose.slice()
    const normHigh = data.high
      ? data.high.map((p, i) => (p / (data.high?.[0] || baseClose)) * 100)
      : normClose.slice()
    const normLow = data.low
      ? data.low.map((p, i) => (p / (data.low?.[0] || baseClose)) * 100)
      : normClose.slice()

    acc[data.name] = {
      open: normOpen,
      high: normHigh,
      low: normLow,
      close: normClose,
    }
    return acc
  }, {} as NormData)

/**
 * Process an order.
 * Mutates the positions and trades arrays.
 * @returns The resultant cash value.
 */
const processOrder = (
  order: Order,
  index: number,
  cash: number,
  currentPrice: number,
  commission: number,
  positions: Record<string, Position | null>,
  trades: Trade[]
): number => {
  const currentPosition = positions[order.asset]
  let availableCash = cash

  // buying
  if (order.size > 0) {
    const tradeCost =
      currentPrice * order.size + currentPrice * order.size * commission

    // can't buy (no money) TODO: buy max able
    if (tradeCost > availableCash) return availableCash

    // case no position open
    if (currentPosition === null) {
      positions[order.asset] = { size: order.size, entryPrice: currentPrice }
      availableCash -= tradeCost
    }
    // case adding to open position
    else {
      if (
        positions[order.asset]?.size === undefined ||
        positions[order.asset]?.entryPrice === undefined
      )
        console.warn('uh oh')
      positions[order.asset] = {
        size: positions[order.asset]!.size + order.size,
        entryPrice:
          (positions[order.asset]!.entryPrice * positions[order.asset]!.size +
            currentPrice * order.size) /
          (positions[order.asset]!.size + order.size),
      }
      availableCash -= tradeCost

      // TODO: buying from a short
    }
  }

  // selling
  else if (order.size < 0) {
    // case selling partial from open position
    if (currentPosition && currentPosition.size - Math.abs(order.size) > 0) {
      availableCash +=
        Math.abs(order.size) * currentPrice -
        Math.abs(order.size) * currentPrice * commission
      currentPosition.size += order.size
    }
    // case selling and closing position
    else if (
      currentPosition &&
      currentPosition.size - Math.abs(order.size) <= 0
    ) {
      availableCash +=
        currentPosition.size * currentPrice -
        currentPosition.size * currentPrice * commission
      positions[order.asset] = null
    } else {
      // TODO: opening short position
      console.log("Received order to sell but asset isn't held")
    }
  } else {
    console.log('Received order with 0 size.')
  }

  return availableCash
}

export const runBacktest = ({
  datasets,
  strategy,
  cash = 10000,
  commission = 0,
  tradeOnClose = false,
  normalize = false,
}: BacktestProps): BacktestResult => {
  // TODO: add check that datasets must have unique names
  let alignedDatasets = equalizeTimes(datasets)

  const barCount = alignedDatasets?.date.length ?? 0

  const normData = normalize
    ? normalizeData(alignedDatasets.datasets)
    : undefined

  let availableCash = cash
  const assets = alignedDatasets.datasets.map((d) => d.name)
  const positions: Record<string, Position | null> = assets.reduce(
    (acc, a) => ({ ...acc, [a]: null }),
    {}
  )
  const trades: Trade[] = []
  const timeSeries = Array.from({ length: barCount }).map(() => ({
    date: 0,
    portfolioValue: 0,
    cash: 0,
    drawdown: 0,
    positions: {},
  }))

  const stats = {
    maxDrawdown: 0,
    avgDrawdown: 0,
    winRate: 0,
    profitFactor: 0,
    expectancy: 0,
    volatility: 0,
    exposureTime: 0,
    numTrades: 0,
  }

  const benchmark = {
    return: 0,
    maxDrawdown: 0,
  }

  let queuedOrders: Order[] = []
  for (let i = 0; i < barCount; i++) {
    if (!tradeOnClose)
      for (const order of queuedOrders) {
        const data = alignedDatasets.datasets.find(
          (ds) => ds.name === order.asset
        )!

        availableCash = processOrder(
          order,
          i,
          availableCash,
          data.open[i],
          commission,
          positions,
          trades
        )
      }
    queuedOrders = []

    const orders = strategy(
      alignedDatasets,
      i,
      availableCash,
      positions,
      normData
    )

    if (tradeOnClose) {
      for (const order of orders) {
        const data = alignedDatasets.datasets.find(
          (ds) => ds.name === order.asset
        )!

        availableCash = processOrder(
          order,
          i,
          availableCash,
          data.close[i],
          commission,
          positions,
          trades
        )
      }
    } else {
      queuedOrders = orders
    }

    timeSeries[i].date = alignedDatasets.date[i]
    timeSeries[i].cash = availableCash
    timeSeries[i].portfolioValue = availableCash
    for (const [asset, pos] of Object.entries(positions)) {
      if (pos !== null) {
        const currentPrice = alignedDatasets.datasets.find(
          (ds) => ds.name === asset
        )?.close[i]

        if (currentPrice === undefined || isNaN(currentPrice)) {
          console.error(
            "Could'nt get current price for openPL.",
            asset,
            i,
            currentPrice
          )
          continue
        }

        timeSeries[i].portfolioValue += pos.size * currentPrice
      }
    }
  }

  return { timeSeries, trades, stats, benchmark }
}

export const metalCrossoverStrategy: StrategyFn = (
  datasets: AlignedData,
  index: number,
  cash: number,
  positions: Record<string, Position | null>,
  normData?: NormData
) => {
  const orders: Order[] = []
  const assets = datasets.datasets.map((d) => d.name)

  if (normData === undefined) {
    console.error(
      'Norm data is missing from metalCrossoverStrategy but is required'
    )
    return []
  }

  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const assetA = assets[i]
      const assetB = assets[j]

      const prevAssetA = normData[assetA].close[index - 1]
      const currAssetA = normData[assetA].close[index]
      const prevAssetB = normData[assetB].close[index - 1]
      const currAssetB = normData[assetB].close[index]

      const priceAssetA = datasets.datasets.find((ds) => ds.name === assetA)!
        .close[index]
      const priceAssetB = datasets.datasets.find((ds) => ds.name === assetB)!
        .close[index]

      if (prevAssetA <= prevAssetB && currAssetA > currAssetB) {
        // if A crosses over B
        orders.push({
          asset: assetA,
          size: (cash * 0.1) / priceAssetA,
          price: priceAssetA,
        })
        orders.push({
          asset: assetB,
          size: -((cash * 0.1) / priceAssetB),
          price: priceAssetB,
        })
      } else if (prevAssetA >= prevAssetB && currAssetA < currAssetB) {
        // if B crosses over A
        orders.push({
          asset: assetB,
          size: (cash * 0.1) / priceAssetB,
          price: priceAssetB,
        })
        orders.push({
          asset: assetA,
          size: -((cash * 0.1) / priceAssetA),
          price: priceAssetA,
        })
      }
    }
  }

  return orders
}
