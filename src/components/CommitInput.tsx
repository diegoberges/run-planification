import { TextInput, type TextInputProps } from 'flowbite-react'
import { useRef, useState } from 'react'

/** Text input bound to a store value that the user can edit freely: while focused it shows
 * the raw draft, and only on blur/Enter is the draft parsed and committed. When not focused
 * it always shows `format(value)`, so external changes (dragging on the profile, another
 * row's edit) are reflected immediately. Invalid drafts are discarded on commit. */
export function CommitInput<T>({
  value,
  format,
  parse,
  onCommit,
  ...inputProps
}: {
  value: T
  format: (value: T) => string
  /** Returns `undefined` when the text is invalid (the draft is then discarded). */
  parse: (text: string) => T | undefined
  onCommit: (value: T) => void
} & Omit<TextInputProps, 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown'>) {
  const [draft, setDraft] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  function commit() {
    if (cancelledRef.current || draft === null) {
      cancelledRef.current = false
      setDraft(null)
      return
    }
    const parsed = parse(draft)
    if (parsed !== undefined) onCommit(parsed)
    setDraft(null)
  }

  return (
    <TextInput
      {...inputProps}
      value={draft ?? format(value)}
      onFocus={() => setDraft(format(value))}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') {
          cancelledRef.current = true
          ;(e.target as HTMLInputElement).blur()
        }
      }}
    />
  )
}
