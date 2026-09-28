import { useEffect, useState } from 'react'
import type { DesignationLine, PositionRequest } from '../../types/manpowerPlanning'
import { manpowerPlanApi, positionRequestApi } from '../../api/manpowerPlanningApi'
import { HospitalPlanningDetails, type HospitalPlanningSelection } from './components/HospitalPlanningDetails'
import { DepartmentDetails, type DepartmentParameters } from './components/DepartmentDetails'
import { DesignationStaffingTable } from './components/DesignationStaffingTable'
import { AdditionalPositionRequests } from './components/AdditionalPositionRequests'
import { DepartmentSummaryCards } from './components/DepartmentSummaryCards'
import { useReferenceData } from './hooks/useReferenceData'
import { summarize, withComputedFields } from './staffingCalculations'

const CURRENT_USER = 'Sunita Sharma'

export function ManpowerPlanningPage() {
  const [selection, setSelection] = useState<HospitalPlanningSelection>({
    organizationId: '',
    locationId: '',
    hospitalId: '',
    departmentId: '',
    planningPeriodId: '',
  })
  const [parameters, setParameters] = useState<DepartmentParameters>({
    numberOfBeds: 0,
    departmentOperatingHours: 24,
    employeeWorkingHours: 8,
  })
  const [designationLines, setDesignationLines] = useState<DesignationLine[]>([])
  const [positionRequests, setPositionRequests] = useState<PositionRequest[]>([])
  const [planId, setPlanId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { organizations, locations, hospitals, departments, designations, planningPeriods } =
    useReferenceData(selection)

  const selectedDepartment = departments.find((department) => department.id === selection.departmentId) ?? null

  useEffect(() => {
    if (!selection.departmentId) {
      setPositionRequests([])
      return
    }
    positionRequestApi.getByDepartment(selection.departmentId).then(setPositionRequests)
  }, [selection.departmentId])

  const computedLines = designationLines.map((line) =>
    withComputedFields(line, parameters.numberOfBeds, parameters.departmentOperatingHours, parameters.employeeWorkingHours),
  )
  const summary = summarize(computedLines)

  const isReadyToSave =
    selection.organizationId &&
    selection.locationId &&
    selection.hospitalId &&
    selection.departmentId &&
    selection.planningPeriodId

  async function handleSaveAsDraft() {
    if (!isReadyToSave) {
      setStatusMessage('Please select organization, location, hospital, department and planning period first.')
      return
    }
    setIsSaving(true)
    setStatusMessage(null)
    try {
      const payload = {
        organizationId: selection.organizationId,
        locationId: selection.locationId,
        hospitalId: selection.hospitalId,
        departmentId: selection.departmentId,
        planningPeriodId: selection.planningPeriodId,
        numberOfBeds: parameters.numberOfBeds,
        departmentOperatingHours: parameters.departmentOperatingHours,
        employeeWorkingHours: parameters.employeeWorkingHours,
        createdBy: CURRENT_USER,
        designations: designationLines.map((line) => ({
          designationId: line.designationId,
          staffingRatio: line.staffingRatio,
          monthlySalary: line.monthlySalary,
          leaveBufferPct: line.leaveBufferPct,
          currentStaff: line.currentStaff,
        })),
      }

      const saved = planId
        ? await manpowerPlanApi.updatePlan(planId, payload)
        : await manpowerPlanApi.createPlan(payload)

      setPlanId(saved.id)
      setStatusMessage('Draft saved successfully.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save draft.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmitForApproval() {
    if (!planId) {
      setStatusMessage('Save the plan as a draft before submitting for approval.')
      return
    }
    setIsSaving(true)
    setStatusMessage(null)
    try {
      await manpowerPlanApi.submitForApproval(planId, CURRENT_USER)
      setStatusMessage('Plan submitted for approval.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to submit plan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">Park Hospital</p>
          <h1 className="text-xl font-bold text-slate-800">Manpower Planning</h1>
          <p className="text-sm text-slate-500">Plan, manage and get approval for hospital manpower</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{CURRENT_USER}</p>
          <p className="text-xs text-slate-500">HR Manager</p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">
        {statusMessage && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            {statusMessage}
          </div>
        )}

        <HospitalPlanningDetails
          selection={selection}
          organizations={organizations}
          locations={locations}
          hospitals={hospitals}
          departments={departments}
          planningPeriods={planningPeriods}
          onChange={setSelection}
        />

        <DepartmentDetails parameters={parameters} onChange={setParameters} />

        <DesignationStaffingTable
          lines={designationLines}
          designationOptions={designations}
          numberOfBeds={parameters.numberOfBeds}
          departmentOperatingHours={parameters.departmentOperatingHours}
          employeeWorkingHours={parameters.employeeWorkingHours}
          onChange={setDesignationLines}
        />

        <AdditionalPositionRequests
          department={selectedDepartment}
          designationOptions={designations}
          requests={positionRequests}
          onCreate={async (draft) => {
            if (!selectedDepartment) return
            const created = await positionRequestApi.create({
              planId: planId ?? undefined,
              departmentId: selectedDepartment.id,
              ...draft,
            })
            setPositionRequests((existing) => [created, ...existing])
          }}
        />

        <DepartmentSummaryCards summary={summary} />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            disabled={isSaving}
            onClick={handleSaveAsDraft}
          >
            Save as Draft
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSubmitForApproval}
          >
            Submit for Approval
          </button>
        </div>
      </main>
    </div>
  )
}
