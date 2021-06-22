import React, { useState } from "react";
import { Button } from '@material-ui/core';
import './App.css';
// import { notifyClick } from './tools/globals';

export const App = () => {
    const [data, setData] = useState('Test');

    const startDataCollection = () => {
        //notifyClick("test");
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
                            {data}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
};