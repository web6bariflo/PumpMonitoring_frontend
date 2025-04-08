import React, { useState, useEffect, useRef } from "react";
import mqtt from "mqtt";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const apiUrl = import.meta.env.VITE_API_URL;

const PumpMqtt = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [fetchedMessages, setFetchedMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [total160Count, setTotal160Count] = useState(0);
  const [totalLiters, setTotalLiters] = useState(0);
  const [monthly160Count, setMonthly160Count] = useState(0);
  const [monthlyLiters, setMonthlyLiters] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const clientRef = useRef(null);

  const getFormattedDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString("en-CA"),
      time: now.toTimeString().slice(0, 5),
      iso: now.toISOString(),
    };
  };

  const sendAlertToBackend = async (message) => {
    const { date, time } = getFormattedDateTime();
    const payload = { date, time, message };

    try {
      const response = await axios.post(`${apiUrl}message_api/`, payload);
      console.log("✅ Alert sent to backend:", response.data);
    } catch (error) {
      console.error("❌ Error sending alert to backend:", error);
    }
  };

  const calculateTotalLiters = (messagesList) => {
    const count = messagesList.filter(
      (msg) => msg.message === "Alert : Total 160 Ltr added"
    ).length;
    setTotal160Count(count);
    setTotalLiters(count * 160);
  };

  const calculateMonthlyTotal = (messagesList, monthDate) => {
    if (!monthDate) {
      setMonthly160Count(0);
      setMonthlyLiters(0);
      return;
    }

    const selectedMonth = monthDate.getMonth();
    const selectedYear = monthDate.getFullYear();

    const monthFiltered = messagesList.filter((msg) => {
      const [year, month] = msg.date.split("-").map(Number);
      return year === selectedYear && month - 1 === selectedMonth;
    });

    const count = monthFiltered.filter(
      (msg) => msg.message === "Alert : Total 160 Ltr added"
    ).length;

    setMonthly160Count(count);
    setMonthlyLiters(count * 160);
  };

  const fetchSavedMessages = async () => {
    try {
      const response = await axios.get(`${apiUrl}message_api/`);
      let extractedMessages = [];

      const recursiveExtract = (obj) => {
        if (Array.isArray(obj)) {
          obj.forEach(recursiveExtract);
        } else if (obj && typeof obj === "object") {
          if (obj.message && obj.date && obj.time) {
            extractedMessages.push(obj);
          } else {
            Object.values(obj).forEach(recursiveExtract);
          }
        }
      };

      recursiveExtract(response.data);
      setFetchedMessages(extractedMessages);
      filterMessagesByDate(selectedDate, extractedMessages);
      calculateMonthlyTotal(extractedMessages, selectedDate);
    } catch (error) {
      console.error("❌ Error fetching saved messages:", error);
    }
  };

  const filterMessagesByDate = (date, allMessages = fetchedMessages) => {
    if (!date) {
      setFilteredMessages(allMessages);
      calculateTotalLiters(allMessages);
      return;
    }

    const selected = date.toISOString().split("T")[0];
    const filtered = allMessages.filter((msg) => msg.date === selected);

    setFilteredMessages(filtered);
    calculateTotalLiters(filtered);
  };

  useEffect(() => {
    const datetimeInterval = setInterval(() => {
      const { date, time } = getFormattedDateTime();
      setCurrentDateTime(`${date} ${time}`);
    }, 1000);

    clientRef.current = mqtt.connect({
      hostname: "mqttbroker.bc-pl.com",
      port: 443,
      protocol: "wss",
      path: "/mqtt",
      username: "mqttuser",
      password: "Bfl@2025",
    });

    clientRef.current.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("Connected");
      clientRef.current.subscribe("123/pump");
    });

    clientRef.current.on("message", (topic, message) => {
      const rawMessage = message.toString().replace(/^"|"$/g, "");
      console.log("🔔 MQTT Message:", rawMessage);

      if (rawMessage === "Alert : Total 160 Ltr added") {
        sendAlertToBackend(rawMessage);
      }

      setMessages((prev) => [...prev, rawMessage]);
    });

    clientRef.current.on("error", (err) => {
      console.error("Connection error:", err);
      setConnectionStatus(`Error: ${err.message}`);
    });

    return () => {
      clearInterval(datetimeInterval);
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  useEffect(() => {
    filterMessagesByDate(selectedDate);
    calculateMonthlyTotal(fetchedMessages, selectedDate);
  }, [selectedDate]);

  const getStatusColor = () => {
    if (isConnected) return "text-green-400";
    if (connectionStatus.includes("Error")) return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="p-6 text-gray bg-gray-100 min-h-screen relative">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Pump Monitoring</h1>
        <div className="text-sm text-gray-900">{currentDateTime}</div>
      </div>

      <div className="mb-4">
        <p className=" text-xl">
          Status: <span className={getStatusColor()}>{connectionStatus}</span>
        </p>
      </div>

      {/* Side-by-side container */}
      <div className="flex flex-row gap-6">
        {/* Live Messages Section */}
        <div className="w-1/2 mb-6">
          <h2 className="text-lg font-semibold mb-2">Live Messages:</h2>
          <div className=" rounded p-4 shadow-lg h-screen overflow-y-auto space-y-2 border border-gray-400">
            {messages.map((msg, index) => (
              <div key={index} className="bg-gray-200 p-3 rounded">
                <p className="text-gray break-all">
                  <span className="text-sm text-gray-600">
                    {currentDateTime}
                  </span>
                  <br />
                  {msg}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar + Summary Section */}
        <div className="w-1/2 p-4 rounded shadow-lg mt-9 border border-gray-400">
          <h2 className="text-lg font-semibold mb-4">Choose A Date</h2>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            placeholderText="📅 Select Date"
            className="px-3 py-2 rounded text-sm text-black mb-4 w-96 border border-gray-400"
            dateFormat="yyyy-MM-dd"
          />
          <button
            onClick={fetchSavedMessages}
            className="bg-blue-400 hover:bg-blue-700 px-4 py-2 rounded font-medium w-96 text-white"
          >
            📥 Load Saved Messages
          </button>

          <div className="mt-6 text-2xl border border-gray-200 shadow p-4">
            <h2 className="font-semibold mb-1">📅 Daily Summary</h2>
            <p>"Alert : Total 160 Ltr added" occurred {total160Count} times.</p>
            <p>Daily total: {totalLiters} Ltr</p>
          </div>

          <div className="mt-6 text-2xl border border-gray-200 shadow p-4">
            <h2 className="font-semibold mb-1">
              📈 Summary (Month of{" "}
              {selectedDate?.toLocaleString("default", { month: "long" }) ||
                "-"}
              )
            </h2>
            <p>
              "Alert : Total 160 Ltr added" occurred {monthly160Count} times.
            </p>
            <p>Monthly total water filled: {monthlyLiters} Ltr</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpMqtt;
