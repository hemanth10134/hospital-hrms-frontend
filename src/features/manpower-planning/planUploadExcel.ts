import ExcelJS from 'exceljs'
import type { HierarchyOrganization } from '../../types/manpowerPlanning'
import {
  PLAN_COLUMNS,
  POSITION_NON_PLANNED,
  POSITION_PLANNED,
  parsePlanRows,
  type PlanCell,
  type PlanColumnKey,
  type PlanRowValues,
  type PlanUploadResult,
} from './planUpload'

const SHEET_NAME = 'Manpower Plan'
const LISTS_SHEET = 'Lists'
const FIRST_DATA_ROW = 3
const LAST_VALIDATED_ROW = 502
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const PLANNED_FILL = 'FFFDE2E2'
const NON_PLANNED_FILL = 'FFDCFCE7'
const BASE_FILL = 'FFE2E8F0'

const HEADER_NOTES: Partial<Record<PlanColumnKey, string>> = {
  organization: 'Pick from the list. Blank = same as the row above.',
  location: 'Pick from the list. Blank = same as the row above. Missing? Use "Add Location" in Module 1.',
  hospital: 'Pick from the list. Blank = same as the row above. Missing? Use "Add Hospital" in Module 1.',
  department: 'Pick from the list. Blank = same as the row above. Missing? Use "Add Department" in Module 1.',
  numberOfBeds: 'Whole number, 0 or more.',
  operatingHours: 'Hours per day, between 0 and 24.',
  workingHours: 'Hours per day, between 0 and 24.',
  designation: 'No duplicate designation per department and position type.',
  position: `${POSITION_PLANNED} or ${POSITION_NON_PLANNED}.`,
  leaveBuffer: 'Percentage, e.g. 10 for 10%.',
  staffingRatio: `Required when Position = ${POSITION_PLANNED}. Beds covered by one staff member.`,
  requestedPositions: `Required when Position = ${POSITION_NON_PLANNED}.`,
}

function cellToPlanValue(cell: ExcelJS.Cell): PlanCell {
  const raw = cell.value
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return cell.numFmt?.includes('%') ? `${Math.round(raw * 10000) / 100}%` : raw
  if (typeof raw === 'string') return raw
  if (typeof raw === 'boolean') return String(raw)
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === 'object') {
    if ('result' in raw) return (raw.result as PlanCell) ?? null
    if ('richText' in raw) return raw.richText.map((part) => part.text).join('')
    if ('text' in raw) return String(raw.text)
  }
  return null
}

export async function readPlanWorkbook(buffer: ArrayBuffer): Promise<PlanCell[][][]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const ordered = [...workbook.worksheets].sort((a, b) => Number(b.name === SHEET_NAME) - Number(a.name === SHEET_NAME))
  return ordered
    .filter((sheet) => sheet.name !== LISTS_SHEET && sheet.state === 'visible')
    .map((sheet) => {
      const rows: PlanCell[][] = []
      sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        const values: PlanCell[] = []
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          values[columnNumber - 1] = cellToPlanValue(cell)
        })
        rows[rowNumber - 1] = values
      })
      return Array.from(rows, (row) => row ?? [])
    })
}

/** Reads the uploaded workbook and parses the first sheet that has the upload header row. */
export async function parsePlanWorkbook(buffer: ArrayBuffer, hierarchy: HierarchyOrganization[]): Promise<PlanUploadResult> {
  const sheets = await readPlanWorkbook(buffer)
  let lastResult: PlanUploadResult = { groups: [], errors: ['The workbook has no sheets.'] }
  for (const rows of sheets) {
    lastResult = parsePlanRows(rows, hierarchy)
    const headerMissing = lastResult.groups.length === 0 && lastResult.errors.length === 1 && /header row|Missing column/.test(lastResult.errors[0])
    if (!headerMissing) return lastResult
  }
  return lastResult
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function columnLetter(key: PlanColumnKey): string {
  return String.fromCharCode(65 + PLAN_COLUMNS.findIndex((column) => column.key === key))
}

/**
 * Builds the downloadable upload format: the exact column layout from the
 * "Excel Upload" sheet, colour-coded Planned / Non Planned mandatory groups,
 * dropdowns (data validation) for every lookup column, numeric limits, and a
 * "Valid Hierarchy" reference sheet. Any prefill rows (the current plan) are
 * written below the header so the file can be edited and uploaded back.
 */
export async function exportPlanTemplate(hierarchy: HierarchyOrganization[], prefill: PlanRowValues[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(SHEET_NAME, { views: [{ state: 'frozen', ySplit: 2 }] })
  sheet.columns = PLAN_COLUMNS.map(({ key, width }) => ({ key, width }))

  const lastBaseColumn = columnLetter('position')
  sheet.mergeCells(`A1:${lastBaseColumn}1`)
  sheet.getCell('A1').value = 'Manpower Planning – Excel Upload (blank Organization / Location / Hospital / Department cells repeat the row above)'
  sheet.mergeCells(`${columnLetter('staffingRatio')}1:${columnLetter('currentStaff')}1`)
  sheet.getCell(`${columnLetter('staffingRatio')}1`).value = `Mandatory when Position = ${POSITION_PLANNED}`
  sheet.mergeCells(`${columnLetter('requestedPositions')}1:${columnLetter('requestedBy')}1`)
  sheet.getCell(`${columnLetter('requestedPositions')}1`).value = `Mandatory when Position = ${POSITION_NON_PLANNED}`
  sheet.getRow(1).font = { bold: true }
  sheet.getCell(`${columnLetter('staffingRatio')}1`).font = { bold: true, color: { argb: 'FFB91C1C' } }
  sheet.getCell(`${columnLetter('requestedPositions')}1`).font = { bold: true, color: { argb: 'FF15803D' } }

  const headerRow = sheet.getRow(2)
  PLAN_COLUMNS.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = column.header
    cell.font = { bold: true }
    cell.alignment = { vertical: 'middle', wrapText: true }
    const fill = 'group' in column ? (column.group === 'planned' ? PLANNED_FILL : NON_PLANNED_FILL) : BASE_FILL
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
    const note = HEADER_NOTES[column.key]
    if (note) cell.note = note
  })
  headerRow.height = 30

  prefill.forEach((values, index) => {
    const row = sheet.getRow(FIRST_DATA_ROW + index)
    PLAN_COLUMNS.forEach((column, columnIndex) => {
      const value = values[column.key]
      if (value !== undefined && value !== null && value !== '') row.getCell(columnIndex + 1).value = value
    })
  })

  const lists = workbook.addWorksheet(LISTS_SHEET, { state: 'hidden' })
  const listColumns: [PlanColumnKey, string[]][] = [
    ['organization', uniqueSorted(hierarchy.map((organization) => organization.name))],
    ['location', uniqueSorted(hierarchy.flatMap((organization) => organization.locations.map((location) => location.name)))],
    [
      'hospital',
      uniqueSorted(hierarchy.flatMap((o) => o.locations.flatMap((location) => location.hospitals.map((hospital) => hospital.name)))),
    ],
    [
      'department',
      uniqueSorted(
        hierarchy.flatMap((o) => o.locations.flatMap((l) => l.hospitals.flatMap((hospital) => hospital.departments.map((d) => d.name)))),
      ),
    ],
    ['designation', uniqueSorted(hierarchy.flatMap((organization) => organization.designations.map((designation) => designation.name)))],
    ['position', [POSITION_PLANNED, POSITION_NON_PLANNED]],
  ]
  listColumns.forEach(([key, values], index) => {
    const letter = String.fromCharCode(65 + index)
    lists.getCell(`${letter}1`).value = key
    values.forEach((value, valueIndex) => (lists.getCell(`${letter}${valueIndex + 2}`).value = value))
  })

  for (let rowNumber = FIRST_DATA_ROW; rowNumber <= LAST_VALIDATED_ROW; rowNumber++) {
    listColumns.forEach(([key, values], index) => {
      if (values.length === 0) return
      const letter = String.fromCharCode(65 + index)
      sheet.getCell(`${columnLetter(key)}${rowNumber}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`${LISTS_SHEET}!$${letter}$2:$${letter}$${values.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Invalid value',
        error: 'Pick a value from the list.',
      }
    })
    const decimal = (key: PlanColumnKey, min: number, max: number | undefined, error: string) => {
      sheet.getCell(`${columnLetter(key)}${rowNumber}`).dataValidation = {
        type: 'decimal',
        operator: max === undefined ? 'greaterThanOrEqual' : 'between',
        allowBlank: true,
        formulae: max === undefined ? [min] : [min, max],
        showErrorMessage: true,
        errorTitle: 'Invalid number',
        error,
      }
    }
    decimal('operatingHours', 0, 24, 'Operating hours must be between 0 and 24.')
    decimal('workingHours', 0, 24, 'Employee working hours must be between 0 and 24.')
    decimal('numberOfBeds', 0, undefined, 'No of Beds must be 0 or more.')
    decimal('staffingRatio', 0, undefined, 'Staffing Ratio must be greater than 0.')
    decimal('monthlySalary', 0, undefined, 'Monthly Salary must be 0 or more.')
    decimal('leaveBuffer', 0, 100, 'Leave Buffer is a percentage between 0 and 100.')
    decimal('currentStaff', 0, undefined, 'Current Staff must be 0 or more.')
    decimal('requestedPositions', 1, undefined, 'Requested Positions must be at least 1.')
    decimal('additionalBudget', 0, undefined, 'Additional Monthly Budget must be 0 or more.')
  }

  const reference = workbook.addWorksheet('Valid Hierarchy')
  reference.columns = [
    { header: 'Organization', key: 'organization', width: 18 },
    { header: 'Location', key: 'location', width: 14 },
    { header: 'Hospital', key: 'hospital', width: 26 },
    { header: 'Department', key: 'department', width: 26 },
  ]
  reference.getRow(1).font = { bold: true }
  hierarchy.forEach((organization) =>
    organization.locations.forEach((location) =>
      location.hospitals.forEach((hospital) => {
        const departments = hospital.departments.length > 0 ? hospital.departments.map((d) => d.name) : ['']
        departments.forEach((department) =>
          reference.addRow({ organization: organization.name, location: location.name, hospital: hospital.name, department }),
        )
      }),
    ),
  )

  return new Blob([await workbook.xlsx.writeBuffer()], { type: XLSX_MIME })
}
