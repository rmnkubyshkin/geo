import './App.css';
import Desk from "./Desk";
import React from "react";

export const App = () => {
    return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Desk />
            </div>
    );
};

export default App;