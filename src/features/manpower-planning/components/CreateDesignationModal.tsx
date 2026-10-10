import { useState } from 'react'
import { ModalShell } from '../../../components/ModalShell'

export interface NewDesignationDraft {
  code: string
  name: string
}

interface CreateDesignationModalProps {
  existingCodes: string[]
  onCancel: () => void
  onSave: (draft: NewDesignationDraft) => void
  isSaving?: boolean
  errorMessage?: string | null
}

const INPUT_CLASS =
  'rounded-md border border-slate-300 px-3 py-2 transition-shadow focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500'

export function CreateDesignationModal({
  existingCodes,
  onCancel,
  onSave,
  isSaving,
  errorMessage,
}: CreateDesignationModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  const normalizedCode = code.trim().toUpperCase()
  const isDuplicate = normalizedCode !== '' && existingCodes.includes(normalizedCode)
  const isValid = normalizedCode !== '' && name.trim() !== '' && !isDuplicate

  return (
    <ModalShell>
      <h3 className="mb-1 text-lg font-semibold text-slate-800">Add Designation</h3>
      <p className="mb-4 text-sm text-slate-500">
        Create a new designation master record so it becomes available in every designation dropdown.
      </p>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Designation Code</span>
          <input
            type="text"
            placeholder="e.g. DIETICIAN"
            className={INPUT_CLASS}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          {isDuplicate && <span className="text-xs text-red-600">This code already exists.</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Designation Name</span>
          <input
            type="text"
            placeholder="e.g. Dietician"
            className={INPUT_CLASS}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className="app-button rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="app-button rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50"
          disabled={!isValid || isSaving}
          onClick={() => onSave({ code: normalizedCode, name: name.trim() })}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </ModalShell>
  )
}
