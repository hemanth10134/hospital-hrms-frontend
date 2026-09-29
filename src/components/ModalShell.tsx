import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalShellProps {
  maxWidthClassName?: string
  children: ReactNode
}

/**
 * Renders into a portal on document.body. Modals must not be nested inside an
 * ancestor with a CSS `transform` (e.g. an entrance-animated section card) —
 * a transformed ancestor becomes the containing block for `position: fixed`
 * descendants, which traps the modal behind later sibling sections.
 */
export function ModalShell({ maxWidthClassName = 'max-w-md', children }: ModalShellProps) {
  return createPortal(
    <div className="animate-overlay-enter fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`animate-modal-enter w-full ${maxWidthClassName} rounded-lg bg-white p-6 shadow-xl`}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
