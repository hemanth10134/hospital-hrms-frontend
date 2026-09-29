import type { DesignationLine, Lookup } from '../../types/manpowerPlanning'
import type { ComputedDesignationLine } from './staffingCalculations'

const CSV_HEADER = 'designationCode,staffingRatio,monthlySalary,leaveBufferPct,currentStaff'

export function exportDesignationLinesToCsv(lines: ComputedDesignationLine[]): string {
  const rows = lines.map((line) =>
    [
      line.designationName,
      line.staffingRatio,
      line.monthlySalary,
      line.leaveBufferPct,
      line.currentStaff,
      line.requiredStaff,
      line.vacancies,
      line.excess,
      line.monthlyBudget,
    ].join(','),
  )
  const header = 'designation,staffingRatio,monthlySalary,leaveBufferPct,currentStaff,requiredStaff,vacancies,excess,monthlyBudget'
  return [header, ...rows].join('\n')
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export interface CsvImportResult {
  lines: DesignationLine[]
  errors: string[]
}

/**
 * Parses a CSV in the `designationCode,staffingRatio,monthlySalary,leaveBufferPct,currentStaff`
 * shape produced by the "Upload Excel" flow. Rows referencing an unknown designation code are
 * reported as errors rather than silently skipped.
 */
export function parseDesignationLinesCsv(csvContent: string, designationOptions: Lookup[]): CsvImportResult {
  const lines: DesignationLine[] = []
  const errors: string[] = []
  const byCode = new Map(designationOptions.map((option) => [option.code.toUpperCase(), option]))

  const rows = csvContent
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter((row) => row.length > 0 && row.toLowerCase() !== CSV_HEADER.toLowerCase())

  rows.forEach((row, index) => {
    const [designationCode, staffingRatio, monthlySalary, leaveBufferPct, currentStaff] = row.split(',').map((v) => v.trim())
    const designation = byCode.get((designationCode ?? '').toUpperCase())

    if (!designation) {
      errors.push(`Row ${index + 1}: unknown designation code "${designationCode}"`)
      return
    }

    lines.push({
      designationId: designation.id,
      designationName: designation.name,
      staffingRatio: Number(staffingRatio),
      monthlySalary: Number(monthlySalary),
      leaveBufferPct: Number(leaveBufferPct),
      currentStaff: Number(currentStaff),
    })
  })

  return { lines, errors }
}
