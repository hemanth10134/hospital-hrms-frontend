import { useRef, type ReactNode } from 'react'
import type { Lookup, PlanningPeriod } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { SelectField } from '../../../components/SelectField'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { STEP_THEMES } from '../stepTheme'

export interface HospitalPlanningSelection {
  organizationId: string
  locationId: string
  hospitalId: string
  departmentId: string
  planningPeriodId: string
}

interface HospitalPlanningDetailsProps {
  selection: HospitalPlanningSelection
  organizations: Lookup[]
  locations: Lookup[]
  hospitals: Lookup[]
  departments: Lookup[]
  planningPeriods: PlanningPeriod[]
  onChange: (selection: HospitalPlanningSelection) => void
  onAddLocation: (name: string) => Promise<void>
  onAddHospital: (name: string) => Promise<void>
  onAddDepartment: (name: string) => Promise<void>
  onDownloadFormat: () => void
  onUploadFile: (file: File) => void
  isExcelBusy?: boolean
  uploadPanel?: ReactNode
  disabled?: boolean
}

const TOOLBAR_BUTTON_CLASS =
  'app-button rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50'

export function HospitalPlanningDetails({
  selection,
  organizations,
  locations,
  hospitals,
  departments,
  planningPeriods,
  onChange,
  onAddLocation,
  onAddHospital,
  onAddDepartment,
  onDownloadFormat,
  onUploadFile,
  isExcelBusy,
  uploadPanel,
  disabled,
}: HospitalPlanningDetailsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <SectionCard
      stepNumber={STEP_THEMES.basicDetails.stepNumber}
      color={STEP_THEMES.basicDetails.color}
      tintColor={STEP_THEMES.basicDetails.tintColor}
      title="Hospital &amp; Planning Details"
      description="Fill in manually, or download the Excel format, fill it and upload it to autofill every step."
      infoBullets={STEP_THEMES.basicDetails.bullets}
      actions={
        <>
          <button type="button" className={TOOLBAR_BUTTON_CLASS} disabled={isExcelBusy} onClick={onDownloadFormat}>
            ⬇ Download Format
          </button>
          <button
            type="button"
            className={TOOLBAR_BUTTON_CLASS}
            disabled={disabled || isExcelBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {isExcelBusy ? 'Working…' : '⬆ Upload Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            data-testid="plan-upload-input"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onUploadFile(file)
              event.target.value = ''
            }}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <SelectField
          label="Organization"
          value={selection.organizationId}
          options={organizations}
          disabled={disabled}
          onChange={(organizationId) =>
            onChange({ organizationId, locationId: '', hospitalId: '', departmentId: '', planningPeriodId: selection.planningPeriodId })
          }
        />
        <SelectField
          label="Location"
          value={selection.locationId}
          options={locations}
          disabled={disabled || !selection.organizationId}
          addLabel="Add Location"
          onAddNew={onAddLocation}
          onChange={(locationId) => onChange({ ...selection, locationId, hospitalId: '', departmentId: '' })}
        />
        <SelectField
          label="Hospital"
          value={selection.hospitalId}
          options={hospitals}
          disabled={disabled || !selection.locationId}
          addLabel="Add Hospital"
          onAddNew={onAddHospital}
          onChange={(hospitalId) => onChange({ ...selection, hospitalId, departmentId: '' })}
        />
        <SelectField
          label="Department"
          value={selection.departmentId}
          options={departments}
          disabled={disabled || !selection.hospitalId}
          addLabel="Add Department"
          onAddNew={onAddDepartment}
          onChange={(departmentId) => onChange({ ...selection, departmentId })}
        />
        <SearchableSelect
          label="Planning Period"
          value={selection.planningPeriodId}
          options={planningPeriods.map((period) => ({ id: period.id, code: period.code, name: period.label }))}
          disabled={disabled}
          onChange={(planningPeriodId) => onChange({ ...selection, planningPeriodId })}
        />
      </div>
      {uploadPanel}
    </SectionCard>
  )
}
