import React, { useState } from "react";
import { Button } from '@material-ui/core';
import Table from '@material-ui/core/Table'; 
import TableBody from '@material-ui/core/TableBody'; 
import TableCell from '@material-ui/core/TableCell';  
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';  
import Paper from '@material-ui/core/Paper';  
import './App.css';

export type Item = {
    type: string;
    data: string;
};

export const App = () => {
    const [items, setItems] = useState<Item[]>([])

    React.useEffect(() => {    
        browser.runtime.onMessage.addListener((response: any) => {
            // Object.keys(response.data).forEach(e => console.log(`key=${e}  value=${response.data[e]}`));
            let all_keys: string[] = [];
            for (const [key, value] of Object.entries(response.data)){
                all_keys.push(key);
            }
            console.log(response.type, all_keys.join());
            setFieldValue(response.type, all_keys.join());   
        });
    }, []);

    const setFieldValue = (mtype:string, mdata:string) => {
        setItems([...items, {type:mtype, data:mdata}]);
    };

    const startDataCollection = () => {
        browser.runtime.sendMessage({"message":"start"});
    };

    return (
        <div className="App">
            <h1>
                Data Collection
            </h1>
            <Button onClick={startDataCollection} variant='contained' color='primary'>
                   Start Collecting Data
            </Button>
            <TableContainer className="tbl__display--data" component={Paper}>
                <Table aria-label="simple table">
                    <TableBody>
                        {items.map((row) => (
                            <TableRow key={row.type} >
                                <TableCell component="th" scope="row">
                                    <b>{row.type}</b>
                                </TableCell>
                                <TableCell align="right">{row.data}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
};