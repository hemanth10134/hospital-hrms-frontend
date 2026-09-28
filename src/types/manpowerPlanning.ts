export interface Lookup {
  id: string
  code: string
  name: string
}

export interface PlanningPeriod {
  id: string
  code: string
  label: string
  startDate: string
  endDate: string
}

export interface DesignationLine {
  id?: string
  designationId: string
  designationName?: string
  staffingRatio: number
  monthlySalary: number
  leaveBufferPct: number
  currentStaff: number
  requiredStaff?: number
  vacancies?: number
  excess?: number
  monthlyBudget?: number
}

export interface DepartmentSummary {
  totalRequiredStaff: number
  currentStaff: number
  openPositions: number
  estimatedMonthlyBudget: number
}

export type PlanStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface ManpowerPlan {
  id: string
  organization: Lookup
  location: Lookup
  hospital: Lookup
  department: Lookup
  planningPeriod: PlanningPeriod
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
  status: PlanStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  designations: DesignationLine[]
  summary: DepartmentSummary
}

export interface ManpowerPlanListItem {
  id: string
  planningPeriodLabel: string
  status: PlanStatus
  createdBy: string
  createdAt: string
  submittedAt?: string | null
}

export type PositionRequestStatus = 'PENDING_APPROVAL' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

export interface PositionRequest {
  id: string
  department: Lookup
  designation: Lookup
  requestedPositions: number
  reason: string
  additionalMonthlyBudget: number
  status: PositionRequestStatus
  requestedBy: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
}
