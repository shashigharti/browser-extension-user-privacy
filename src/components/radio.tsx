import React, { ChangeEventHandler } from 'react'
import { modes } from '../config'
const Radio = ({ onChange }: { onChange: ChangeEventHandler<HTMLInputElement> }) => {
  return (
    <React.Fragment>
      <label>Select Mode:</label>
      {modes.map((item) => (
        <React.Fragment key={item.name}>
          <input type="radio" name={item.name} value={item.value} onChange={onChange} />
          {item.label}
        </React.Fragment>
      ))}
    </React.Fragment>
  )
}
export default Radio
