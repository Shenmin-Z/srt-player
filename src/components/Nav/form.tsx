import { FC, useState } from 'react'

interface NumberInputProps {
  isFloat?: boolean
  value: number
  onChange: (v: number) => void
}

export let NumberInput: FC<NumberInputProps> = ({ isFloat, value, onChange }) => {
  const [buf, setBuf] = useState('')
  const [editting, setEditting] = useState(false)

  return (
    <input
      type="text"
      value={editting ? buf : value}
      onFocus={() => {
        setBuf(value + '')
        setEditting(true)
      }}
      onChange={e => {
        setBuf(e.target.value)
      }}
      onBlur={() => {
        const v = isFloat ? parseFloat(buf) : parseInt(buf, 10)
        if (!isNaN(v)) {
          onChange(v)
        }
        setTimeout(() => {
          setEditting(false)
        }, 250)
      }}
    />
  )
}

interface TextInputProps {
  value: string
  onChange: (v: string) => void
}

export let TextInput: FC<TextInputProps> = ({ value, onChange }) => {
  const [buf, setBuf] = useState('')
  const [editting, setEditting] = useState(false)

  return (
    <input
      type="text"
      value={editting ? buf : value}
      onFocus={() => {
        setBuf(value + '')
        setEditting(true)
      }}
      onChange={e => {
        setBuf(e.target.value)
      }}
      onBlur={() => {
        onChange(buf)
        setEditting(false)
      }}
    />
  )
}
