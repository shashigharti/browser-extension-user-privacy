import React, { useState } from "react";
import './App.css';
import Loader from './utils/loader';
import {
    CookieInstrument,
    DnsInstrument,
    HttpInstrument,
    JavascriptInstrument,
    NavigationInstrument
} from "openwpm-webext-instrumentation";
import * as dataReceiver from "./utils/dataReceiver";

export const App = () => {
    const [value, setValue] = React.useState('you suck');
    const [responseFromContent, setResponseFromContent] = useState(0.0);
    const [threshold, setThreshold] = useState(0.9);
    const [loading, setLoading] = useState(false);

    // async function getToxicity(){
    //     setLoading(true)
    //     toxicity.load(threshold).then((model : ToxicityClassifier) => {
    //         const sentences = ['you suck'];

    //         model.classify(sentences).then(predictions => {
    //             Object.entries(predictions).forEach(([key, value]) => {
    //                 if (value.label == "insult"){
    //                     setLoading(false)
    //                     setResponseFromContent(value.results[0].probabilities[1]);
    //                 }                    
    //               });                
    //         });
    //     });
    // }
    const sendTestMessage = () => {
        // getToxicity();
        // const config = getOpenwpmConfig();
        // console.log("config" + config)
        // dataReceiver.activeTabDwellTimeMonitor.run();

    };
    
    return (
        <div className="App">
            <h1>                
                OpenWPM
            </h1>
            <table>
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
            </table>
        </div>
    )
};
