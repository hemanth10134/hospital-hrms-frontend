import ExcelJS from 'exceljs'
import type { Lookup, ManpowerPlanReportRow } from '../../types/manpowerPlanning'
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
