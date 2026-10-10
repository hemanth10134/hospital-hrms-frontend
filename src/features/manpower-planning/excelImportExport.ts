import ExcelJS from 'exceljs'
import type { DesignationLine, Lookup } from '../../types/manpowerPlanning'
import type { ComputedDesignationLine } from './staffingCalculations'

const SHEET_NAME = 'Designation-wise Staffing'

const COLUMNS = [
  { header: 'Designation Code', key: 'designationCode', width: 22 },
  { header: 'Designation', key: 'designationName', width: 28 },
  { header: 'Staffing Ratio', key: 'staffingRatio', width: 14 },
  { header: 'Monthly Salary (₹)', key: 'monthlySalary', width: 18 },
  { header: 'Leave Buffer (%)', key: 'leaveBufferPct', width: 16 },
  { header: 'Current Staff', key: 'currentStaff', width: 14 },
  { header: 'Required Staff', key: 'requiredStaff', width: 14 },
  { header: 'Vacancies', key: 'vacancies', width: 12 },
  { header: 'Excess', key: 'excess', width: 10 },
  { header: 'Monthly Budget (₹)', key: 'monthlyBudget', width: 18 },
  { header: 'Planned', key: 'planned', width: 12 },
  { header: 'Location', key: 'location', width: 16 },
  { header: 'Status', key: 'status', width: 14 },
] as const

export async function exportDesignationLinesToExcel(
  lines: ComputedDesignationLine[],
  designationOptions: Lookup[],
  locationName?: string,
  planStatus?: string,
): Promise<Blob> {
  const byId = new Map(designationOptions.map((option) => [option.id, option]))

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(SHEET_NAME)
  sheet.columns = COLUMNS.map(({ header, key, width }) => ({ header, key, width }))
  sheet.getRow(1).font = { bold: true }

  for (const line of lines) {
    sheet.addRow({
      designationCode: byId.get(line.designationId)?.code ?? '',
      designationName: line.designationName,
      staffingRatio: line.staffingRatio,
      monthlySalary: line.monthlySalary,
      leaveBufferPct: line.leaveBufferPct,
      currentStaff: line.currentStaff,
      requiredStaff: line.requiredStaff,
      vacancies: line.vacancies,
      excess: line.excess,
      monthlyBudget: line.monthlyBudget,
      planned: line.planned === false ? 'Not Planned' : 'Planned',
      location: locationName ?? '',
      status: planStatus ?? '',
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export interface ExcelImportResult {
  lines: DesignationLine[]
  errors: string[]
}

/**
 * Parses the `.xlsx` produced by the "Download" flow above (or any workbook with the
 * same column headers) back into designation lines. Rows referencing an unknown
 * designation code are reported as errors rather than silently skipped.
 */
export async function parseDesignationLinesExcel(
  file: File,
  designationOptions: Lookup[],
): Promise<ExcelImportResult> {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]

  const lines: DesignationLine[] = []
  const errors: string[] = []
  if (!sheet) {
    return { lines, errors: ['The uploaded file has no worksheets.'] }
  }

  const byCode = new Map(designationOptions.map((option) => [option.code.toUpperCase(), option]))
  const headerRow = sheet.getRow(1).values as unknown[]
  const columnIndex = (key: (typeof COLUMNS)[number]['key']) => {
    const header = COLUMNS.find((column) => column.key === key)?.header
    return headerRow.findIndex((cell) => String(cell ?? '').trim() === header)
  }

  const codeCol = columnIndex('designationCode')
  const ratioCol = columnIndex('staffingRatio')
  const salaryCol = columnIndex('monthlySalary')
  const bufferCol = columnIndex('leaveBufferPct')
  const currentStaffCol = columnIndex('currentStaff')

  if (codeCol < 0) {
    return { lines, errors: ['Could not find a "Designation Code" column in the uploaded file.'] }
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const designationCode = String(row.getCell(codeCol).value ?? '').trim()
    if (!designationCode) return

    const designation = byCode.get(designationCode.toUpperCase())
    if (!designation) {
      errors.push(`Row ${rowNumber}: unknown designation code "${designationCode}"`)
      return
    }

    lines.push({
      designationId: designation.id,
      designationName: designation.name,
      staffingRatio: Number(row.getCell(ratioCol).value ?? 0),
      monthlySalary: Number(row.getCell(salaryCol).value ?? 0),
      leaveBufferPct: Number(row.getCell(bufferCol).value ?? 0),
      currentStaff: Number(row.getCell(currentStaffCol).value ?? 0),
    })
  })

  return { lines, errors }
}
