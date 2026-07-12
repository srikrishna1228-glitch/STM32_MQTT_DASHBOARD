/*==================================================
 STM32 MQTT Dashboard
 app.js
==================================================*/

let client = null;
let connected = false;

let messageCounter = 0;
let logData = [];

let tempChart;
let adcChart;

let tempLabels = [];
let tempValues = [];

let adcLabels = [];
let adcValues = [];

//------------------------------------
// Utility Functions
//------------------------------------

function log(msg) {

    const logs = document.getElementById("logs");

    const time = new Date().toLocaleTimeString();

    logs.value += `[${time}] ${msg}\n`;

    logs.scrollTop = logs.scrollHeight;

    console.log(msg);
}

function updateStatus(isConnected) {

    const badge = document.getElementById("statusBadge");

    if (isConnected) {

        badge.innerHTML = "Connected";

        badge.classList.remove("bg-danger");

        badge.classList.add("bg-success");

    } else {

        badge.innerHTML = "Disconnected";

        badge.classList.remove("bg-success");

        badge.classList.add("bg-danger");

    }
}

//------------------------------------
// CONNECT
//------------------------------------

document.getElementById("connectBtn").addEventListener("click", function () {

    if (connected) {

        alert("Already Connected");

        return;
    }

    const host = document.getElementById("host").value.trim();

    const port = document.getElementById("port").value.trim();

    const username = document.getElementById("username").value.trim();

    const password = document.getElementById("password").value.trim();

    const clientid = document.getElementById("clientid").value.trim();

    const url = `wss://${host}:${port}/mqtt`;

    log("Connecting...");

    client = mqtt.connect(url, {

        clientId: clientid,

        username: username,

        password: password,

        clean: true,

        reconnectPeriod: 3000,

        connectTimeout: 10000,

        keepalive: 60

    });

    //------------------------------------

    client.on("connect", function () {

        connected = true;

        updateStatus(true);

        log("Connected to HiveMQ Cloud");

        client.subscribe("stm32/temp", function (err) {

            if (!err) {

                log("Subscribed : stm32/temp");

            } else {

                log("Subscribe Error");

            }

        });

    });

    //------------------------------------

    client.on("reconnect", function () {

        log("Reconnecting...");

    });

    //------------------------------------

    client.on("close", function () {

        connected = false;

        updateStatus(false);

        log("Disconnected");

    });

    //------------------------------------

    client.on("error", function (err) {

        log("MQTT Error : " + err.message);

    });

    //------------------------------------

    client.on("message", function (topic, payload) {

        let text = payload.toString();

        log("RX : " + text);

        try {

            const data = JSON.parse(text);

            updateDashboard(data);

        }

        catch {

            log("Invalid JSON");

        }

    });

});

//------------------------------------
// DISCONNECT
//------------------------------------

document.getElementById("disconnectBtn").addEventListener("click", function () {

    if (client) {

        client.end();

    }

});

//------------------------------------
// PUBLISH
//------------------------------------

document.getElementById("publishBtn").addEventListener("click", function () {

    if (!connected) {

        alert("Connect MQTT First");

        return;

    }

    const topic = document.getElementById("pubTopic").value;

    const message = document.getElementById("pubMessage").value;

    client.publish(topic, message);

    log("TX : " + message);

});

//------------------------------------
// UPDATE DASHBOARD
//------------------------------------

function updateDashboard(data) {

    messageCounter++;

    document.getElementById("msgCount").innerHTML = messageCounter;

    document.getElementById("adcValue").innerHTML = data.adc;

    document.getElementById("tempValue").innerHTML = data.temp + " °C";

    //------------------------------------

    const tbody = document.getElementById("tableBody");

    const row = tbody.insertRow(0);

    row.insertCell(0).innerHTML = messageCounter;

    row.insertCell(1).innerHTML = data.time;

    row.insertCell(2).innerHTML = data.adc;

    row.insertCell(3).innerHTML = data.temp;

    //------------------------------------

    logData.push(data);
	//----------------------------------
// Temperature Chart
//----------------------------------

tempLabels.push(data.time);

tempValues.push(data.temp);

if(tempLabels.length>50){

tempLabels.shift();

tempValues.shift();

}

tempChart.data.labels=tempLabels;

tempChart.data.datasets[0].data=tempValues;

tempChart.update();

//----------------------------------
// ADC Chart
//----------------------------------

adcLabels.push(data.time);

adcValues.push(data.adc);

if(adcLabels.length>50){

adcLabels.shift();

adcValues.shift();

}

adcChart.data.labels=adcLabels;

adcChart.data.datasets[0].data=adcValues;

adcChart.update();

}

window.addEventListener("load", function () {

    const tempCtx = document.getElementById("tempChart");

    tempChart = new Chart(tempCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Temperature (°C)",
                data: [],
                borderColor: "red",
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            animation: false
        }
    });

    const adcCtx = document.getElementById("adcChart");

    adcChart = new Chart(adcCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "ADC",
                data: [],
                borderColor: "blue",
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            animation: false
        }
    });

});