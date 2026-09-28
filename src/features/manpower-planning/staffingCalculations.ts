import type { DesignationLine } from '../../types/manpowerPlanning'

/**
 * Mirrors the backend's StaffingCalculationUtil so the table can show live
 * required-staff/vacancy/budget numbers before the plan is saved. The backend
 * remains the source of truth once a plan is persisted.
 */
export function calculateRequiredStaff(
  numberOfBeds: number,
  staffingRatio: number,
  departmentOperatingHours: number,
  employeeWorkingHours: number,
  leaveBufferPct: number,
): number {
  if (staffingRatio <= 0 || employeeWorkingHours <= 0) {
    return 0
  }
  const shiftsPerDay = departmentOperatingHours / employeeWorkingHours
  const baseStaff = numberOfBeds / staffingRatio
  const bufferMultiplier = 1 + leaveBufferPct / 100
  return Math.ceil(baseStaff * shiftsPerDay * bufferMultiplier)
}

export function calculateVacancies(requiredStaff: number, currentStaff: number): number {
  return Math.max(requiredStaff - currentStaff, 0)
}

export function calculateExcess(requiredStaff: number, currentStaff: number): number {
  return Math.max(currentStaff - requiredStaff, 0)
}

export function calculateMonthlyBudget(requiredStaff: number, monthlySalary: number): number {
  return requiredStaff * monthlySalary
}

export interface ComputedDesignationLine extends DesignationLine {
  requiredStaff: number
  vacancies: number
  excess: number
  monthlyBudget: number
}

export function withComputedFields(
  line: DesignationLine,
  numberOfBeds: number,
  departmentOperatingHours: number,
  employeeWorkingHours: number,
): ComputedDesignationLine {
  const requiredStaff = calculateRequiredStaff(
    numberOfBeds,
    line.staffingRatio,
    departmentOperatingHours,
    employeeWorkingHours,
    line.leaveBufferPct,
  )
  return {
    ...line,
    requiredStaff,
    vacancies: calculateVacancies(requiredStaff, line.currentStaff),
    excess: calculateExcess(requiredStaff, line.currentStaff),
    monthlyBudget: calculateMonthlyBudget(requiredStaff, line.monthlySalary),
  }
}

export function summarize(lines: ComputedDesignationLine[]) {
  const totalRequiredStaff = lines.reduce((sum, line) => sum + line.requiredStaff, 0)
  const currentStaff = lines.reduce((sum, line) => sum + line.currentStaff, 0)
  const estimatedMonthlyBudget = lines.reduce((sum, line) => sum + line.monthlyBudget, 0)
  return {
    totalRequiredStaff,
    currentStaff,
    openPositions: totalRequiredStaff - currentStaff,
    estimatedMonthlyBudget,
  }
}
