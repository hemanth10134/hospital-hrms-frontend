import { useRef, useState } from 'react'
import type { DesignationLine, Lookup } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { InfoTooltip } from '../../../components/InfoTooltip'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { formatCurrency } from '../../../utils/formatters'
import { parseNumericInput } from '../../../utils/numberInput'
import { withComputedFields } from '../staffingCalculations'
import { STEP_THEMES } from '../stepTheme'

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

const CELL_INPUT_CLASS =
  'w-full min-w-[72px] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:border-transparent disabled:bg-transparent disabled:px-0'

const FORM_INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100'

const EMPTY_DRAFT = { designationId: '', staffingRatio: 1, monthlySalary: 0, leaveBufferPct: 0, currentStaff: 0, planned: true }

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
  const [searchTerm, setSearchTerm] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('ALL')
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
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

  const existingDesignationIds = lines.map((line) => line.designationId)
  const canAddDraft = draft.designationId !== '' && draft.staffingRatio > 0 && draft.monthlySalary >= 0

  function updateLine(index: number, patch: Partial<DesignationLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function handleDelete(index: number) {
    onChange(lines.filter((_, i) => i !== index))
  }

  function handleAddDraft() {
    if (!canAddDraft || existingDesignationIds.includes(draft.designationId)) return
    const designation = designationOptions.find((option) => option.id === draft.designationId)
    onChange([...lines, { ...draft, designationName: designation?.name }])
    setDraft(EMPTY_DRAFT)
  }

  // Lazy-loaded: exceljs is a large dependency only needed when the user actually
  // uploads or downloads a workbook, so it shouldn't bloat the initial page bundle.
  async function handleDownload() {
    const { exportDesignationLinesToExcel, downloadBlob } = await import('../excelImportExport')
    const blob = await exportDesignationLinesToExcel(computedLines, designationOptions, locationName, planStatus)
    downloadBlob('designation-wise-staffing.xlsx', blob)
  }

  async function handleDownloadTemplate() {
    const { exportDesignationTemplate, downloadBlob } = await import('../excelImportExport')
    downloadBlob('designation-upload-format.xlsx', await exportDesignationTemplate(designationOptions))
  }

  async function handleUploadFile(file: File) {
    const { parseDesignationLinesExcel } = await import('../excelImportExport')
    const { lines: importedLines, errors } = await parseDesignationLinesExcel(file, designationOptions)

    const existingIds = new Set(existingDesignationIds)
    const acceptedLines: DesignationLine[] = []
    const duplicateErrors: string[] = []
    for (const line of importedLines) {
      if (existingIds.has(line.designationId)) {
        duplicateErrors.push(`"${line.designationName}" is already in this plan — skipped.`)
        continue
      }
      existingIds.add(line.designationId)
      acceptedLines.push(line)
    }

    setImportErrors([...errors, ...duplicateErrors])
    if (acceptedLines.length > 0) {
      onChange([...lines, ...acceptedLines])
    }
  }

  return (
    <SectionCard
      stepNumber={STEP_THEMES.designationPlanning.stepNumber}
      color={STEP_THEMES.designationPlanning.color}
      tintColor={STEP_THEMES.designationPlanning.tintColor}
      title="Designation-wise Staffing"
      description="Set staffing ratio, salary and leave buffer for each designation. Required staff, vacancies and budget are calculated automatically."
      infoBullets={STEP_THEMES.designationPlanning.bullets}
      actions={
        <>
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
            disabled={designationOptions.length === 0}
            onClick={handleDownloadTemplate}
          >
            ⬇ Download Excel Format
          </button>
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
            accept=".xlsx"
            className="hidden"
            data-testid="designation-upload-input"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) handleUploadFile(file)
              event.target.value = ''
            }}
          />
        </>
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
        <table className="w-full min-w-[1100px] border-collapse text-sm">
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
              <th className="py-2 pr-3">Position</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleLines.map(({ line, originalIndex }, displayIndex) => (
              <tr key={line.id ?? line.designationId} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                <td className="py-2 pr-3 text-slate-500">{displayIndex + 1}</td>
                <td className="py-2 pr-3 font-medium text-slate-800">{line.designationName}</td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0.01}
                    step={0.5}
                    aria-label={`Staffing ratio for ${line.designationName}`}
                    className={CELL_INPUT_CLASS}
                    value={line.staffingRatio}
                    disabled={disabled}
                    onChange={(event) => updateLine(originalIndex, { staffingRatio: parseNumericInput(event) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    aria-label={`Monthly salary for ${line.designationName}`}
                    className={CELL_INPUT_CLASS}
                    value={line.monthlySalary}
                    disabled={disabled}
                    onChange={(event) => updateLine(originalIndex, { monthlySalary: parseNumericInput(event) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    aria-label={`Leave buffer for ${line.designationName}`}
                    className={CELL_INPUT_CLASS}
                    value={line.leaveBufferPct}
                    disabled={disabled}
                    onChange={(event) => updateLine(originalIndex, { leaveBufferPct: parseNumericInput(event) })}
                  />
                </td>
                <td className="py-2 pr-3 font-semibold">{line.requiredStaff}</td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    aria-label={`Current staff for ${line.designationName}`}
                    className={CELL_INPUT_CLASS}
                    value={line.currentStaff}
                    disabled={disabled}
                    onChange={(event) => updateLine(originalIndex, { currentStaff: parseNumericInput(event) })}
                  />
                </td>
                <td className="py-2 pr-3">{line.staffingPercentage}%</td>
                <td className="py-2 pr-3">
                  {line.vacancies > 0 ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 font-semibold text-red-700">{line.vacancies}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 pr-3">
                  {line.excess > 0 ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">{line.excess}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 pr-3">{formatCurrency(line.monthlyBudget)}</td>
                <td className="py-2 pr-3">
                  <select
                    aria-label={`Position status for ${line.designationName}`}
                    className="app-select rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent"
                    value={line.planned === false ? 'NOT_PLANNED' : 'PLANNED'}
                    disabled={disabled}
                    onChange={(event) => updateLine(originalIndex, { planned: event.target.value === 'PLANNED' })}
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="NOT_PLANNED">Not Planned</option>
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <button
                    type="button"
                    className="text-red-600 transition-colors hover:text-red-800 hover:underline disabled:text-slate-300 disabled:no-underline"
                    disabled={disabled}
                    onClick={() => handleDelete(originalIndex)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {visibleLines.length === 0 && (
              <tr>
                <td colSpan={13} className="py-6 text-center text-slate-400">
                  {lines.length === 0
                    ? 'No designations added yet. Use the row below to add one.'
                    : 'No designations match your search/filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <div className="mt-4 rounded-lg border border-dashed border-orange-300 bg-white/70 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-700">Add Designation</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-8 lg:items-end">
            <div className="lg:col-span-2">
              <SearchableSelect
                label="Designation"
                value={draft.designationId}
                options={designationOptions}
                placeholder="Select designation"
                disabledOptionIds={existingDesignationIds}
                onChange={(designationId) => setDraft((current) => ({ ...current, designationId }))}
              />
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-600">Staffing Ratio</span>
              <input
                type="number"
                min={0.01}
                step={0.5}
                className={FORM_INPUT_CLASS}
                value={draft.staffingRatio}
                onChange={(event) => setDraft((current) => ({ ...current, staffingRatio: parseNumericInput(event) }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-600">Monthly Salary (₹)</span>
              <input
                type="number"
                min={0}
                className={FORM_INPUT_CLASS}
                value={draft.monthlySalary}
                onChange={(event) => setDraft((current) => ({ ...current, monthlySalary: parseNumericInput(event) }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-600">Leave Buffer (%)</span>
              <input
                type="number"
                min={0}
                className={FORM_INPUT_CLASS}
                value={draft.leaveBufferPct}
                onChange={(event) => setDraft((current) => ({ ...current, leaveBufferPct: parseNumericInput(event) }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-600">Current Staff</span>
              <input
                type="number"
                min={0}
                className={FORM_INPUT_CLASS}
                value={draft.currentStaff}
                onChange={(event) => setDraft((current) => ({ ...current, currentStaff: parseNumericInput(event) }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-600">Position</span>
              <select
                aria-label="New designation position status"
                className={`app-select ${FORM_INPUT_CLASS}`}
                value={draft.planned ? 'PLANNED' : 'NOT_PLANNED'}
                onChange={(event) => setDraft((current) => ({ ...current, planned: event.target.value === 'PLANNED' }))}
              >
                <option value="PLANNED">Planned</option>
                <option value="NOT_PLANNED">Not Planned</option>
              </select>
            </label>
            <button
              type="button"
              className="app-button h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={!canAddDraft}
              onClick={handleAddDraft}
            >
              + Add
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="app-button rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50"
          onClick={handleDownload}
          disabled={computedLines.length === 0}
        >
          ⬇ Download
        </button>
      </div>
    </SectionCard>
  )
}
