import { useEffect, useState } from 'react'
import type { Lookup, ManpowerPlanReportFilter, ManpowerPlanReportRow, PlanStatus } from '../../types/manpowerPlanning'
import { referenceDataApi, reportApi } from '../../api/manpowerPlanningApi'
import { SearchableSelect } from '../../components/SearchableSelect'
import { formatCurrency } from '../../utils/formatters'
import { downloadBlob } from '../../utils/download'

interface ReportsPageProps {
  onClose: () => void
}

const STATUS_OPTIONS: PlanStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']

export function ReportsPage({ onClose }: ReportsPageProps) {
  const [organizations, setOrganizations] = useState<Lookup[]>([])
  const [locations, setLocations] = useState<Lookup[]>([])
  const [hospitals, setHospitals] = useState<Lookup[]>([])
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [designations, setDesignations] = useState<Lookup[]>([])

  const [filter, setFilter] = useState<ManpowerPlanReportFilter>({})
  const [rows, setRows] = useState<ManpowerPlanReportRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    referenceDataApi.getOrganizations().then(setOrganizations)
  }, [])

  useEffect(() => {
    if (!filter.organizationId) {
      setLocations([])
      setDesignations([])
      return
    }
    referenceDataApi.getLocations(filter.organizationId).then(setLocations)
    referenceDataApi.getDesignations(filter.organizationId).then(setDesignations)
  }, [filter.organizationId])

  useEffect(() => {
    if (!filter.locationId) {
      setHospitals([])
      return
    }
    referenceDataApi.getHospitals(filter.locationId).then(setHospitals)
  }, [filter.locationId])

  useEffect(() => {
    if (!filter.hospitalId) {
      setDepartments([])
      return
    }
    referenceDataApi.getDepartments(filter.hospitalId).then(setDepartments)
  }, [filter.hospitalId])

  async function handleGenerate() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await reportApi.generateReport(filter)
      setRows(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownload() {
    const { exportReportToExcel } = await import('./excelImportExport')
    downloadBlob('manpower-planning-report.xlsx', await exportReportToExcel(rows))
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <h1 className="text-xl font-bold text-slate-800">Analysis &amp; Reports</h1>
        <button
          type="button"
          className="app-button rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={onClose}
        >
          ← Back to Planning
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="app-card mb-5 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-800">Generate By</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SearchableSelect
              label="Organization"
              value={filter.organizationId ?? ''}
              options={organizations}
              onChange={(organizationId) => setFilter({ organizationId })}
            />
            <SearchableSelect
              label="Location"
              value={filter.locationId ?? ''}
              options={locations}
              disabled={!filter.organizationId}
              onChange={(locationId) => setFilter((f) => ({ ...f, locationId, hospitalId: undefined, departmentId: undefined }))}
            />
            <SearchableSelect
              label="Hospital"
              value={filter.hospitalId ?? ''}
              options={hospitals}
              disabled={!filter.locationId}
              onChange={(hospitalId) => setFilter((f) => ({ ...f, hospitalId, departmentId: undefined }))}
            />
            <SearchableSelect
              label="Department"
              value={filter.departmentId ?? ''}
              options={departments}
              disabled={!filter.hospitalId}
              onChange={(departmentId) => setFilter((f) => ({ ...f, departmentId }))}
            />
            <SearchableSelect
              label="Designation (show all)"
              value={filter.designationId ?? ''}
              options={designations}
              disabled={!filter.organizationId}
              onChange={(designationId) => setFilter((f) => ({ ...f, designationId }))}
            />

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Status Filter</span>
              <select
                className="app-select rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800"
                value={filter.planStatus ?? ''}
                onChange={(event) => setFilter((f) => ({ ...f, planStatus: event.target.value || undefined }))}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Vacancy</span>
              <select
                className="app-select rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800"
                value={filter.vacancyFilter ?? ''}
                onChange={(event) =>
                  setFilter((f) => ({
                    ...f,
                    vacancyFilter: (event.target.value || undefined) as ManpowerPlanReportFilter['vacancyFilter'],
                  }))
                }
              >
                <option value="">All</option>
                <option value="VACANT_ONLY">Vacant Only</option>
                <option value="FULLY_STAFFED">Fully Staffed</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Planned</span>
              <select
                className="app-select rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800"
                value={filter.plannedFilter ?? ''}
                onChange={(event) =>
                  setFilter((f) => ({
                    ...f,
                    plannedFilter: (event.target.value || undefined) as ManpowerPlanReportFilter['plannedFilter'],
                  }))
                }
              >
                <option value="">All</option>
                <option value="PLANNED">Planned</option>
                <option value="NOT_PLANNED">Not Planned</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="app-button rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
              onClick={handleGenerate}
            >
              {isLoading ? 'Generating…' : 'Generate Report'}
            </button>
            <button
              type="button"
              className="app-button rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={rows.length === 0}
              onClick={handleDownload}
            >
              ⬇ Download Excel
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="app-card overflow-x-auto rounded-xl bg-white p-5 shadow-sm">
          <table className="w-full min-w-[1800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-3">Organization</th>
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">Hospital</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Designation</th>
                <th className="py-2 pr-3">Staffing Status</th>
                <th className="py-2 pr-3">Planned</th>
                <th className="py-2 pr-3">No of Beds</th>
                <th className="py-2 pr-3">Operating Hours</th>
                <th className="py-2 pr-3">Working Hours</th>
                <th className="py-2 pr-3">Position</th>
                <th className="py-2 pr-3">Staffing Ratio</th>
                <th className="py-2 pr-3">Monthly Salary</th>
                <th className="py-2 pr-3">Leave Buffer %</th>
                <th className="py-2 pr-3">Current Staff</th>
                <th className="py-2 pr-3">Vacancies</th>
                <th className="py-2 pr-3">Requested Positions</th>
                <th className="py-2 pr-3">Reason</th>
                <th className="py-2 pr-3">Additional Monthly Budget</th>
                <th className="py-2 pr-3">Requested By</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.planId}-${row.designationName}-${index}`} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{row.organizationName}</td>
                  <td className="py-2 pr-3">{row.locationName}</td>
                  <td className="py-2 pr-3">{row.hospitalName}</td>
                  <td className="py-2 pr-3">{row.departmentName}</td>
                  <td className="py-2 pr-3 font-medium text-slate-800">{row.designationName}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        row.vacancies > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {row.staffingStatus}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{row.planned ? 'Planned' : 'Not Planned'}</td>
                  <td className="py-2 pr-3">{row.numberOfBeds}</td>
                  <td className="py-2 pr-3">{row.departmentOperatingHours}</td>
                  <td className="py-2 pr-3">{row.employeeWorkingHours}</td>
                  <td className="py-2 pr-3 font-semibold">{row.requiredStaff}</td>
                  <td className="py-2 pr-3">{row.staffingRatio}</td>
                  <td className="py-2 pr-3">{formatCurrency(row.monthlySalary)}</td>
                  <td className="py-2 pr-3">{row.leaveBufferPct}%</td>
                  <td className="py-2 pr-3">{row.currentStaff}</td>
                  <td className="py-2 pr-3">{row.vacancies}</td>
                  <td className="py-2 pr-3">{row.requestedPositions}</td>
                  <td className="max-w-[200px] truncate py-2 pr-3" title={row.requestReasons}>
                    {row.requestReasons || '-'}
                  </td>
                  <td className="py-2 pr-3">{formatCurrency(row.additionalMonthlyBudget)}</td>
                  <td className="py-2 pr-3">{row.requestedBy || '-'}</td>
                  <td className="py-2 pr-3">{row.planStatus}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={21} className="py-6 text-center text-slate-400">
                    {isLoading ? 'Loading…' : 'Choose filters and click "Generate Report".'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
