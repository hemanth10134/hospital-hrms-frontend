import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AddDesignationModal } from '../components/AddDesignationModal'
import type { Lookup } from '../../../types/manpowerPlanning'

const designationOptions: Lookup[] = [
  { id: 'des-1', code: 'CONS-INTENSIVIST', name: 'Consultant Intensivist' },
  { id: 'des-2', code: 'ICU-MED-OFFICER', name: 'ICU Medical Officer' },
]

describe('AddDesignationModal', () => {
  it('marks an already-added designation as disabled in the dropdown so it cannot be re-selected', () => {
    render(
      <AddDesignationModal
        designationOptions={designationOptions}
        existingDesignationIds={['des-1']}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select designation/i }))

    const duplicateOption = screen.getByRole('button', { name: /Consultant Intensivist/i })
    expect(duplicateOption).toBeDisabled()
    expect(screen.getByText(/already added/i)).toBeInTheDocument()

    fireEvent.click(duplicateOption)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('allows saving a designation that has not been added yet', () => {
    const onSave = vi.fn()
    render(
      <AddDesignationModal
        designationOptions={designationOptions}
        existingDesignationIds={['des-1']}
        onCancel={vi.fn()}
        onSave={onSave}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select designation/i }))
    fireEvent.click(screen.getByText('ICU Medical Officer'))

    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ designationId: 'des-2' }))
  })
})
