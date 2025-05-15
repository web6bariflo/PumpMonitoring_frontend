// PumpMqtt.jsx
import React, { useState, useEffect, useRef } from "react";
import mqtt from "mqtt";
import axios from "axios";
import FuelCountPanel from "./FuelCountPannel"; // <-- Import it
const apiUrl = import.meta.env.VITE_API_URL;

const PumpMqtt = () => {
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [messages, setMessages] = useState([]);
  const clientRef = useRef(null);

  useEffect(() => {
    clientRef.current = mqtt.connect({
      hostname: "mqttbroker.bc-pl.com",
      port: 443,
      protocol: "wss",
      path: "/mqtt",
      username: "mqttuser",
      password: "Bfl@2025",
    });

    clientRef.current.on("connect", () => {
      setConnectionStatus("Connected");
      // clientRef.current.subscribe("pump/alerts");
      clientRef.current.subscribe("123/pump");
    });

    clientRef.current.on("message", async (topic, message) => {
      const rawMessage = message.toString().replace(/^"|"$/g, "");
      console.log("📩 Raw MQTT Message:", rawMessage);

      setMessages((prev) => [...prev, rawMessage]);

      // const numberMatch = rawMessage.match(/=\s*(\d+(\.\d+)?)/);

      // if (numberMatch) {
      //   const numberToSend = parseFloat(numberMatch[1]);

      //   try {
      //     await axios.post(`${apiUrl}/quantity_api/`, {
      //       quantity: numberToSend,
      //     });
      //     console.log("✅ Number posted to API:", numberToSend);
      //   } catch (error) {
      //     console.error("❌ API post error:", error);
      //   }
      // } else {
      //   console.log("ℹ️ No number found in message:", rawMessage);
      // }
    });

    clientRef.current.on("error", (err) => {
      console.error("Connection error:", err);
      setConnectionStatus(`Error: ${err.message}`);
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  const getStatusColor = () => {
    if (connectionStatus === "Connected") return "text-green-400";
    if (connectionStatus.startsWith("Error")) return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="p-6 text-gray bg-gray-100 min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Pump Automation</h1>
        <p className="text-xl">
          Status: <span className={getStatusColor()}>{connectionStatus}</span>
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-64">
          <FuelCountPanel />
        </div>

        
        {/* Left side - MQTT Messages */}
        <div className="flex-1 mb-6">
          <h2 className="text-lg font-semibold mb-2">All MQTT Messages:</h2>
          <div className="rounded p-4 shadow-lg h-[70vh] overflow-y-auto border border-gray-400">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className="bg-gray-200 p-3 rounded mb-2">
                  <p className="text-gray break-all">{msg}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No messages received yet</p>
            )}
          </div>
        </div>

        {/* Right side - Fuel Count (modular component) */}
      </div>
    </div>
  );
};

export default PumpMqtt;
