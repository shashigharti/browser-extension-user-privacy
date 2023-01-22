import React, { ChangeEventHandler } from 'react'
const Slider = ({
  value,
  maxvalue,
  onChange,
}: {
  value: number
  maxvalue: number
  onChange: ChangeEventHandler<HTMLInputElement>
}) => {
  return (
    <React.Fragment>
      <input
        type="range"
        min="0"
        max={maxvalue}
        value={value}
        onChange={onChange}
        step="1"
      />
    </React.Fragment>
  )
}
export default Slider
