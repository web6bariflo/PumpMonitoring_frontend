import { useState } from "react";
import "./App.css";
import PumpMqtt from "./pages/PumpMqtt";
import React from 'react'

function App() {
  return (
    <>
      <div>
        <PumpMqtt />
      </div>
    </>
  );
}

export default App;
