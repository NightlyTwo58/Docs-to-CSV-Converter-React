import React, { useEffect, useState, useRef, useMemo } from "react";
import Papa from "papaparse";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

function DataPage({ title, csvFile, descriptions, goBack, goCSV }) {
  const [csvData, setCsvData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null, min: null, max: null });

  const pieCanvasRef = useRef(null);
  const lineCanvasRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const customColors = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe"
  ];

  useEffect(() => {
    Papa.parse(csvFile, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: ({ data }) => {
        const rows = data
          .filter(row => row.Date)
          .map(row => ({ ...row, date: new Date(row.Date) }))
          .sort((a, b) => a.date - b.date);

        if (rows.length) {
          setCsvData(rows);
          setDateRange({
            min: rows[0].date,
            max: rows[rows.length - 1].date,
            start: rows[0].date,
            end: rows[rows.length - 1].date
          });
        }
      }
    });
  }, [csvFile]);

  const partyKeys = useMemo(() => {
    if (!csvData.length) return [];
    return Object.keys(csvData[0]).filter(k => !["Date", "date", "Coalitions"].includes(k));
  }, [csvData]);

  const filteredData = useMemo(() => {
    if (!csvData.length || !dateRange.start || !dateRange.end) return [];
    return csvData.filter(r => r.date >= dateRange.start && r.date <= dateRange.end);
  }, [csvData, dateRange]);

  const lastRow = filteredData.at(-1);

  const pieData = useMemo(() => {
    if (!lastRow) return null;
    const values = partyKeys.map(k => lastRow[k]);
    const coalitionParties = (lastRow.Coalitions || "").split("-").map(p => p.trim()).filter(Boolean);

    return {
      labels: partyKeys,
      datasets: [{
        data: values,
        backgroundColor: partyKeys.map((_, i) => customColors[i % customColors.length]),
        borderColor: partyKeys.map(k => coalitionParties.includes(k) ? "black" : "transparent"),
        borderWidth: partyKeys.map(k => coalitionParties.includes(k) ? 3 : 1)
      }]
    };
  }, [lastRow, partyKeys]);

  const lineData = useMemo(() => {
    if (!filteredData.length) return null;
    return {
      datasets: partyKeys.map((k, i) => ({
        label: k,
        data: filteredData.map(r => ({ x: r.date, y: r[k] })),
        borderColor: customColors[i % customColors.length],
        fill: false
      }))
    };
  }, [filteredData, partyKeys]);

  useEffect(() => {
    if (!pieData || !pieCanvasRef.current) return;
    pieChartRef.current?.destroy();
    pieChartRef.current = new Chart(pieCanvasRef.current, { type: "pie", data: pieData });
  }, [pieData]);

  useEffect(() => {
    if (!lineData || !lineCanvasRef.current) return;
    lineChartRef.current?.destroy();
    lineChartRef.current = new Chart(lineCanvasRef.current, {
      type: "line",
      data: lineData,
      options: {
        responsive: true,
        scales: { x: { type: "time", time: { unit: "day" } } }
      }
    });
  }, [lineData]);

  const handleStartChange = e => {
    const newDate = new Date(+e.target.value);
    if (newDate <= dateRange.end) setDateRange(r => ({ ...r, start: newDate }));
  };

  const handleEndChange = e => {
    const newDate = new Date(+e.target.value);
    if (newDate >= dateRange.start) setDateRange(r => ({ ...r, end: newDate }));
  };

  return (
    <div className="dataPageWrapper">
      <div id="mainHeader">
        <button onClick={goBack}>Back</button>
        <h1>{title}</h1>
      </div>

      {csvData.length > 0 && (
        <div className="dataPage">
          <div className="pieSection">
            <h2>Pie Chart</h2>
            {lastRow?.Coalitions && (
              <div style={{ margin: "10px 0", padding: "8px", background: "#eef6ff", border: "1px solid #cce0ff", borderRadius: "6px", textAlign: "center", fontWeight: "500" }}>
                Coalition: {lastRow.Coalitions}
              </div>
            )}
            <canvas ref={pieCanvasRef} />
          </div>

          <div className="sliderSection">
            <label>Select Date Range:</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>{dateRange.start?.toLocaleDateString() || ""}</span>
              <input
                type="range"
                min={dateRange.min?.getTime() || 0}
                max={dateRange.max?.getTime() || 0}
                value={dateRange.start?.getTime() || 0}
                step={86400000}
                onChange={handleStartChange}
              />
              <input
                type="range"
                min={dateRange.min?.getTime() || 0}
                max={dateRange.max?.getTime() || 0}
                value={dateRange.end?.getTime() || 0}
                step={86400000}
                onChange={handleEndChange}
              />
              <span>{dateRange.end?.toLocaleDateString() || ""}</span>
            </div>
          </div>

          <div className="lineSection">
            <h2>Line Graph</h2>
            <canvas ref={lineCanvasRef} />
            <div className="explanations">
              {descriptions?.map((desc, idx) => <p key={idx}>{desc}</p>)}
            </div>
          </div>

          <button onClick={goCSV}>Raw CSV Data</button>
        </div>
      )}
    </div>
  );
}

export default DataPage;