import ExcelJS from 'exceljs'
import type { DesignationLine, Lookup, ManpowerPlanReportRow } from '../../types/manpowerPlanning'
import type { ComputedDesignationLine } from './staffingCalculations'

const SHEET_NAME = 'Designation-wise Staffing'
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function toBlob(workbook: ExcelJS.Workbook): Promise<Blob> {
  return new Blob([await workbook.xlsx.writeBuffer()], { type: XLSX_MIME })
}

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

  return toBlob(workbook)
}

const TEMPLATE_COLUMN_KEYS = [
  'designationCode',
  'designationName',
  'staffingRatio',
  'monthlySalary',
  'leaveBufferPct',
  'currentStaff',
  'planned',
] as const

/**
 * Blank upload format: the input columns the importer reads, plus a reference
 * sheet listing every valid designation code so users don't have to guess them.
 */
export async function exportDesignationTemplate(designationOptions: Lookup[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(SHEET_NAME)
  sheet.columns = COLUMNS.filter((column) => (TEMPLATE_COLUMN_KEYS as readonly string[]).includes(column.key)).map(
    ({ header, key, width }) => ({ header, key, width }),
  )
  sheet.getRow(1).font = { bold: true }

  const codes = workbook.addWorksheet('Designation Codes')
  codes.columns = [
    { header: 'Designation Code', key: 'code', width: 24 },
    { header: 'Designation', key: 'name', width: 32 },
  ]
  codes.getRow(1).font = { bold: true }
  designationOptions.forEach((option) => codes.addRow({ code: option.code, name: option.name }))

  return toBlob(workbook)
}

export async function exportReportToExcel(rows: ManpowerPlanReportRow[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Manpower Planning Report')
  sheet.columns = [
    { header: 'Organization', key: 'organizationName', width: 18 },
    { header: 'Location', key: 'locationName', width: 14 },
    { header: 'Hospital', key: 'hospitalName', width: 24 },
    { header: 'Department', key: 'departmentName', width: 24 },
    { header: 'Designation', key: 'designationName', width: 26 },
    { header: 'Staffing Status', key: 'staffingStatus', width: 16 },
    { header: 'Planned', key: 'planned', width: 13 },
    { header: 'No of Beds', key: 'numberOfBeds', width: 11 },
    { header: 'Operating Hours', key: 'departmentOperatingHours', width: 15 },
    { header: 'Employee Working Hours', key: 'employeeWorkingHours', width: 22 },
    { header: 'Position (Required Staff)', key: 'requiredStaff', width: 22 },
    { header: 'Staffing Ratio', key: 'staffingRatio', width: 14 },
    { header: 'Monthly Salary (₹)', key: 'monthlySalary', width: 17 },
    { header: 'Leave Buffer (%)', key: 'leaveBufferPct', width: 15 },
    { header: 'Current Staff', key: 'currentStaff', width: 13 },
    { header: 'Vacancies', key: 'vacancies', width: 11 },
    { header: 'Requested Positions', key: 'requestedPositions', width: 19 },
    { header: 'Reason', key: 'requestReasons', width: 30 },
    { header: 'Additional Monthly Budget (₹)', key: 'additionalMonthlyBudget', width: 27 },
    { header: 'Requested By', key: 'requestedBy', width: 18 },
    { header: 'Status', key: 'planStatus', width: 12 },
  ]
  sheet.getRow(1).font = { bold: true }
  rows.forEach((row) => sheet.addRow({ ...row, planned: row.planned ? 'Planned' : 'Not Planned' }))

  return toBlob(workbook)
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
  const plannedCol = columnIndex('planned')

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
      planned: plannedCol < 0 || String(row.getCell(plannedCol).value ?? '').trim().toLowerCase() !== 'not planned',
    })
  })

  return { lines, errors }
}
