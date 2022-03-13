import React, { ChangeEvent, useEffect, useState } from "react";
import { Button } from "@material-ui/core";
import { udata } from "./config";
import { Checkbox, Radio } from "./components";
import "./App.css";

export const App = () => {
  const [uData, setUData] = useState<string[]>([]);
  const [uMode, setMode] = useState<string>("");

  const startDataCollection = () => {
    browser.runtime.sendMessage({ message: "start", selectedTypes: uData });
  };

  const updateCookie = (_name: string, _value: string) => {
    var getActive = browser.tabs.query({ active: true, currentWindow: true });
    getActive.then(setCookie);

    function setCookie(tabs: any) {
      console.log("[Content Script - Socket]Set Cookie", _name, _value);
      console.log("[Content Script - Socket]tabs url", tabs[0].url);
      browser.cookies.set({
        url: tabs[0].url,
        name: _name,
        value: _value,
      });
    }
  };

  const handleUDataChange = (e: ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setUData([...uData, e.target.value]);
    } else {
      let _uData = uData.filter((item) => item !== e.target.value);
      setUData(_uData);
    }
    updateCookie("udata", uData.join(","));
  };

  const handleModeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMode(e.target.value);
    updateCookie("mode", e.target.value);
  };

  return (
    <div className='app'>
      <h1>Data Collection</h1>
      <Button onClick={startDataCollection} variant='contained' color='primary'>
        Start Collecting Data
      </Button>
      <div className='config'>
        <Radio onChange={handleModeChange} />
        <div>{uMode}</div>
      </div>
      <div className='udata'>
        <React.Fragment>
          {udata.map((item) => (
            <label key={item.key}>
              <Checkbox
                name={item.name}
                value={item.value}
                onChange={handleUDataChange}
              />
              {item.label}
            </label>
          ))}
        </React.Fragment>
        <div>{uData.join()}</div>
      </div>
    </div>
  );
};
