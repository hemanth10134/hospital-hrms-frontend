import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { PLAN_COLUMNS, parsePlanRows, parsePosition, type PlanCell } from '../planUpload'
import { exportPlanTemplate, parsePlanWorkbook } from '../planUploadExcel'
import type { HierarchyOrganization } from '../../../types/manpowerPlanning'

const hierarchy: HierarchyOrganization[] = [
  {
    id: 'org-park',
    code: 'PARK-GROUP',
    name: 'Park Group',
    designations: [
      { id: 'des-nurse', code: 'NURSE', name: 'Nurse' },
      { id: 'des-sr-nurse', code: 'SR-NURSE', name: 'Sr Nurse' },
      { id: 'des-team-lead', code: 'TEAM-LEAD', name: 'Team Lead' },
    ],
    locations: [
      {
        id: 'loc-delhi',
        code: 'DEL',
        name: 'Delhi',
        hospitals: [
          {
            id: 'hosp-west-delhi',
            code: 'WEST-DELHI',
            name: 'West Delhi',
            departments: [
              { id: 'dept-nursing', code: 'NURSING', name: 'Nursing' },
              { id: 'dept-hr', code: 'HR', name: 'HR' },
              { id: 'dept-it', code: 'IT', name: 'IT' },
            ],
          },
          { id: 'hosp-faridabad', code: 'FARIDABAD', name: 'Faridabad', departments: [] },
        ],
      },
    ],
  },
]

const header = PLAN_COLUMNS.map((column) => column.header)

// Column order: Employee Id, Organization, Location, Hospital, Department, Beds, Operating, Working,
// Designation, Position, Staffing Ratio, Monthly Salary, Leave Buffer, Current Staff,
// Requested Positions, Reason, Additional Monthly Budget, Requested By
function row(...cells: PlanCell[]): PlanCell[] {
  return cells
}

const sampleSheet: PlanCell[][] = [
  ['Mandatory notes row that the parser must skip'],
  header,
  row('E101', 'Park Group', 'Delhi', 'West Delhi', 'Nursing', 20, 24, 8, 'nURSE', 'Planned', 10, 45000, '10%', 2),
  row(null, null, null, null, null, null, null, null, 'nURSE', 'NonPlanned', null, null, null, null, 3, 'ICU expansion', '₹1,35,000', 'Vamsi'),
  row(null, null, null, null, null, null, null, null, 'Sr Nurse', 'Planned', 20, 60000, 10, 1),
  row(null, null, null, null, null, null, null, null, 'tEAM LEAD', 'Planned', 30, 80000, null, 1),
  row(null, 'Park Group', 'Delhi', 'West Delhi', 'HR', 20),
  row(null, 'Park Group', 'Delhi', 'West Delhi', 'IT', 30, 30, 8),
  row(null, 'Park Group', 'Delhi', 'Faridabad', null, null, null, null, 'Nurse', 'Planned', 10, 1, 1, 1),
]

describe('parsePlanRows', () => {
  it('splits Planned rows into designation lines and Non Planned rows into request drafts, filling blanks down', () => {
    const { groups } = parsePlanRows(sampleSheet, hierarchy)
    const nursing = groups.find((group) => group.departmentId === 'dept-nursing')!

    expect(nursing).toMatchObject({
      label: 'Delhi / West Delhi / Nursing',
      organizationId: 'org-park',
      locationId: 'loc-delhi',
      hospitalId: 'hosp-west-delhi',
      employeeId: 'E101',
      numberOfBeds: 20,
      departmentOperatingHours: 24,
      employeeWorkingHours: 8,
    })
    expect(nursing.lines).toEqual([
      expect.objectContaining({ designationId: 'des-nurse', staffingRatio: 10, monthlySalary: 45000, leaveBufferPct: 10, currentStaff: 2, planned: true }),
      expect.objectContaining({ designationId: 'des-sr-nurse', staffingRatio: 20, leaveBufferPct: 10, currentStaff: 1 }),
    ])
    expect(nursing.requests).toEqual([
      expect.objectContaining({
        designationId: 'des-nurse',
        requestedPositions: 3,
        reason: 'ICU expansion',
        additionalMonthlyBudget: 135000,
        requestedBy: 'Vamsi',
        currentStaff: 2,
      }),
    ])
  })

  it('creates a group per department, including departments that only set beds', () => {
    const { groups } = parsePlanRows(sampleSheet, hierarchy)
    expect(groups.map((group) => group.departmentId)).toEqual(['dept-nursing', 'dept-hr', 'dept-it'])
    expect(groups.find((group) => group.departmentId === 'dept-hr')).toMatchObject({ numberOfBeds: 20, lines: [], requests: [] })
  })

  it('reports Planned rows missing mandatory fields, hours outside 0–24 and rows without a department', () => {
    const { groups, errors } = parsePlanRows(sampleSheet, hierarchy)

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Row 6 \(Team Lead – Planned\): Leave Buffer is required/),
        expect.stringMatching(/Row 8: Operating Hours "30" must be between 0 and 24/),
        expect.stringMatching(/Row 9: Organization, Location, Hospital and Department are required/),
      ]),
    )
    expect(groups.find((group) => group.departmentId === 'dept-it')?.departmentOperatingHours).toBeUndefined()
  })

  it('requires Requested Positions, Reason, Additional Monthly Budget and Requested By for Non Planned rows', () => {
    const { groups, errors } = parsePlanRows(
      [header, row(null, 'Park Group', 'Delhi', 'West Delhi', 'Nursing', 20, 24, 8, 'Nurse', 'Non Planned', null, null, null, null, 2)],
      hierarchy,
    )
    expect(groups[0].requests).toHaveLength(0)
    expect(errors[0]).toMatch(/Additional Monthly Budget is required; Reason is required; Requested By is required/)
  })

  it('rejects duplicate designations per department and position type', () => {
    const { groups, errors } = parsePlanRows(
      [
        header,
        row(null, 'Park Group', 'Delhi', 'West Delhi', 'Nursing', 20, 24, 8, 'Nurse', 'Planned', 10, 1, 1, 1),
        row(null, null, null, null, null, null, null, null, 'NURSE', 'Planned', 5, 1, 1, 1),
      ],
      hierarchy,
    )
    expect(groups[0].lines).toHaveLength(1)
    expect(errors[0]).toMatch(/Nurse \(Planned\) is listed more than once/)
  })

  it('names valid options when a hierarchy value is unknown', () => {
    const { groups, errors } = parsePlanRows(
      [header, row(null, 'Park', 'Delhi', 'West Delhi', 'Nursing', 20, 24, 8, 'Nurse', 'Planned', 10, 1, 1, 1)],
      hierarchy,
    )
    expect(groups).toHaveLength(0)
    expect(errors[0]).toBe('Row 2: Organization "Park" not found (valid: Park Group)')
  })

  it('fails clearly when the header row or required columns are missing', () => {
    expect(parsePlanRows([['foo', 'bar']], hierarchy).errors[0]).toMatch(/Could not find the header row/)
    expect(parsePlanRows([['Designation', 'Position']], hierarchy).errors[0]).toMatch(
      /Missing column\(s\): Organization, Location, Hospital, Department/,
    )
  })
})

describe('parsePosition', () => {
  it('accepts the spellings used in the sheet', () => {
    expect(parsePosition('Planned')).toBe('PLANNED')
    expect(parsePosition('NonPlanned')).toBe('NON_PLANNED')
    expect(parsePosition('Non Planned')).toBe('NON_PLANNED')
    expect(parsePosition('not-planned')).toBe('NON_PLANNED')
    expect(parsePosition('maybe')).toBeUndefined()
  })
})

describe('Excel format round trip', () => {
  it('downloads a format with the sheet columns, dropdowns and prefilled rows that uploads back to the same data', async () => {
    const blob = await exportPlanTemplate(hierarchy, [
      {
        organization: 'Park Group',
        location: 'Delhi',
        hospital: 'West Delhi',
        department: 'Nursing',
        numberOfBeds: 20,
        operatingHours: 24,
        workingHours: 8,
        designation: 'Nurse',
        position: 'Planned',
        staffingRatio: 10,
        monthlySalary: 45000,
        leaveBuffer: 10,
        currentStaff: 2,
      },
      {
        designation: 'Nurse',
        position: 'Non Planned',
        requestedPositions: 3,
        reason: 'ICU expansion',
        additionalBudget: 135000,
        requestedBy: 'Vamsi',
      },
    ])
    const buffer = await blob.arrayBuffer()

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.getWorksheet('Manpower Plan')!
    expect((sheet.getRow(2).values as unknown[]).filter(Boolean)).toEqual(PLAN_COLUMNS.map((column) => column.header))
    expect(sheet.getCell('J3').dataValidation).toMatchObject({ type: 'list', formulae: ['Lists!$F$2:$F$3'] })
    expect(sheet.getCell('G3').dataValidation).toMatchObject({ type: 'decimal', formulae: [0, 24] })
    expect(workbook.getWorksheet('Lists')!.state).toBe('hidden')
    expect(workbook.getWorksheet('Valid Hierarchy')!.rowCount).toBeGreaterThan(1)

    const { groups, errors } = await parsePlanWorkbook(buffer, hierarchy)
    expect(errors).toEqual([])
    expect(groups).toHaveLength(1)
    expect(groups[0].lines).toEqual([expect.objectContaining({ designationId: 'des-nurse', staffingRatio: 10, leaveBufferPct: 10 })])
    expect(groups[0].requests).toEqual([expect.objectContaining({ requestedPositions: 3, requestedBy: 'Vamsi', currentStaff: 2 })])
  })

  it('reads percentage-formatted Leave Buffer cells (0.1 shown as 10%) as 10', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Data')
    sheet.addRow(PLAN_COLUMNS.map((column) => column.header))
    sheet.addRow([null, 'Park Group', 'Delhi', 'West Delhi', 'Nursing', 20, 24, 8, 'Nurse', 'Planned', 10, 45000, 0.15, 2])
    sheet.getCell('M2').numFmt = '0%'
    const buffer = await workbook.xlsx.writeBuffer()

    const { groups } = await parsePlanWorkbook(buffer as ArrayBuffer, hierarchy)
    expect(groups[0].lines[0].leaveBufferPct).toBe(15)
  })
})
