import { useEffect, useMemo, useRef, useState } from 'react'
import type { Lookup } from '../types/manpowerPlanning'

interface SearchableSelectProps {
  label?: string
  value: string
  options: Lookup[]
  placeholder?: string
  disabled?: boolean
  disabledOptionIds?: string[]
  onChange: (value: string) => void
}

/**
 * A dropdown that combines a type-to-filter search box with a scrollable option
 * list (max-height + overflow-y-auto), used everywhere a plain <select> would
 * otherwise force users to scroll through every designation/location/etc. by eye.
 */
export function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  disabledOptionIds,
  onChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((option) => option.id === value)

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.name.toLowerCase().includes(term))
  }, [options, query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectOption(optionId: string) {
    onChange(optionId)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-1 text-sm" ref={containerRef}>
      {label && <span className="font-medium text-slate-600">{label}</span>}
      <div className="relative">
        <button
          type="button"
          className="app-select flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-800 disabled:bg-slate-100"
          disabled={disabled}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={selected ? '' : 'text-slate-400'}>
            {selected?.name ?? placeholder ?? `Select ${label?.toLowerCase() ?? 'an option'}`}
          </span>
          <span className="text-xs text-slate-400">▾</span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            <input
              autoFocus
              type="search"
              placeholder="Search..."
              className="w-full border-b border-slate-200 px-3 py-2 text-sm focus:outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ul className="max-h-60 overflow-y-auto py-1 text-sm">
              {filteredOptions.length === 0 && <li className="px-3 py-2 text-slate-400">No matches</li>}
              {filteredOptions.map((option) => {
                const isDisabled = disabledOptionIds?.includes(option.id) ?? false
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent ${
                        option.id === value ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700'
                      }`}
                      onClick={() => selectOption(option.id)}
                    >
                      {option.name}
                      {isDisabled && <span className="ml-1 text-xs text-slate-400">(already added)</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
