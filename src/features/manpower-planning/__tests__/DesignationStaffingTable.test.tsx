import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DesignationStaffingTable } from '../components/DesignationStaffingTable'
import type { DesignationLine, Lookup } from '../../../types/manpowerPlanning'

const designationOptions: Lookup[] = [{ id: 'des-1', code: 'CONS-INTENSIVIST', name: 'Consultant Intensivist' }]

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

describe('DesignationStaffingTable', () => {
  it('renders computed required staff and vacancies for each row', () => {
    render(
      <DesignationStaffingTable
        lines={lines}
        designationOptions={designationOptions}
        numberOfBeds={20}
        departmentOperatingHours={24}
        employeeWorkingHours={8}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Consultant Intensivist')).toBeInTheDocument()
    // requiredStaff = ceil((20/10) * (24/8) * 1.10) = 7
    expect(screen.getByText('7')).toBeInTheDocument()
    // vacancies = 7 - 2 = 5
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows an empty state when there are no designation lines', () => {
    render(
      <DesignationStaffingTable
        lines={[]}
        designationOptions={designationOptions}
        numberOfBeds={20}
        departmentOperatingHours={24}
        employeeWorkingHours={8}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/no designations added yet/i)).toBeInTheDocument()
  })
})
