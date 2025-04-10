import React, { useState } from "react";
import axios from "axios";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
const apiUrl = import.meta.env.VITE_API_URL;

const FuelCountPanel = () => {
  const [fuelCount, setFuelCount] = useState(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [fuelEntries, setFuelEntries] = useState([]);

;

  const handleGetMessages = async () => {
    try {
        const start = format(dateRange[0].startDate, "yyyy-MM-dd");
        const end = format(dateRange[0].endDate, "yyyy-MM-dd");
  
        const response = await axios.get(`${apiUrl}/filter_quantities/`, {
          params: {
            from_date: start,
            to_date: end,
          },
        });

        console.log("📥 GET success:", response.data);

      const entries = response.data || [];
      setFuelEntries(entries); // store the full backend response
      console.log(fuelEntries.length)

    

      const total = entries.reduce((sum, item) => {
        const qty = parseFloat(item.quantity);
        return !isNaN(qty) ? sum + qty : sum;
      }, 0);

      setFuelCount(total);
      console.log("📥 Total Quantity:", total);
    } catch (error) {
      console.error("❌ GET error:", error);
      setFuelCount("Error fetching data");

    }
  };

  {/* Raw Response Data */}
{fuelEntries.length > 0 && (
    <div className="mt-4">
      <h3 className="font-medium mb-2">Raw Response Data:</h3>
      <div className="border border-gray-400 p-3 rounded max-h-60 overflow-y-auto">
        {fuelEntries.map((entry, index) => (
          <div key={index} className="border-b border-gray-300 p-2 last:border-b-0">
            <p><strong>Date:</strong> {entry.date}</p>
            <p><strong>Quantity:</strong> {entry.quantity}</p>
            <p><strong>Time:</strong> {entry.time}</p>
          </div>
        ))}
      </div>
    </div>
  )}

  return (
    <div className="bg-white p-4 rounded shadow-lg border border-gray-300">
      <h2 className="text-lg font-semibold mb-4">Fuel Count</h2>

      {/* Start Date Input */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium mb-1">Start Date</label>
        <input
          type="text"
          readOnly
          value={format(dateRange[0].startDate, "dd/MM/yyyy")}
          onClick={() => {
            setShowStartCalendar(!showStartCalendar);
            setShowEndCalendar(false);
          }}
          className="w-full border px-3 py-2 rounded cursor-pointer text-sm bg-white shadow-sm"
        />
        {showStartCalendar && (
          <div className="absolute z-10 w-full">
            <DateRange
              editableDateInputs={true}
              onChange={(item) => {
                setDateRange([
                  {
                    ...dateRange[0],
                    startDate: item.selection.startDate,
                    endDate: dateRange[0].endDate,
                    key: "selection",
                  },
                ]);
                setShowStartCalendar(false);
              }}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              rangeColors={["#3b82f6"]}
              showDateDisplay={false}
            />
          </div>
        )}
      </div>

      {/* End Date Input */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium mb-1">End Date</label>
        <input
          type="text"
          readOnly
          value={format(dateRange[0].endDate, "dd/MM/yyyy")}
          onClick={() => {
            setShowEndCalendar(!showEndCalendar);
            setShowStartCalendar(false);
          }}
          className="w-full border px-3 py-2 rounded cursor-pointer text-sm bg-white shadow-sm"
        />
        {showEndCalendar && (
          <div className="absolute z-10 w-full">
            <DateRange
              editableDateInputs={true}
              onChange={(item) => {
                setDateRange([
                  {
                    ...dateRange[0],
                    startDate: dateRange[0].startDate,
                    endDate: item.selection.endDate,
                    key: "selection",
                  },
                ]);
                setShowEndCalendar(false);
              }}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              rangeColors={["#3b82f6"]}
              showDateDisplay={false}
            />
          </div>
        )}
      </div>

      {/* Button */}
      <button
        onClick={handleGetMessages}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-4 transition"
      >
        Get Message Count
      </button>

      {/* Result */}
      {fuelCount !== null && (
        <div className="bg-gray-100 p-3 rounded">
          <p className="font-medium">Total Quantity:</p>
          <p className="text-lg font-bold">
            {typeof fuelCount === "number"
              ? `${fuelCount} Liters filled`
              : fuelCount}
          </p>
        </div>
      )}

      {fuelEntries.length > 0 && (
      <div className="mt-4">
        <h3 className="font-medium mb-2">Raw Response Data:</h3>
        <div className="border border-gray-400 p-3 rounded max-h-60 overflow-y-auto">
          {fuelEntries.map((entry, index) => (
            <div key={index} className="border-b border-gray-300 p-2 last:border-b-0">
              <p><strong>Date:</strong> {entry.date}</p>
              <p><strong>Quantity:</strong> {entry.quantity}</p>
              <p><strong>Time:</strong> {entry.time}</p>
            </div>
          ))}
        </div>
      </div>
    )}
    </div>
  );
};

export default FuelCountPanel;
