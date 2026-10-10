import { httpClient } from './httpClient'
import type {
  DesignationLine,
  Lookup,
  ManpowerPlan,
  ManpowerPlanListItem,
  ManpowerPlanReportFilter,
  ManpowerPlanReportRow,
  PlanningPeriod,
  PositionRequest,
  PositionRequestStatus,
} from '../types/manpowerPlanning'

export const referenceDataApi = {
  getOrganizations: () => httpClient.get<Lookup[]>('/organizations').then((res) => res.data),
  getLocations: (organizationId: string) =>
    httpClient.get<Lookup[]>(`/organizations/${organizationId}/locations`).then((res) => res.data),
  getHospitals: (locationId: string) =>
    httpClient.get<Lookup[]>(`/locations/${locationId}/hospitals`).then((res) => res.data),
  getDepartments: (hospitalId: string) =>
    httpClient.get<Lookup[]>(`/hospitals/${hospitalId}/departments`).then((res) => res.data),
  getDesignations: (organizationId: string) =>
    httpClient.get<Lookup[]>(`/organizations/${organizationId}/designations`).then((res) => res.data),
  createDesignation: (organizationId: string, code: string, name: string) =>
    httpClient
      .post<Lookup>(`/organizations/${organizationId}/designations`, { code, name })
      .then((res) => res.data),
  getPlanningPeriods: () => httpClient.get<PlanningPeriod[]>('/planning-periods').then((res) => res.data),
}

export interface CreateManpowerPlanPayload {
  organizationId: string
  locationId: string
  hospitalId: string
  departmentId: string
  planningPeriodId: string
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
  createdBy: string
  designations: Pick<
    DesignationLine,
    'designationId' | 'staffingRatio' | 'monthlySalary' | 'leaveBufferPct' | 'currentStaff' | 'planned'
  >[]
}

export type UpdateManpowerPlanPayload = Omit<
  CreateManpowerPlanPayload,
  'organizationId' | 'locationId' | 'hospitalId' | 'departmentId' | 'planningPeriodId' | 'createdBy'
>

export const manpowerPlanApi = {
  createPlan: (payload: CreateManpowerPlanPayload) =>
    httpClient.post<ManpowerPlan>('/manpower-plans', payload).then((res) => res.data),
  getPlan: (planId: string) => httpClient.get<ManpowerPlan>(`/manpower-plans/${planId}`).then((res) => res.data),
  getPreviousPlans: (hospitalId: string, departmentId: string) =>
    httpClient
      .get<ManpowerPlanListItem[]>('/manpower-plans', { params: { hospitalId, departmentId } })
      .then((res) => res.data),
  updatePlan: (planId: string, payload: UpdateManpowerPlanPayload) =>
    httpClient.put<ManpowerPlan>(`/manpower-plans/${planId}`, payload).then((res) => res.data),
  submitForApproval: (planId: string, submittedBy: string) =>
    httpClient
      .post<ManpowerPlan>(`/manpower-plans/${planId}/submit`, { submittedBy })
      .then((res) => res.data),
  reopenForModification: (planId: string) =>
    httpClient.post<ManpowerPlan>(`/manpower-plans/${planId}/reopen`, {}).then((res) => res.data),
}

export interface CreatePositionRequestPayload {
  planId?: string
  departmentId: string
  designationId: string
  requestedPositions: number
  currentStaff: number
  reason: string
  additionalMonthlyBudget: number
  requestedBy: string
}

export const positionRequestApi = {
  create: (payload: CreatePositionRequestPayload) =>
    httpClient.post<PositionRequest>('/position-requests', payload).then((res) => res.data),
  getByDepartment: (departmentId: string) =>
    httpClient
      .get<PositionRequest[]>('/position-requests', { params: { departmentId } })
      .then((res) => res.data),
  updateStatus: (id: string, status: PositionRequestStatus, reviewedBy: string) =>
    httpClient
      .patch<PositionRequest>(`/position-requests/${id}/status`, { status, reviewedBy })
      .then((res) => res.data),
}

export const reportApi = {
  generateReport: (filter: ManpowerPlanReportFilter) =>
    httpClient.get<ManpowerPlanReportRow[]>('/reports/manpower-plans', { params: filter }).then((res) => res.data),
  exportReportUrl: (filter: ManpowerPlanReportFilter) => {
    const params = new URLSearchParams(
      Object.entries(filter).filter(([, value]) => value !== undefined && value !== '') as [string, string][],
    )
    return `${httpClient.defaults.baseURL}/reports/manpower-plans/export?${params.toString()}`
  },
}
