/*
  Frontend mock health database
  - Provides `healthRecords` array with realistic sample data
  - Exposes data as `window.healthRecords` for use in any page
  - Also supports CommonJS (module.exports) when available
*/
(function (root) {
  const healthRecords = [
    { date: "2025-06-01", temperature: 36.5, heartRate: 72, spo2: 98, bmi: 22.1 },
    { date: "2025-06-03", temperature: 36.7, heartRate: 75, spo2: 97, bmi: 22.3 },
    { date: "2025-06-05", temperature: 36.6, heartRate: 70, spo2: 99, bmi: 21.9 },
    { date: "2025-06-07", temperature: 37.0, heartRate: 82, spo2: 96, bmi: 23.0 },
    { date: "2025-06-09", temperature: 36.4, heartRate: 68, spo2: 98, bmi: 21.7 },
    { date: "2025-06-11", temperature: 36.9, heartRate: 78, spo2: 97, bmi: 22.6 },
    { date: "2025-06-13", temperature: 37.1, heartRate: 88, spo2: 95, bmi: 24.2 },
    { date: "2025-06-15", temperature: 36.2, heartRate: 65, spo2: 99, bmi: 21.5 },
    { date: "2025-06-17", temperature: 36.8, heartRate: 74, spo2: 98, bmi: 22.0 },
    { date: "2025-06-19", temperature: 37.2, heartRate: 90, spo2: 95, bmi: 25.1 },
    { date: "2025-06-21", temperature: 36.5, heartRate: 71, spo2: 98, bmi: 22.2 },
    { date: "2025-06-23", temperature: 36.7, heartRate: 76, spo2: 97, bmi: 23.4 }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = healthRecords;
  }

  try {
    if (typeof root !== 'undefined') root.healthRecords = healthRecords;
  } catch (e) {
    // ignore
  }

})(typeof window !== 'undefined' ? window : this);
