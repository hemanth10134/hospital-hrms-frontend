import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { AdditionalPositionRequests } from '../components/AdditionalPositionRequests'
import type { PositionRequestDraft } from '../../../types/manpowerPlanning'

describe('SearchableSelect add-new', () => {
  const options = [{ id: 'loc-1', code: 'DEL', name: 'Delhi' }]

  it('adds a new value from inside the dropdown', async () => {
    const onAddNew = vi.fn().mockResolvedValue(undefined)
    render(<SearchableSelect label="Location" value="" options={options} onChange={vi.fn()} addLabel="Add Location" onAddNew={onAddNew} />)

    fireEvent.click(screen.getByRole('button', { name: /select location/i }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add Location' }))
    fireEvent.change(screen.getByLabelText('Add Location'), { target: { value: '  Haryana  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(onAddNew).toHaveBeenCalledWith('Haryana'))
  })

  it('blocks duplicates before calling the server and shows server errors', async () => {
    const onAddNew = vi.fn().mockRejectedValue(new Error('A location named "UP" already exists for this organization'))
    render(<SearchableSelect label="Location" value="" options={options} onChange={vi.fn()} addLabel="Add Location" onAddNew={onAddNew} />)

    fireEvent.click(screen.getByRole('button', { name: /select location/i }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add Location' }))
    fireEvent.change(screen.getByLabelText('Add Location'), { target: { value: 'delhi' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('"delhi" already exists.')).toBeInTheDocument()
    expect(onAddNew).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Add Location'), { target: { value: 'UP' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(await screen.findByText(/already exists for this organization/)).toBeInTheDocument()
  })
})

describe('AdditionalPositionRequests drafts', () => {
  const designationOptions = [
    { id: 'des-nurse', code: 'NURSE', name: 'Nurse' },
    { id: 'des-sr', code: 'SR-NURSE', name: 'Sr Nurse' },
  ]
  const draft = (clientKey: string, designationId: string): PositionRequestDraft => ({
    clientKey,
    designationId,
    requestedPositions: 2,
    currentStaff: 1,
    reason: 'Uploaded',
    additionalMonthlyBudget: 1000,
    requestedBy: 'Vamsi',
  })

  it('shows uploaded drafts as input rows and submits all complete ones', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    const onDraftsChange = vi.fn()
    render(
      <AdditionalPositionRequests
        department={{ id: 'dept', code: 'NURSING', name: 'Nursing' }}
        designationOptions={designationOptions}
        requests={[]}
        drafts={[draft('a', 'des-nurse'), draft('b', 'des-sr')]}
        onDraftsChange={onDraftsChange}
        currentStaffByDesignation={{}}
        defaultRequestedBy="Sunita Sharma"
        onCreate={onCreate}
        onStatusChange={vi.fn()}
      />,
    )

    expect(screen.getByText('New Position Request 1')).toBeInTheDocument()
    expect(screen.getByText('New Position Request 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Submit all complete (2)' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(2))
    expect(onDraftsChange).toHaveBeenLastCalledWith([expect.objectContaining({ designationId: '', requestedBy: 'Sunita Sharma' })])
  })
})
