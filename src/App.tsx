import { ToxicityClassifier } from "@tensorflow-models/toxicity";
import React, { useState } from "react";
import './App.css';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import Loader from './utils/loader.js';

var toxicity = require('@tensorflow-models/toxicity');


export const App = () => {
    const [value, setValue] = React.useState('you suck');
    const [responseFromContent, setResponseFromContent] = useState(0.0);
    const [threshold, setThreshold] = useState(0.9);
    const [loading, setLoading] = useState(false);

    async function getToxicity(){
        setLoading(true)
        toxicity.load(threshold).then((model : ToxicityClassifier) => {
            const sentences = ['you suck'];

            model.classify(sentences).then(predictions => {
                Object.entries(predictions).forEach(([key, value]) => {
                    if (value.label == "insult"){
                        setLoading(false)
                        setResponseFromContent(value.results[0].probabilities[1]);
                    }                    
                  });                
            });
        });
    }
    const sendTestMessage = () => {
        getToxicity();
    };
    
    return (
        <div className="App">
            <h1>                
                Toxicity Predictor
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
