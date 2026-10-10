import type { Lookup } from '../types/manpowerPlanning'
import { SearchableSelect } from './SearchableSelect'

interface SelectFieldProps {
  label: string
  value: string
  options: Lookup[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function SelectField({ label, value, options, onChange, disabled }: SelectFieldProps) {
  return <SearchableSelect label={label} value={value} options={options} disabled={disabled} onChange={onChange} />
}
