import type { Lookup } from '../types/manpowerPlanning'
import { SearchableSelect } from './SearchableSelect'

interface SelectFieldProps {
  label: string
  value: string
  options: Lookup[]
  onChange: (value: string) => void
  disabled?: boolean
  addLabel?: string
  onAddNew?: (name: string) => Promise<void>
}

export function SelectField({ label, value, options, onChange, disabled, addLabel, onAddNew }: SelectFieldProps) {
  return (
    <SearchableSelect
      label={label}
      value={value}
      options={options}
      disabled={disabled}
      onChange={onChange}
      addLabel={addLabel}
      onAddNew={onAddNew}
    />
  )
}
