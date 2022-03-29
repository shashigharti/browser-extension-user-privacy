import React, { ChangeEventHandler } from "react";

const Checkbox = ({
  name,
  value,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) => (
  <input
    type='checkbox'
    name={name}
    value={value}
    onChange={onChange}
    checked={checked}
  />
);

export default Checkbox;
