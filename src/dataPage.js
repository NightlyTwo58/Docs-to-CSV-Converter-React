import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

function DataPage({ title, csvFile, descriptions, goBack}) {
  const [csvData, setCsvData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const pieCanvasRef = useRef(null);
  const lineCanvasRef = useRef(null);

  const customColors = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'
  ];

  useEffect(() => {
    Papa.parse(csvFile, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data
          .filter(row => row.Date)
          .map(row => {
            const date = new Date(row.Date);
            return { date, ...row };
          })
          .sort((a, b) => a.date - b.date);

        setCsvData(rows);

        if (rows.length > 0) {
          const firstDate = rows[0].date;
          const lastDate = rows[rows.length - 1].date;
          setMinDate(firstDate);
          setMaxDate(lastDate);
          setStartDate(firstDate);
          setEndDate(lastDate);
        }
      }
    });
  }, [csvFile]);

  useEffect(() => {
      if (!csvData.length || !startDate || !endDate) return;

      const filteredData = csvData.filter(row => row.date >= startDate && row.date <= endDate);
      if (filteredData.length === 0) return;

      if (pieCanvasRef.current) {
        if (pieChartRef.current) {
          pieChartRef.current.destroy();
        }

        const lastRow = filteredData[filteredData.length - 1];
        const labels = Object.keys(lastRow).filter(k => k !== 'Date' && k !== 'date');
        const values = labels.map(k => lastRow[k]);

        const backgroundColors = labels.map((label, index) => customColors[index % customColors.length]);

        const newPieChart = new Chart(pieCanvasRef.current, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: backgroundColors
            }]
          },
        });
        pieChartRef.current = newPieChart;
      }

      if (lineCanvasRef.current) {
        if (lineChartRef.current) {
          lineChartRef.current.destroy();
        }

        const dataKeys = Object.keys(csvData[0]).filter(k => k !== 'Date' && k !== 'date');

        const datasets = dataKeys.map((key, index) => ({
          label: key,
          data: filteredData.map(row => ({
              x: row.date,
              y: row[key]
          })),
          borderColor: customColors[index % customColors.length],
          fill: false,
        }));

        const newLineChart = new Chart(lineCanvasRef.current, {
          type: 'line',
          data: { datasets: datasets },
          options: {
              responsive: true,
              scales: {
                  x: {
                      type: 'time',
                      time: {
                          unit: 'day'
                      }
                  }
              }
          }
        });
        lineChartRef.current = newLineChart;
      }
  }, [csvData, startDate, endDate]);

  const handleStartDateChange = (e) => {
    const newDate = new Date(parseInt(e.target.value));
    if (newDate <= endDate) {
      setStartDate(newDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newDate = new Date(parseInt(e.target.value));
    if (newDate >= startDate) {
      setEndDate(newDate);
    }
  };

  return (
    <div className="dataPageWrapper">
      <div id="mainHeader">
        <button onClick={goBack}>Back</button>
        <h1 style={{ position: 'center' }}>{title}</h1>
      </div>
      <div className="dataPage">
        {csvData.length > 0 && (
          <>
            <div className="pieSection">
              <h2>Pie Chart</h2>
              <canvas ref={pieCanvasRef}></canvas>
            </div>

            <div className="sliderSection">
              <label htmlFor="startDateSlider">Select Date Range:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{startDate ? startDate.toLocaleDateString() : ''}</span>
                <input
                  type="range"
                  id="startDateSlider"
                  min={minDate ? minDate.getTime() : 0}
                  max={maxDate ? maxDate.getTime() : 0}
                  value={startDate ? startDate.getTime() : 0}
                  step={86400000}
                  onChange={handleStartDateChange}
                />
                <input
                  type="range"
                  id="endDateSlider"
                  min={minDate ? minDate.getTime() : 0}
                  max={maxDate ? maxDate.getTime() : 0}
                  value={endDate ? endDate.getTime() : 0}
                  step={86400000}
                  onChange={handleEndDateChange}
                />
                <span>{endDate ? endDate.toLocaleDateString() : ''}</span>
              </div>
            </div>

            <div className="lineSection">
              <h2>Line Graph</h2>
              <canvas ref={lineCanvasRef}></canvas>
              <div className="explanations">
                {descriptions && descriptions.map((desc, idx) => <p key={idx}>{desc}</p>)}
              </div>
            </div>

            <div className="csvSection">
              <h2>CSV Output</h2>
              <table>
                <thead>
                  <tr>
                    {csvData[0] && Object.keys(csvData[0]).map(key => <th key={key}>{key}</th>)}
                  </tr>
                </thead>
                <tbody>
                    {csvData.map((row, idx) => (
                        <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                                <td key={i}>
                                  {
                                    val instanceof Date
                                      ? val.toDateString()
                                      : (val != null ? val.toString() : '')
                                  }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DataPage;
