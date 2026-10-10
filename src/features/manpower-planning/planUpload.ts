import type {
  DesignationLine,
  HierarchyHospital,
  HierarchyLocation,
  HierarchyOrganization,
  Lookup,
  PositionRequestDraft,
} from '../../types/manpowerPlanning'

/** Column layout of the "Excel Upload" format — single source for the template and the parser. */
export const PLAN_COLUMNS = [
  { key: 'employeeId', header: 'Employee Id', width: 14 },
  { key: 'organization', header: 'Organization', width: 18 },
  { key: 'location', header: 'Location', width: 14 },
  { key: 'hospital', header: 'Hospital', width: 22 },
  { key: 'department', header: 'Department', width: 20 },
  { key: 'numberOfBeds', header: 'No of Beds', width: 11 },
  { key: 'operatingHours', header: 'Operating Hours', width: 15 },
  { key: 'workingHours', header: 'Employee Working Hours', width: 22 },
  { key: 'designation', header: 'Designation', width: 22 },
  { key: 'position', header: 'Position', width: 14 },
  { key: 'staffingRatio', header: 'Staffing Ratio', width: 14, group: 'planned' },
  { key: 'monthlySalary', header: 'Monthly Salary (₹)', width: 17, group: 'planned' },
  { key: 'leaveBuffer', header: 'Leave Buffer (%)', width: 15, group: 'planned' },
  { key: 'currentStaff', header: 'Current Staff', width: 13, group: 'planned' },
  { key: 'requestedPositions', header: 'Requested Positions', width: 19, group: 'nonPlanned' },
  { key: 'reason', header: 'Reason', width: 30, group: 'nonPlanned' },
  { key: 'additionalBudget', header: 'Additional Monthly Budget (₹)', width: 27, group: 'nonPlanned' },
  { key: 'requestedBy', header: 'Requested By', width: 18, group: 'nonPlanned' },
] as const

export type PlanColumnKey = (typeof PLAN_COLUMNS)[number]['key']
export type PlanCell = string | number | null | undefined
export type PlanRowValues = Partial<Record<PlanColumnKey, PlanCell>>

export const POSITION_PLANNED = 'Planned'
export const POSITION_NON_PLANNED = 'Non Planned'
const MAX_HOURS_PER_DAY = 24

const HEADER_ALIASES: Record<string, PlanColumnKey> = {
  'employee id': 'employeeId',
  'emp id': 'employeeId',
  'employee code': 'employeeId',
  organization: 'organization',
  organisation: 'organization',
  location: 'location',
  hospital: 'hospital',
  department: 'department',
  'no of beds': 'numberOfBeds',
  'number of beds': 'numberOfBeds',
  beds: 'numberOfBeds',
  'operating hours': 'operatingHours',
  'operating works': 'operatingHours',
  'department operating hours': 'operatingHours',
  'employee working hours': 'workingHours',
  'working hours': 'workingHours',
  designation: 'designation',
  position: 'position',
  'planned non planned': 'position',
  'staffing ratio': 'staffingRatio',
  'monthly salary': 'monthlySalary',
  'leave buffer': 'leaveBuffer',
  'current staff': 'currentStaff',
  'requested positions': 'requestedPositions',
  reason: 'reason',
  'additional monthly budget': 'additionalBudget',
  'requested by': 'requestedBy',
}

const REQUIRED_COLUMNS: PlanColumnKey[] = ['organization', 'location', 'hospital', 'department', 'designation', 'position']

/** One department's worth of uploaded data, ready to autofill steps 1–4. */
export interface UploadedPlanGroup {
  key: string
  label: string
  organizationId: string
  locationId: string
  hospitalId: string
  departmentId: string
  employeeId?: string
  numberOfBeds?: number
  departmentOperatingHours?: number
  employeeWorkingHours?: number
  lines: DesignationLine[]
  requests: PositionRequestDraft[]
}

export interface PlanUploadResult {
  groups: UploadedPlanGroup[]
  errors: string[]
}

function normalizeHeader(value: PlanCell): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeName(value: PlanCell): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function text(value: PlanCell): string {
  return String(value ?? '').trim()
}

function isBlank(value: PlanCell): boolean {
  return text(value) === ''
}

/** Parses "10", 10, "10%", "₹1,20,000" → number; blank → undefined; garbage → NaN. */
function toNumber(value: PlanCell): number | undefined {
  if (isBlank(value)) return undefined
  if (typeof value === 'number') return value
  return Number(text(value).replace(/[%₹,\s]/g, ''))
}

export function parsePosition(value: PlanCell): 'PLANNED' | 'NON_PLANNED' | undefined {
  const compact = normalizeName(value).replace(/[^a-z]/g, '')
  if (compact === 'planned') return 'PLANNED'
  if (['nonplanned', 'notplanned', 'unplanned'].includes(compact)) return 'NON_PLANNED'
  return undefined
}

function findByName<T extends Lookup>(items: T[], value: PlanCell): T | undefined {
  const target = normalizeName(value)
  return items.find((item) => normalizeName(item.name) === target || normalizeName(item.code) === target)
}

function notFound(kind: string, value: PlanCell, options: Lookup[], scope = ''): string {
  const names = options.map((option) => option.name)
  const hint =
    names.length === 0
      ? ` — none exist${scope}, add one from Module 1`
      : names.length <= 12
        ? ` (valid${scope}: ${names.join(', ')})`
        : ` — pick a value from the template's dropdown`
  return `${kind} "${text(value)}" not found${hint}`
}

function findHeaderRow(rows: PlanCell[][]): { index: number; columns: Partial<Record<PlanColumnKey, number>> } | null {
  for (let index = 0; index < Math.min(rows.length, 10); index++) {
    const columns: Partial<Record<PlanColumnKey, number>> = {}
    rows[index].forEach((cell, columnIndex) => {
      const key = HEADER_ALIASES[normalizeHeader(cell)]
      if (key && columns[key] === undefined) columns[key] = columnIndex
    })
    if (columns.designation !== undefined && columns.position !== undefined) return { index, columns }
  }
  return null
}

const FILL_DOWN_ORDER: PlanColumnKey[] = ['organization', 'location', 'hospital', 'department']
const DEPARTMENT_SCOPED: PlanColumnKey[] = ['numberOfBeds', 'operatingHours', 'workingHours', 'employeeId']

/**
 * Converts the rows of an uploaded "Excel Upload" sheet into one autofill group per
 * department. Blank Organization/Location/Hospital/Department cells repeat the value
 * above (changing a level clears the levels below it). Planned rows become designation
 * lines (Staffing Ratio, Monthly Salary, Leave Buffer, Current Staff required); Non
 * Planned rows become position request drafts (Requested Positions, Reason, Additional
 * Monthly Budget, Requested By required). Invalid rows are skipped and reported.
 */
export function parsePlanRows(rows: PlanCell[][], hierarchy: HierarchyOrganization[]): PlanUploadResult {
  const errors: string[] = []
  const header = findHeaderRow(rows)
  if (!header) {
    return { groups: [], errors: ['Could not find the header row — use the downloaded format (it needs "Designation" and "Position" columns).'] }
  }
  const missing = REQUIRED_COLUMNS.filter((key) => header.columns[key] === undefined)
  if (missing.length > 0) {
    const labels = missing.map((key) => PLAN_COLUMNS.find((column) => column.key === key)?.header)
    return { groups: [], errors: [`Missing column(s): ${labels.join(', ')}. Use the downloaded format.`] }
  }

  const groups = new Map<string, UploadedPlanGroup>()
  const seen = new Map<string, Set<string>>()
  const carry: PlanRowValues = {}

  for (let rowIndex = header.index + 1; rowIndex < rows.length; rowIndex++) {
    const rowNumber = rowIndex + 1
    const row: PlanRowValues = {}
    for (const [key, columnIndex] of Object.entries(header.columns) as [PlanColumnKey, number][]) {
      row[key] = rows[rowIndex][columnIndex]
    }
    if (Object.values(row).every(isBlank)) continue

    FILL_DOWN_ORDER.forEach((key, level) => {
      if (isBlank(row[key]) || normalizeName(row[key]) === normalizeName(carry[key])) return
      carry[key] = row[key]
      FILL_DOWN_ORDER.slice(level + 1).forEach((lower) => delete carry[lower])
      DEPARTMENT_SCOPED.forEach((scoped) => delete carry[scoped])
    })
    DEPARTMENT_SCOPED.forEach((key) => {
      if (!isBlank(row[key])) carry[key] = row[key]
    })

    const hasDesignation = !isBlank(row.designation)
    if (isBlank(carry.department)) {
      if (hasDesignation) errors.push(`Row ${rowNumber}: Organization, Location, Hospital and Department are required.`)
      continue
    }

    const organization = findByName(hierarchy, carry.organization)
    if (!organization) {
      errors.push(`Row ${rowNumber}: ${notFound('Organization', carry.organization, hierarchy)}`)
      continue
    }
    const location: HierarchyLocation | undefined = findByName(organization.locations, carry.location)
    if (!location) {
      errors.push(`Row ${rowNumber}: ${notFound('Location', carry.location, organization.locations, ` in ${organization.name}`)}`)
      continue
    }
    const hospital: HierarchyHospital | undefined = findByName(location.hospitals, carry.hospital)
    if (!hospital) {
      errors.push(`Row ${rowNumber}: ${notFound('Hospital', carry.hospital, location.hospitals, ` in ${location.name}`)}`)
      continue
    }
    const department = findByName(hospital.departments, carry.department)
    if (!department) {
      errors.push(`Row ${rowNumber}: ${notFound('Department', carry.department, hospital.departments, ` in ${hospital.name}`)}`)
      continue
    }

    let group = groups.get(department.id)
    if (!group) {
      group = {
        key: department.id,
        label: `${location.name} / ${hospital.name} / ${department.name}`,
        organizationId: organization.id,
        locationId: location.id,
        hospitalId: hospital.id,
        departmentId: department.id,
        lines: [],
        requests: [],
      }
      groups.set(department.id, group)
      seen.set(department.id, new Set())
    }
    applyDepartmentValues(group, carry, rowNumber, errors)

    if (!hasDesignation) continue
    const designation = findByName(organization.designations, row.designation)
    if (!designation) {
      errors.push(
        `Row ${rowNumber}: Designation "${text(row.designation)}" not found — add it first (Additional Position Requests → + Add Designation).`,
      )
      continue
    }
    const position = parsePosition(row.position)
    if (!position) {
      errors.push(`Row ${rowNumber} (${designation.name}): Position must be "${POSITION_PLANNED}" or "${POSITION_NON_PLANNED}".`)
      continue
    }

    const duplicateKey = `${position}:${designation.id}`
    const positionLabel = position === 'PLANNED' ? POSITION_PLANNED : POSITION_NON_PLANNED
    if (seen.get(department.id)!.has(duplicateKey)) {
      errors.push(`Row ${rowNumber}: ${designation.name} (${positionLabel}) is listed more than once for ${group.label} — duplicate skipped.`)
      continue
    }

    const rowErrors: string[] = []
    if (position === 'PLANNED') {
      const staffingRatio = requiredNumber(row.staffingRatio, 'Staffing Ratio', rowErrors, { greaterThanZero: true })
      const monthlySalary = requiredNumber(row.monthlySalary, 'Monthly Salary', rowErrors)
      const leaveBufferPct = requiredNumber(row.leaveBuffer, 'Leave Buffer', rowErrors)
      const currentStaff = requiredNumber(row.currentStaff, 'Current Staff', rowErrors, { integer: true })
      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNumber} (${designation.name} – ${positionLabel}): ${rowErrors.join('; ')}.`)
        continue
      }
      group.lines.push({
        designationId: designation.id,
        designationName: designation.name,
        staffingRatio: staffingRatio!,
        monthlySalary: monthlySalary!,
        leaveBufferPct: leaveBufferPct!,
        currentStaff: currentStaff!,
        planned: true,
      })
    } else {
      const requestedPositions = requiredNumber(row.requestedPositions, 'Requested Positions', rowErrors, {
        integer: true,
        greaterThanZero: true,
      })
      const additionalMonthlyBudget = requiredNumber(row.additionalBudget, 'Additional Monthly Budget', rowErrors)
      if (isBlank(row.reason)) rowErrors.push('Reason is required')
      if (isBlank(row.requestedBy)) rowErrors.push('Requested By is required')
      const currentStaff = optionalNumber(row.currentStaff, 'Current Staff', rowErrors)
      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNumber} (${designation.name} – ${positionLabel}): ${rowErrors.join('; ')}.`)
        continue
      }
      group.requests.push({
        clientKey: crypto.randomUUID(),
        designationId: designation.id,
        requestedPositions: requestedPositions!,
        currentStaff: currentStaff ?? -1,
        reason: text(row.reason),
        additionalMonthlyBudget: additionalMonthlyBudget!,
        requestedBy: text(row.requestedBy),
      })
    }
    seen.get(department.id)!.add(duplicateKey)
  }

  for (const group of groups.values()) {
    const plannedStaff = new Map(group.lines.map((line) => [line.designationId, line.currentStaff]))
    group.requests.forEach((request) => {
      if (request.currentStaff < 0) request.currentStaff = plannedStaff.get(request.designationId) ?? 0
    })
  }

  return { groups: [...groups.values()], errors }
}

function applyDepartmentValues(group: UploadedPlanGroup, carry: PlanRowValues, rowNumber: number, errors: string[]) {
  if (group.employeeId === undefined && !isBlank(carry.employeeId)) group.employeeId = text(carry.employeeId)

  const fields: [PlanColumnKey, 'numberOfBeds' | 'departmentOperatingHours' | 'employeeWorkingHours', string][] = [
    ['numberOfBeds', 'numberOfBeds', 'No of Beds'],
    ['operatingHours', 'departmentOperatingHours', 'Operating Hours'],
    ['workingHours', 'employeeWorkingHours', 'Employee Working Hours'],
  ]
  for (const [column, field, label] of fields) {
    const value = toNumber(carry[column])
    if (value === undefined) continue
    const isHours = column !== 'numberOfBeds'
    const valid = isHours
      ? !Number.isNaN(value) && value > 0 && value <= MAX_HOURS_PER_DAY
      : Number.isInteger(value) && value >= 0
    if (!valid) {
      const rule = isHours ? `must be between 0 and ${MAX_HOURS_PER_DAY}` : 'must be a whole number of 0 or more'
      const message = `Row ${rowNumber}: ${label} "${text(carry[column])}" ${rule} for ${group.label} — ignored.`
      if (!errors.includes(message)) errors.push(message)
      delete carry[column]
      continue
    }
    if (group[field] === undefined) {
      group[field] = value
    } else if (group[field] !== value) {
      errors.push(`Row ${rowNumber}: ${label} ${value} differs from ${group[field]} given earlier for ${group.label} — kept ${group[field]}.`)
      carry[column] = group[field]
    }
  }
}

function requiredNumber(
  value: PlanCell,
  label: string,
  rowErrors: string[],
  rules: { integer?: boolean; greaterThanZero?: boolean } = {},
): number | undefined {
  const parsed = toNumber(value)
  if (parsed === undefined) {
    rowErrors.push(`${label} is required`)
    return undefined
  }
  return validateNumber(parsed, label, rowErrors, rules)
}

function optionalNumber(value: PlanCell, label: string, rowErrors: string[]): number | undefined {
  const parsed = toNumber(value)
  return parsed === undefined ? undefined : validateNumber(parsed, label, rowErrors, { integer: true })
}

function validateNumber(
  value: number,
  label: string,
  rowErrors: string[],
  rules: { integer?: boolean; greaterThanZero?: boolean },
): number | undefined {
  if (Number.isNaN(value)) rowErrors.push(`${label} must be a number`)
  else if (rules.greaterThanZero ? value <= 0 : value < 0) rowErrors.push(`${label} must be ${rules.greaterThanZero ? 'greater than 0' : '0 or more'}`)
  else if (rules.integer && !Number.isInteger(value)) rowErrors.push(`${label} must be a whole number`)
  else return value
  return undefined
}
