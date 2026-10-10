import { useEffect, useState } from 'react'
import type { DesignationLine, ManpowerPlanListItem, PositionRequest } from '../../types/manpowerPlanning'
import { manpowerPlanApi, positionRequestApi, referenceDataApi } from '../../api/manpowerPlanningApi'
import { HospitalLogo } from '../../components/HospitalLogo'
import { HospitalPlanningDetails, type HospitalPlanningSelection } from './components/HospitalPlanningDetails'
import { DepartmentDetails, type DepartmentParameters } from './components/DepartmentDetails'
import { DesignationStaffingTable } from './components/DesignationStaffingTable'
import { AdditionalPositionRequests } from './components/AdditionalPositionRequests'
import { DepartmentSummaryCards } from './components/DepartmentSummaryCards'
import { PreviousPlansModal } from './components/PreviousPlansModal'
import { ReportsPage } from './ReportsPage'
import { useReferenceData } from './hooks/useReferenceData'
import { summarize, withComputedFields } from './staffingCalculations'

const CURRENT_USER = 'Sunita Sharma'

const STATUS_BANNER_CLASSES: Record<'info' | 'success' | 'error', string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

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
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info')
  const [isSaving, setIsSaving] = useState(false)

  const [previousPlans, setPreviousPlans] = useState<ManpowerPlanListItem[]>([])
  const [isLoadingPreviousPlans, setIsLoadingPreviousPlans] = useState(false)
  const [showPreviousPlans, setShowPreviousPlans] = useState(false)
  const [showReports, setShowReports] = useState(false)

  const {
    organizations,
    locations,
    hospitals,
    departments,
    designations,
    planningPeriods,
    error: referenceDataError,
    retry: retryReferenceData,
    addDesignation,
  } = useReferenceData(selection)

  const selectedDepartment = departments.find((department) => department.id === selection.departmentId) ?? null

  useEffect(() => {
    if (!selection.departmentId) {
      setPositionRequests([])
      return
    }
    positionRequestApi.getByDepartment(selection.departmentId).then(setPositionRequests)
  }, [selection.departmentId])

  const [planStatus, setPlanStatus] = useState<string>('DRAFT')
  const isLocked = planStatus !== 'DRAFT'
  const [isDepartmentSaved, setIsDepartmentSaved] = useState(false)

  const computedLines = designationLines.map((line) =>
    withComputedFields(line, parameters.numberOfBeds, parameters.departmentOperatingHours, parameters.employeeWorkingHours),
  )
  const summary = summarize(computedLines, positionRequests)

  const selectedLocation = locations.find((location) => location.id === selection.locationId) ?? null

  const isReadyToSave =
    selection.organizationId &&
    selection.locationId &&
    selection.hospitalId &&
    selection.departmentId &&
    selection.planningPeriodId

  async function persistPlan() {
    const designations = designationLines.map((line) => ({
      designationId: line.designationId,
      staffingRatio: line.staffingRatio,
      monthlySalary: line.monthlySalary,
      leaveBufferPct: line.leaveBufferPct,
      currentStaff: line.currentStaff,
      planned: line.planned ?? true,
    }))

    const saved = planId
      ? await manpowerPlanApi.updatePlan(planId, {
          numberOfBeds: parameters.numberOfBeds,
          departmentOperatingHours: parameters.departmentOperatingHours,
          employeeWorkingHours: parameters.employeeWorkingHours,
          designations,
        })
      : await manpowerPlanApi.createPlan({
          organizationId: selection.organizationId,
          locationId: selection.locationId,
          hospitalId: selection.hospitalId,
          departmentId: selection.departmentId,
          planningPeriodId: selection.planningPeriodId,
          numberOfBeds: parameters.numberOfBeds,
          departmentOperatingHours: parameters.departmentOperatingHours,
          employeeWorkingHours: parameters.employeeWorkingHours,
          createdBy: CURRENT_USER,
          designations,
        })

    setPlanId(saved.id)
    return saved
  }

  async function refreshPreviousPlans() {
    if (!selection.hospitalId || !selection.departmentId) return
    setIsLoadingPreviousPlans(true)
    try {
      const plans = await manpowerPlanApi.getPreviousPlans(selection.hospitalId, selection.departmentId)
      setPreviousPlans(plans)
    } finally {
      setIsLoadingPreviousPlans(false)
    }
  }

  async function handleSaveAsDraft() {
    if (!isReadyToSave) {
      setStatusTone('error')
      setStatusMessage('Please select organization, location, hospital, department and planning period first.')
      return
    }
    setIsSaving(true)
    setStatusMessage(null)
    try {
      await persistPlan()
      setIsDepartmentSaved(true)
      setStatusTone('success')
      setStatusMessage('Draft saved successfully.')
    } catch (error) {
      setStatusTone('error')
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save draft.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveDepartmentDetails() {
    if (!isReadyToSave) {
      setIsDepartmentSaved(true)
      setStatusTone('info')
      setStatusMessage('Department details saved. Complete step 1 and use "Save as Draft" to store the plan.')
      return
    }
    setIsSaving(true)
    try {
      await persistPlan()
      setIsDepartmentSaved(true)
      setStatusTone('success')
      setStatusMessage('Department details saved.')
    } catch (error) {
      setStatusTone('error')
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save department details.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmitForApproval() {
    if (!isReadyToSave) {
      setStatusTone('error')
      setStatusMessage('Please select organization, location, hospital, department and planning period first.')
      return
    }
    if (designationLines.length === 0) {
      setStatusTone('error')
      setStatusMessage('Add at least one designation before submitting for approval.')
      return
    }
    setIsSaving(true)
    setStatusMessage(null)
    try {
      const saved = await persistPlan()
      const submitted = await manpowerPlanApi.submitForApproval(saved.id, CURRENT_USER)
      setPlanStatus(submitted.status)
      setStatusTone('success')
      setStatusMessage('✅ Plan submitted for approval successfully. Fields are now locked — use "Modify" to make changes.')
      await refreshPreviousPlans()
      setShowPreviousPlans(true)
    } catch (error) {
      setStatusTone('error')
      setStatusMessage(error instanceof Error ? error.message : 'Failed to submit plan.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleModify() {
    if (!planId) return
    setIsSaving(true)
    try {
      const reopened = await manpowerPlanApi.reopenForModification(planId)
      setPlanStatus(reopened.status)
      setStatusTone('info')
      setStatusMessage('Plan reopened for modification.')
    } catch (error) {
      setStatusTone('error')
      setStatusMessage(error instanceof Error ? error.message : 'Failed to reopen plan for modification.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleViewPreviousPlans() {
    if (!selection.hospitalId || !selection.departmentId) {
      setStatusTone('error')
      setStatusMessage('Select a hospital and department to view previous plans.')
      return
    }
    setShowPreviousPlans(true)
    await refreshPreviousPlans()
  }

  async function handleSelectPreviousPlan(previousPlanId: string) {
    const plan = await manpowerPlanApi.getPlan(previousPlanId)
    setPlanId(plan.id)
    setParameters({
      numberOfBeds: plan.numberOfBeds,
      departmentOperatingHours: plan.departmentOperatingHours,
      employeeWorkingHours: plan.employeeWorkingHours,
    })
    setDesignationLines(
      plan.designations.map((line) => ({
        id: line.id,
        designationId: line.designationId,
        designationName: line.designationName,
        staffingRatio: line.staffingRatio,
        monthlySalary: line.monthlySalary,
        leaveBufferPct: line.leaveBufferPct,
        currentStaff: line.currentStaff,
        planned: line.planned,
      })),
    )
    setPlanStatus(plan.status)
    setIsDepartmentSaved(true)
    setShowPreviousPlans(false)
    setStatusTone('info')
    setStatusMessage(`Loaded plan for ${plan.planningPeriod.label} (${plan.status}).`)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <HospitalLogo />
              <div>
                <p className="text-base font-bold leading-tight text-red-600">Park Hospital</p>
                <p className="text-[11px] leading-tight text-slate-400">Care for Life</p>
              </div>
            </div>
            <div className="hidden h-9 w-px bg-slate-200 sm:block" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold leading-tight text-slate-800">Manpower Planning</h1>
              <p className="text-sm text-slate-500">Plan, manage and get approval for hospital manpower</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="app-button flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setShowReports(true)}
            >
              <span aria-hidden="true">📊</span>
              <span className="hidden sm:inline">Analysis &amp; Reports</span>
              <span className="sm:hidden">Reports</span>
            </button>
            <button
              type="button"
              aria-label="Help"
              className="app-button flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              ?
            </button>
            <button type="button" className="app-button hidden items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-semibold text-white">
                SS
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">{CURRENT_USER}</p>
                <p className="text-xs text-slate-500">HR Manager</p>
              </div>
              <span className="text-xs text-slate-400">▾</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-5">
          {referenceDataError && (
            <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <span>{referenceDataError}</span>
              <button
                type="button"
                className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                onClick={retryReferenceData}
              >
                Retry
              </button>
            </div>
          )}
          {statusMessage && (
            <div className={`rounded-md border px-4 py-2 text-sm ${STATUS_BANNER_CLASSES[statusTone]}`}>
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
            disabled={isLocked}
          />

          <DepartmentDetails
            parameters={parameters}
            onChange={setParameters}
            isSaved={isDepartmentSaved}
            isSaving={isSaving}
            onSave={handleSaveDepartmentDetails}
            onModify={() => setIsDepartmentSaved(false)}
            disabled={isLocked}
          />

          <DesignationStaffingTable
            lines={designationLines}
            designationOptions={designations}
            numberOfBeds={parameters.numberOfBeds}
            departmentOperatingHours={parameters.departmentOperatingHours}
            employeeWorkingHours={parameters.employeeWorkingHours}
            onChange={setDesignationLines}
            disabled={isLocked}
            locationName={selectedLocation?.name}
            planStatus={planStatus}
          />

          <AdditionalPositionRequests
            department={selectedDepartment}
            designationOptions={designations}
            requests={positionRequests}
            currentStaffByDesignation={Object.fromEntries(
              designationLines.map((line) => [line.designationId, line.currentStaff]),
            )}
            defaultRequestedBy={CURRENT_USER}
            onCreate={async (draft) => {
              if (!selectedDepartment) return
              const created = await positionRequestApi.create({
                planId: planId ?? undefined,
                departmentId: selectedDepartment.id,
                ...draft,
              })
              setPositionRequests((existing) => [created, ...existing])
            }}
            onStatusChange={async (id, status) => {
              try {
                const updated = await positionRequestApi.updateStatus(id, status, CURRENT_USER)
                setPositionRequests((existing) => existing.map((request) => (request.id === id ? updated : request)))
              } catch (error) {
                setStatusTone('error')
                setStatusMessage(error instanceof Error ? error.message : 'Failed to update request status.')
              }
            }}
            onCreateDesignation={
              selection.organizationId
                ? async (draft) => {
                    const created = await referenceDataApi.createDesignation(
                      selection.organizationId,
                      draft.code,
                      draft.name,
                    )
                    addDesignation(created)
                  }
                : undefined
            }
          />

          <DepartmentSummaryCards summary={summary} />

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="app-button rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm"
              onClick={handleViewPreviousPlans}
            >
              🕐 View Previous Plan
            </button>
            <div className="flex gap-3">
              {isLocked ? (
                <button
                  type="button"
                  className="app-button flex-1 rounded-lg border border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 sm:flex-none"
                  disabled={isSaving || !planId}
                  onClick={handleModify}
                >
                  ✎ Modify
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="app-button flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50 sm:flex-none"
                    disabled={isSaving}
                    onClick={handleSaveAsDraft}
                  >
                    {isSaving ? 'Saving…' : 'Save as Draft'}
                  </button>
                  <button
                    type="button"
                    className="app-button flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50 sm:flex-none"
                    disabled={isSaving}
                    onClick={handleSubmitForApproval}
                  >
                    Submit for Approval →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {showPreviousPlans && (
        <PreviousPlansModal
          plans={previousPlans}
          isLoading={isLoadingPreviousPlans}
          onSelect={handleSelectPreviousPlan}
          onClose={() => setShowPreviousPlans(false)}
        />
      )}

      {showReports && <ReportsPage onClose={() => setShowReports(false)} />}
    </div>
  )
}
