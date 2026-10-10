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
  planned?: boolean
  requiredStaff?: number
  staffingPercentage?: number
  vacancies?: number
  excess?: number
  monthlyBudget?: number
}

export interface DepartmentSummary {
  totalRequiredStaff: number
  currentStaff: number
  openPositions: number
  estimatedMonthlyBudget: number
  additionalPositions?: number
  additionalMonthlyBudgetRequested?: number
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

export interface ManpowerPlanReportRow {
  planId: string
  organizationName: string
  locationName: string
  hospitalName: string
  departmentName: string
  designationName: string
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
  staffingRatio: number
  monthlySalary: number
  leaveBufferPct: number
  planned: boolean
  requiredStaff: number
  currentStaff: number
  vacancies: number
  excess: number
  staffingStatus: string
  monthlyBudget: number
  planStatus: string
  requestedPositions: number
  additionalMonthlyBudget: number
  requestReasons: string
  requestedBy: string
}

export interface ManpowerPlanReportFilter {
  organizationId?: string
  locationId?: string
  hospitalId?: string
  departmentId?: string
  designationId?: string
  planStatus?: string
  vacancyFilter?: 'VACANT_ONLY' | 'FULLY_STAFFED'
  plannedFilter?: 'PLANNED' | 'NOT_PLANNED'
}

export interface PositionRequest {
  id: string
  department: Lookup
  designation: Lookup
  requestedPositions: number
  currentStaff: number
  reason: string
  additionalMonthlyBudget: number
  status: PositionRequestStatus
  requestedBy: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
}

export interface PositionRequestDraft {
  clientKey: string
  designationId: string
  requestedPositions: number
  currentStaff: number
  reason: string
  additionalMonthlyBudget: number
  requestedBy: string
}

export interface HierarchyHospital extends Lookup {
  departments: Lookup[]
}

export interface HierarchyLocation extends Lookup {
  hospitals: HierarchyHospital[]
}

export interface HierarchyOrganization extends Lookup {
  designations: Lookup[]
  locations: HierarchyLocation[]
}
