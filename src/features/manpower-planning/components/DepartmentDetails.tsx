import { SectionCard } from '../../../components/SectionCard'
import { STEP_THEMES } from '../stepTheme'
import { parseNumericInput } from '../../../utils/numberInput'

const MAX_HOURS_PER_DAY = 24

const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 px-3 py-2 transition-shadow focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600'

export interface DepartmentParameters {
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
}

interface DepartmentDetailsProps {
  parameters: DepartmentParameters
  onChange: (parameters: DepartmentParameters) => void
  isSaved: boolean
  onSave: () => void
  onModify: () => void
  isSaving?: boolean
  disabled?: boolean
}

function isValidHours(hours: number) {
  return hours > 0 && hours <= MAX_HOURS_PER_DAY
}

export function DepartmentDetails({
  parameters,
  onChange,
  isSaved,
  onSave,
  onModify,
  isSaving,
  disabled,
}: DepartmentDetailsProps) {
  const isReadOnly = disabled || isSaved
  const isValid =
    parameters.numberOfBeds >= 0 &&
    isValidHours(parameters.departmentOperatingHours) &&
    isValidHours(parameters.employeeWorkingHours)

  return (
    <SectionCard
      stepNumber={STEP_THEMES.departmentParameters.stepNumber}
      color={STEP_THEMES.departmentParameters.color}
      tintColor={STEP_THEMES.departmentParameters.tintColor}
      title="Department Details"
      infoBullets={STEP_THEMES.departmentParameters.bullets}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Number of Beds</span>
          <input
            type="number"
            min={0}
            className={INPUT_CLASS}
            value={parameters.numberOfBeds}
            disabled={isReadOnly}
            onChange={(event) => onChange({ ...parameters, numberOfBeds: parseNumericInput(event) })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Department Operating Hours (per day)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0.1}
              max={MAX_HOURS_PER_DAY}
              step={0.5}
              className={INPUT_CLASS}
              value={parameters.departmentOperatingHours}
              disabled={isReadOnly}
              onChange={(event) => onChange({ ...parameters, departmentOperatingHours: parseNumericInput(event) })}
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
          {!isValidHours(parameters.departmentOperatingHours) && (
            <span className="text-xs text-red-600">Operating hours must be between 0 and {MAX_HOURS_PER_DAY} per day.</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Employee Working Hours (per day)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0.1}
              max={MAX_HOURS_PER_DAY}
              step={0.5}
              className={INPUT_CLASS}
              value={parameters.employeeWorkingHours}
              disabled={isReadOnly}
              onChange={(event) => onChange({ ...parameters, employeeWorkingHours: parseNumericInput(event) })}
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
          {!isValidHours(parameters.employeeWorkingHours) && (
            <span className="text-xs text-red-600">Working hours must be between 0 and {MAX_HOURS_PER_DAY} per day.</span>
          )}
        </label>
      </div>

      {!disabled && (
        <div className="mt-4 flex items-center justify-end gap-3">
          {isSaved && <span className="text-xs font-medium text-emerald-700">✓ Saved — fields are locked</span>}
          {isSaved ? (
            <button
              type="button"
              className="app-button rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
              onClick={onModify}
            >
              ✎ Modify
            </button>
          ) : (
            <button
              type="button"
              className="app-button rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              disabled={!isValid || isSaving}
              onClick={onSave}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      )}
    </SectionCard>
  )
}
