import React, { ChangeEvent, useState, useEffect } from "react";
import { Button } from "@material-ui/core";
// import { udata } from "./config";
import { Checkbox, Slider } from "./components";
import "./App.css";

export const App = () => {
  // const [cookies, setCookie] = useCookies();
  const [uData, setUData] = useState<string[]>([]);
  const [maxvalue] = React.useState(100);
  const [value, setValue] = React.useState(0);
  const [isChecked, setIsChecked] = useState(false);

  // Initialize Variables
  useEffect(() => {
    function logCookies(cookies: any) {
      for (let cookie of cookies) {
        console.log(`[UI-WebExtension]${cookie.name} = ${cookie.value}`);
        setValue(cookie.value);
      }
    }
    var gettingAll = browser.cookies.getAll({
      name: "user_privacy_preference_level",
    });
    gettingAll.then(logCookies);
  }, []);

  const startDataCollection = () => {
    browser.runtime.sendMessage({ message: "start", selectedTypes: uData });
  };

  const updateCookie = (_name: string, _value: string) => {
    var getActive = browser.tabs.query({ active: true, currentWindow: true });
    getActive.then(setCookie);
    // let value = parseInt(_value) / 100;

    function setCookie(tabs: any) {
      console.log("[UI-WebExtension]Set Cookie", _name, _value);
      browser.cookies.set({
        url: tabs[0].url,
        name: _name,
        value: _value,
      });
    }
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(e.target.value));
    updateCookie("user_privacy_preference_level", e.target.value);
  };

  // const handleUDataChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   const isChecked = e.target.checked;
  //   if (isChecked) {
  //     setUData([...uData, e.target.value]);
  //   } else {
  //     let _uData = uData.filter((item) => item !== e.target.value);
  //     setUData(_uData);
  //   }
  //   setIsChecked(!isChecked);
  //   updateCookie("udata", uData.join(","));
  // };

  return (
    <div className='app'>
      <h1>Data Collection</h1>
      <Button onClick={startDataCollection} variant='contained' color='primary'>
        Start Collecting Data
      </Button>
      <div className='slider'>
        <label>User Preference Level:</label>
        <Slider
          maxvalue={maxvalue}
          value={value}
          onChange={handleSliderChange}
        />
        {value}
      </div>
      {/* <div className='udata'>
        <label>Data to Share:</label>
        <React.Fragment>
          {udata.map((item) => (
            <label key={item.key}>
              <Checkbox
                name={item.name}
                value={item.value}
                checked={isChecked}
                onChange={handleUDataChange}
              />
              {item.label}
            </label>
          ))}
        </React.Fragment>
        <div>{uData.join()}</div>
      </div> */}
    </div>
  );
};
