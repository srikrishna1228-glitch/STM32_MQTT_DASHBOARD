//===========================================
// Export Module
//===========================================

// Download helper
function downloadFile(filename, content, type) {

    const blob = new Blob([content], { type: type });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}

//===========================================
// Export JSON
//===========================================

function exportJSON() {

    if (logData.length === 0) {

        alert("No data available.");

        return;

    }

    const json = JSON.stringify(logData, null, 4);

    downloadFile(
        "stm32_logs.json",
        json,
        "application/json"
    );

}

//===========================================
// Export CSV
//===========================================

function exportCSV() {

    if (logData.length === 0) {

        alert("No data available.");

        return;

    }

    let csv = "No,Time,ADC,Temperature\n";

    logData.forEach((item, index) => {

        csv +=
            (index + 1) + "," +
            item.time + "," +
            item.adc + "," +
            item.temp + "\n";

    });

    downloadFile(
        "stm32_logs.csv",
        csv,
        "text/csv"
    );

}

//===========================================
// Clear Logs
//===========================================

function clearLogs() {

    logData = [];

    messageCounter = 0;

    document.getElementById("logs").value = "";

    document.getElementById("tableBody").innerHTML = "";

    document.getElementById("msgCount").innerHTML = "0";

    document.getElementById("adcValue").innerHTML = "0";

    document.getElementById("tempValue").innerHTML = "0 °C";

    // Clear charts

    labels = [];

    tempData = [];

    adcData = [];

    if (tempChart) {

        tempChart.data.labels = [];

        tempChart.data.datasets[0].data = [];

        tempChart.update();

    }

    if (adcChart) {

        adcChart.data.labels = [];

        adcChart.data.datasets[0].data = [];

        adcChart.update();

    }

    mqttLog("Dashboard Cleared");

}