import { FC, useState, useEffect } from 'react'

interface InputProps {
  isFloat?: boolean
  value: number
  onChange: (v: number) => void
}

export let NumberInput: FC<InputProps> = ({ isFloat, value: _value, onChange }) => {
  const [value, setValue] = useState(_value + '')
  useEffect(() => {
  if(isFloat){
    setValue(_value.toFixed(3))
  }else{
    setValue(_value + '')
  }
  }, [_value])

  return (
    <input
      value={value}
      onChange={e => {
        setValue(e.target.value)
      }}
      onBlur={() => {
        const width = isFloat ? parseFloat(value) : parseInt(value, 10)
        if (!isNaN(width)) {
          onChange(width)
        }
      }}
    />
  )
}
