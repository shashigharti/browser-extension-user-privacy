import React, { useState, useEffect } from "react";
import './App.css';
import {
    CookieInstrument,
    DnsInstrument,
    HttpInstrument,
    JavascriptInstrument,
    NavigationInstrument
} from "openwpm-webext-instrumentation";
import * as loggingDB from "./tools/loggingdb.js";

export const App = () => {
    const [value, setValue] = React.useState('test');
    const [responseFromContent, setResponseFromContent] = useState(0.0);
    const [threshold, setThreshold] = useState(0.9);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        init();
      }, []);
    const init = async () => {
        let config = {
            navigation_instrument:true,
            cookie_instrument:true,
            js_instrument:true,
            cleaned_js_instrument_settings:
            [
                {
                    object: `window.CanvasRenderingContext2D.prototype`,
                    instrumentedName: "CanvasRenderingContext2D",
                    logSettings: {
                    propertiesToInstrument: [],
                    nonExistingPropertiesToInstrument: [],
                    excludedProperties: [],
                    logCallStack: false,
                    logFunctionsAsStrings: false,
                    logFunctionGets: false,
                    preventSets: false,
                    recursive: false,
                    depth: 5,
                    }
                },
            ],
            http_instrument:true,
            callstack_instrument:true,
            save_content:false,
            testing:true,
            browser_id:0
        };
        console.log("WARNING: config not found. Assuming this is a test run of",
                      "the extension. Outputting all queries to console.", {config});
        if (config['js_instrument']) {
            loggingDB.logInfo("Javascript instrumentation enabled");
            //let jsInstrument = new JavascriptInstrument(loggingDB);
            // jsInstrument.run(config['browser_id']);
            // await jsInstrument.registerContentScript(config['testing'], config['cleaned_js_instrument_settings']);
        }
                    
    };
    
    return (
        <div className="App">
            <h1>                
                OpenWPM
            </h1>
            {/* <table>
                <tbody>
                    <tr>
                        <td>
                            <input value={value} onChange={e => setValue(e.target.value)} />                            
                        </td>
                        <td>
                            <button onClick={sendTestMessage}>SEND MESSAGE</button>
                        </td>
                    </tr>
                    <tr>
                        <td>Insult: </td>
                        <td>{ loading? <Loader />: responseFromContent}</td>
                    </tr>
                </tbody>               
            </table> */}
        </div>
    )
};
