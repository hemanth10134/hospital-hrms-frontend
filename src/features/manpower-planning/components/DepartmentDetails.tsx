import { SectionCard } from '../../../components/SectionCard'
import { STEP_THEMES } from '../stepTheme'
import { parseNumericInput } from '../../../utils/numberInput'

const MAX_HOURS_PER_DAY = 24

export interface DepartmentParameters {
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
}

interface DepartmentDetailsProps {
  parameters: DepartmentParameters
  onChange: (parameters: DepartmentParameters) => void
  disabled?: boolean
}

export function DepartmentDetails({ parameters, onChange, disabled }: DepartmentDetailsProps) {
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
            className="rounded-md border border-slate-300 px-3 py-2 transition-shadow focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100"
            value={parameters.numberOfBeds}
            disabled={disabled}
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 transition-shadow focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100"
              value={parameters.departmentOperatingHours}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...parameters, departmentOperatingHours: parseNumericInput(event) })
              }
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
          {parameters.departmentOperatingHours > MAX_HOURS_PER_DAY && (
            <span className="text-xs text-red-600">Operating hours cannot exceed {MAX_HOURS_PER_DAY} per day.</span>
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 transition-shadow focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100"
              value={parameters.employeeWorkingHours}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...parameters, employeeWorkingHours: parseNumericInput(event) })
              }
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
          {parameters.employeeWorkingHours > MAX_HOURS_PER_DAY && (
            <span className="text-xs text-red-600">Working hours cannot exceed {MAX_HOURS_PER_DAY} per day.</span>
          )}
        </label>
      </div>
    </SectionCard>
  )
}
