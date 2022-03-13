import React, { ChangeEventHandler } from "react";

const Checkbox = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) => <input type='checkbox' name={name} value={value} onChange={onChange} />;

export default Checkbox;
