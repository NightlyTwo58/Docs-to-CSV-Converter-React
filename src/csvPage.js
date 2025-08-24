import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';

function CsvPage({ title, csvFile, goBack}) {
  const [csvData, setCsvData] = useState([]);

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
      }
    });
  }, [csvFile]);

  return (
    <div className="dataPageWrapper">
      <div id="mainHeader">
        <button onClick={goBack}>Back</button>
        <h1 style={{ position: 'center' }}>{title}</h1>
      </div>
      <div className="csvPage">
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
      </div>
    </div>
  );
}

export default CsvPage;
