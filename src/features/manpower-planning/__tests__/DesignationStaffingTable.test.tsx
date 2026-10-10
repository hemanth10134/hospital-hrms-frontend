import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DesignationStaffingTable } from '../components/DesignationStaffingTable'
import type { DesignationLine, Lookup } from '../../../types/manpowerPlanning'

const designationOptions: Lookup[] = [
  { id: 'des-1', code: 'CONS-INTENSIVIST', name: 'Consultant Intensivist' },
  { id: 'des-2', code: 'ICU-MED-OFFICER', name: 'ICU Medical Officer' },
]

const lines: DesignationLine[] = [
  {
    designationId: 'des-1',
    designationName: 'Consultant Intensivist',
    staffingRatio: 10,
    monthlySalary: 150000,
    leaveBufferPct: 10,
    currentStaff: 2,
  },
]

function renderTable(overrides: Partial<Parameters<typeof DesignationStaffingTable>[0]> = {}) {
  const onChange = vi.fn()
  render(
    <DesignationStaffingTable
      lines={lines}
      designationOptions={designationOptions}
      numberOfBeds={20}
      departmentOperatingHours={24}
      employeeWorkingHours={8}
      onChange={onChange}
      {...overrides}
    />,
  )
  return onChange
}

describe('DesignationStaffingTable', () => {
  it('renders computed required staff and vacancies for each row', () => {
    renderTable()

    expect(screen.getByText('Consultant Intensivist')).toBeInTheDocument()
    // requiredStaff = ceil((20/10) * (24/8) * 1.10) = 7
    expect(screen.getByText('7')).toBeInTheDocument()
    // vacancies = 7 - 2 = 5
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows an empty state when there are no designation lines', () => {
    renderTable({ lines: [] })

    expect(screen.getByText(/no designations added yet/i)).toBeInTheDocument()
  })

  it('edits a row in place through its input box', () => {
    const onChange = renderTable()

    fireEvent.change(screen.getByLabelText('Current staff for Consultant Intensivist'), { target: { value: '4' } })

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ designationId: 'des-1', currentStaff: 4 })])
  })

  it('locks every row input when disabled and hides the add row', () => {
    renderTable({ disabled: true })

    expect(screen.getByLabelText('Current staff for Consultant Intensivist')).toBeDisabled()
    expect(screen.queryByRole('button', { name: '+ Add' })).not.toBeInTheDocument()
  })

  it('adds a new designation from the inline add row and blocks already-added ones', () => {
    const onChange = renderTable()

    fireEvent.click(screen.getByRole('button', { name: /select designation/i }))
    expect(screen.getByRole('button', { name: /Consultant Intensivist/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'ICU Medical Officer' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add' }))

    expect(onChange).toHaveBeenCalledWith([
      lines[0],
      expect.objectContaining({ designationId: 'des-2', designationName: 'ICU Medical Officer', planned: true }),
    ])
  })
})
