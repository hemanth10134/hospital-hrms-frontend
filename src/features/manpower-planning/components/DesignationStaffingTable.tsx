import { useRef, useState } from 'react'
import type { DesignationLine, Lookup } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { InfoTooltip } from '../../../components/InfoTooltip'
import { formatCurrency } from '../../../utils/formatters'
import { withComputedFields } from '../staffingCalculations'
import { downloadCsv, exportDesignationLinesToCsv, parseDesignationLinesCsv } from '../csvImportExport'
import { STEP_THEMES } from '../stepTheme'
import { AddDesignationModal } from './AddDesignationModal'

type VisibilityFilter = 'ALL' | 'VACANT_ONLY' | 'FULLY_STAFFED' | 'PLANNED' | 'NOT_PLANNED'

interface DesignationStaffingTableProps {
  lines: DesignationLine[]
  designationOptions: Lookup[]
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
  onChange: (lines: DesignationLine[]) => void
  disabled?: boolean
  locationName?: string
  planStatus?: string
}

export function DesignationStaffingTable({
  lines,
  designationOptions,
  numberOfBeds,
  departmentOperatingHours,
  employeeWorkingHours,
  onChange,
  disabled,
  locationName,
  planStatus,
}: DesignationStaffingTableProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL')
  const [importErrors, setImportErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const computedLines = lines.map((line) =>
    withComputedFields(line, numberOfBeds, departmentOperatingHours, employeeWorkingHours),
  )

  const visibleLines = computedLines
    .map((line, originalIndex) => ({ line, originalIndex }))
    .filter(({ line }) => line.designationName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(({ line }) => {
      if (visibilityFilter === 'VACANT_ONLY') return line.vacancies > 0
      if (visibilityFilter === 'FULLY_STAFFED') return line.vacancies === 0
      if (visibilityFilter === 'PLANNED') return line.planned !== false
      if (visibilityFilter === 'NOT_PLANNED') return line.planned === false
      return true
    })

  function handleSave(line: DesignationLine, index: number | null) {
    if (index === null) {
      onChange([...lines, line])
    } else {
      onChange(lines.map((existing, i) => (i === index ? line : existing)))
    }
    setIsAdding(false)
    setEditingIndex(null)
  }

  function handleDelete(index: number) {
    onChange(lines.filter((_, i) => i !== index))
  }

  function handleDownload() {
    downloadCsv('designation-wise-staffing.csv', exportDesignationLinesToCsv(computedLines, locationName, planStatus))
  }

  const existingDesignationIds = lines
    .filter((_, index) => index !== editingIndex)
    .map((line) => line.designationId)

  function handleUploadFile(file: File) {
    file.text().then((content) => {
      const { lines: importedLines, errors } = parseDesignationLinesCsv(content, designationOptions)
      setImportErrors(errors)
      if (importedLines.length > 0) {
        onChange([...lines, ...importedLines])
      }
    })
  }

  return (
    <SectionCard
      stepNumber={STEP_THEMES.designationPlanning.stepNumber}
      color={STEP_THEMES.designationPlanning.color}
      tintColor={STEP_THEMES.designationPlanning.tintColor}
      title="Designation-wise Staffing"
      description="Set staffing ratio, salary and leave buffer for each designation. Required staff, vacancies and budget are calculated automatically."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="app-select rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-600"
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value as VisibilityFilter)}
          >
            <option value="ALL">Show All Designations</option>
            <option value="VACANT_ONLY">Vacant Only</option>
            <option value="FULLY_STAFFED">Fully Staffed</option>
            <option value="PLANNED">Planned</option>
            <option value="NOT_PLANNED">Not Planned</option>
          </select>
          <input
            type="search"
            placeholder="Search designation..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm transition-shadow focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button
            type="button"
            className="app-button rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50"
            disabled={disabled || designationOptions.length === 0}
            onClick={() => fileInputRef.current?.click()}
          >
            ⬆ Upload Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) handleUploadFile(file)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            className="app-button rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50"
            disabled={disabled}
            onClick={() => setIsAdding(true)}
          >
            + Add Designation
          </button>
        </div>
      }
    >
      {importErrors.length > 0 && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {importErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Designation</th>
              <th className="py-2 pr-3">
                Staffing Ratio <InfoTooltip text="Number of beds each staff member covers" />
              </th>
              <th className="py-2 pr-3">Monthly Salary (₹)</th>
              <th className="py-2 pr-3">
                Leave Buffer (%) <InfoTooltip text="Extra staff % added to cover planned leave" />
              </th>
              <th className="py-2 pr-3">
                Required Staff <InfoTooltip text="Auto-calculated from beds, ratio, shifts and leave buffer" />
              </th>
              <th className="py-2 pr-3">
                Current Staff <InfoTooltip text="Staff currently in position for this designation" />
              </th>
              <th className="py-2 pr-3">
                Staffing % <InfoTooltip text="Current staff as a percentage of required staff" />
              </th>
              <th className="py-2 pr-3">Vacancies</th>
              <th className="py-2 pr-3">Excess</th>
              <th className="py-2 pr-3">Monthly Budget (₹)</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleLines.map(({ line, originalIndex }, displayIndex) => (
              <tr
                key={line.id ?? line.designationId}
                className="animate-row-enter border-b border-slate-100 transition-colors hover:bg-slate-50"
              >
                <td className="py-2 pr-3 text-slate-500">{displayIndex + 1}</td>
                <td className="py-2 pr-3 font-medium text-slate-800">{line.designationName}</td>
                <td className="py-2 pr-3">{line.staffingRatio}</td>
                <td className="py-2 pr-3">{formatCurrency(line.monthlySalary)}</td>
                <td className="py-2 pr-3">{line.leaveBufferPct}%</td>
                <td className="py-2 pr-3 font-semibold">{line.requiredStaff}</td>
                <td className="py-2 pr-3">{line.currentStaff}</td>
                <td className="py-2 pr-3">{line.staffingPercentage}%</td>
                <td className="py-2 pr-3">
                  {line.vacancies > 0 ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 font-semibold text-red-700 transition-colors">
                      {line.vacancies}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 pr-3">
                  {line.excess > 0 ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 transition-colors">
                      {line.excess}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 pr-3">{formatCurrency(line.monthlyBudget)}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                      line.planned === false ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {line.planned === false ? 'Not Planned' : 'Planned'}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                      disabled={disabled}
                      onClick={() => setEditingIndex(originalIndex)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-600 transition-colors hover:text-red-800 hover:underline"
                      disabled={disabled}
                      onClick={() => handleDelete(originalIndex)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleLines.length === 0 && (
              <tr>
                <td colSpan={13} className="py-6 text-center text-slate-400">
                  {lines.length === 0
                    ? 'No designations added yet. Click "Add Designation" to get started.'
                    : 'No designations match your search/filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline disabled:text-slate-400 disabled:no-underline"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
        >
          + Add Designation
        </button>
        <button
          type="button"
          className="app-button rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50"
          onClick={handleDownload}
          disabled={computedLines.length === 0}
        >
          ⬇ Download
        </button>
      </div>

      {(isAdding || editingIndex !== null) && (
        <AddDesignationModal
          designationOptions={designationOptions}
          initialValue={editingIndex !== null ? lines[editingIndex] : undefined}
          existingDesignationIds={existingDesignationIds}
          onCancel={() => {
            setIsAdding(false)
            setEditingIndex(null)
          }}
          onSave={(line) => handleSave(line, editingIndex)}
        />
      )}
    </SectionCard>
  )
}
