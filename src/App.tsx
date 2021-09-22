import React, { useState } from "react";
import { Button } from '@material-ui/core';
import './App.css';

export const App = () => {
    const [data, setData] = useState('Test');

    React.useEffect(() => {    
        browser.runtime.onMessage.addListener((response: any) => {
            setData(response);
            console.log(response, data);
        });
    }, []);

    const startDataCollection = () => {
        browser.runtime.sendMessage({"message":"start"});
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
                            <Button onClick={startDataCollection} variant='contained' color='primary'>
                                Start Collecting Data
                            </Button>
                        </td>
                        <td>
                        {/* {data.map(d => (
                            <p>{d}</p>
                        ))} */}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
};