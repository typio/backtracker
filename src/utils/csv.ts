import type { PickPartial } from './helpers'

export interface RawCSV {
  readonly name: string
  readonly fieldNames: string[]
  readonly columns: string[][]
}

export enum DataType {
  date = 'date',
  open = 'open',
  high = 'high',
  close = 'close',
  low = 'low',
  volume = 'volume',
}

export interface Data {
  name: string
  date: number[]
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume: number[]
}

export const loadCSV = (
  csvString: string,
  name?: string
): RawCSV | { error: string } => {
  const cleanedString = csvString.replace(/^\uFEFF/, '').trim()
  if (!cleanedString) return { error: 'Empty CSV file' }

  const lines = cleanedString.split('\n')
  if (lines.length < 1) return { error: 'No header row found' }

  const [headerLine, ...dataLines] = lines
  const fieldNames = headerLine
    .split(',')
    .map((field) =>
      field.trim().toLowerCase().replaceAll(' ', '_').replaceAll('"', '')
    )

  if (fieldNames.length === 0) return { error: 'Empty header row' }

  const parseCSVLine = (
    line: string,
    index = 0,
    fields: string[] = [],
    currentField = '',
    inQuotes = false
  ): string[] => {
    if (index >= line.length) {
      return [...fields, currentField.trim()]
    }

    const char = line[index]

    return char === '"'
      ? parseCSVLine(line, index + 1, fields, currentField, !inQuotes)
      : char === ',' && !inQuotes
        ? parseCSVLine(
            line,
            index + 1,
            [...fields, currentField.trim()],
            '',
            inQuotes
          )
        : parseCSVLine(line, index + 1, fields, currentField + char, inQuotes)
  }

  try {
    const columns = dataLines.reduce<string[][]>(
      (cols, line) => {
        let fields = parseCSVLine(line)

        for (let i = 0; i < cols.length; i++) {
          cols[i].push(fields[i] ?? '')
        }
        return cols
      },
      Array.from({ length: fieldNames.length }, () => [])
    )

    const colLengths = new Set(columns.map((col) => col.length))
    if (colLengths.size > 1) {
      console.warn('Uneven row lengths detected; padded with empty strings')
    }

    return {
      name: (name ?? '').toTitleCase(),
      fieldNames,
      columns,
    }
  } catch (e) {
    console.error(e)
    return { error: 'CSV parsing failed: invalid format' }
  }
}

export const createFieldMapping = (
  fieldNames: string[]
): Record<string, DataType | null> => {
  const mapping: Record<string, DataType | null> = {}

  for (const fieldName of fieldNames) {
    const lower = fieldName.toLowerCase()
    let dataType: DataType | null = null

    if (lower.includes('date') || fieldName === '') {
      dataType = DataType.date
    } else if (lower.includes('open')) {
      dataType = DataType.open
    } else if (lower.includes('high')) {
      dataType = DataType.high
    } else if (lower.includes('low')) {
      dataType = DataType.low
    } else if (lower.includes('close') || lower.includes('price')) {
      dataType = DataType.close
    } else if (lower.includes('vol')) {
      dataType = DataType.volume
    }

    mapping[fieldName] = dataType
  }

  return mapping
}

export const parseCSV = (
  csv: RawCSV,
  fieldMapping: Record<string, DataType | null>
): Data | { error?: string } => {
  const usedTypes = Object.values(fieldMapping).filter(
    (type): type is DataType => type !== null
  )

  if (new Set(usedTypes).size !== usedTypes.length) {
    return { error: 'Duplicate column types' }
  }

  if (!usedTypes.includes(DataType.date)) {
    return { error: 'Missing required Date column' }
  }

  if (!usedTypes.includes(DataType.close)) {
    return { error: 'Missing required Close (Price) column' }
  }

  const typeToIndex = Object.entries(fieldMapping).reduce<
    Partial<Record<DataType, number>>
  >((acc, [field, type]) => {
    if (type !== null) {
      const index = csv.fieldNames.indexOf(field)
      if (index === -1) {
        return acc // Skip invalid mappings
      }
      acc[type] = index
    }
    return acc
  }, {})

  const parseDate = (v: string): number => Date.parse(v.trim())

  const parseNumber = (v: string): number => {
    const numString = v.replaceAll(',', '').trim().toLowerCase()

    const multiplier = { k: 1e3, m: 1e6, b: 1e9 }[numString.slice(-1)] ?? 1
    const base = parseFloat(multiplier > 1 ? numString.slice(0, -1) : numString)
    return isNaN(base) ? NaN : base * multiplier
  }

  const parsedColumns = Object.values(DataType).reduce<
    Partial<Record<DataType, number[]>>
  >((acc, type) => {
    const index = typeToIndex[type]
    if (index !== undefined) {
      const rawCol = csv.columns[index]
      acc[type] = rawCol.map(type === DataType.date ? parseDate : parseNumber)
    }
    return acc
  }, {})

  const rowCount = parsedColumns.date?.length ?? 0
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    date: parsedColumns.date?.[i] ?? NaN,
    open: parsedColumns.open?.[i],
    high: parsedColumns.high?.[i],
    low: parsedColumns.low?.[i],
    close: parsedColumns.close?.[i] ?? NaN,
    volume: parsedColumns.volume?.[i],
  }))

  const validRows = rows.filter((row) => !isNaN(row.date) && !isNaN(row.close))

  if (validRows.length === 0)
    return {
      error: 'No valid rows after parsing (all dates or closes invalid)',
    }

  if (validRows.length < rowCount) {
    return {
      error: `${rowCount - validRows.length} invalid rows (NaN in date/close)`,
    }
  }

  validRows.sort((a, b) => a.date - b.date)

  // Unzip back to column arrays
  const data: PickPartial<Data, 'open' | 'high' | 'low' | 'volume'> = {
    name: csv.name,
    date: validRows.map((row) => row.date),
    close: validRows.map((row) => row.close),
    ...(parsedColumns.open && { open: validRows.map((row) => row.open!) }),
    ...(parsedColumns.high && { high: validRows.map((row) => row.high!) }),
    ...(parsedColumns.low && { low: validRows.map((row) => row.low!) }),
    ...(parsedColumns.volume && {
      volume: validRows.map((row) => row.volume!),
    }),
  }

  data.open ??= data.close.slice()
  data.high ??= data.close.slice()
  data.low ??= data.close.slice()
  data.volume ??= data.close.map(() => 0)

  return data as Data
}
