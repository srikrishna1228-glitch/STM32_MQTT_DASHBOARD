/*====================================================
    mqtt.js
    STM32 MQTT Dashboard
====================================================*/

let mqttClient = null;
let mqttConnected = false;

let reconnectCounter = 0;
let connectTime = null;
let uptimeTimer = null;

const SUBSCRIBE_TOPIC = "stm32/temp";
const PUBLISH_TOPIC = "stm32/f407/command";

function mqttLog(message) {
    const box = document.getElementById("logs");
    const t = new Date().toLocaleTimeString();

    if (box) {
        box.value += "[" + t + "] " + message + "\n";
        box.scrollTop = box.scrollHeight;
    }

    console.log(message);
}

function updateStatus(state) {
    const badge = document.getElementById("statusBadge");

    if (!badge) return;

    if (state) {
        badge.className = "badge bg-success";
        badge.innerHTML = "Connected";
    } else {
        badge.className = "badge bg-danger";
        badge.innerHTML = "Disconnected";
    }
}

function mqttConnect() {
    if (mqttConnected) {
        alert("Already Connected");
        return;
    }

    const host = document.getElementById("host").value.trim();
    const port = document.getElementById("port").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const clientid = document.getElementById("clientid").value.trim();
    const ssl = document.getElementById("ssl").checked;

    if (!host || !port) {
        alert("Please enter broker host and port");
        return;
    }

    const protocol = ssl ? "wss" : "ws";
    const url = `${protocol}://${host}:${port}/mqtt`;

    mqttLog("Connecting to " + url + "...");

    mqttClient = mqtt.connect(url, {
        clientId: clientid || "dashboard_" + Math.floor(Math.random() * 100000),
        username: username,
        password: password,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
        keepalive: 60
    });

    mqttClient.on("connect", function () {
        mqttConnected = true;
        connectTime = new Date();
        updateStatus(true);
        mqttLog("Connected to broker");

        mqttClient.subscribe(SUBSCRIBE_TOPIC, function (err) {
            if (!err) {
                mqttLog("Subscribed : " + SUBSCRIBE_TOPIC);
            } else {
                mqttLog("Subscribe Failed");
            }
        });

        const settings = { host, port, username, clientid };
        localStorage.setItem("mqttSettings", JSON.stringify(settings));

        const brokerInfo = document.getElementById("brokerInfo");
        const brokerPort = document.getElementById("brokerPort");
        const clientInfo = document.getElementById("clientInfo");
        const topicInfo = document.getElementById("topicInfo");

        if (brokerInfo) brokerInfo.innerHTML = host;
        if (brokerPort) brokerPort.innerHTML = port;
        if (clientInfo) clientInfo.innerHTML = clientid || "--";
        if (topicInfo) topicInfo.innerHTML = SUBSCRIBE_TOPIC;

        startUptime();
    });

    mqttClient.on("message", function (topic, payload) {
        const text = payload.toString();
        mqttLog("RX : " + text);

        if (typeof dashboardReceive === "function") {
            dashboardReceive(text);
        }
    });

    mqttClient.on("reconnect", function () {
        reconnectCounter++;
        mqttLog("Reconnect Attempt : " + reconnectCounter);
    });

    mqttClient.on("connect_error", function (err) {
        mqttConnected = false;
        updateStatus(false);
        mqttLog("Connection failed : " + (err && err.message ? err.message : err));
    });

    mqttClient.on("close", function () {
        mqttConnected = false;
        updateStatus(false);
        mqttLog("Disconnected");
        clearInterval(uptimeTimer);
    });

    mqttClient.on("offline", function () {
        mqttConnected = false;
        updateStatus(false);
        mqttLog("Client went offline");
    });

    mqttClient.on("error", function (err) {
        mqttLog("MQTT Error : " + (err && err.message ? err.message : err));
    });
}

function mqttDisconnect() {
    if (mqttClient) {
        mqttClient.end();
    }
}

function mqttPublish() {
    if (!mqttConnected) {
        alert("Connect MQTT First");
        return;
    }

    const topicInput = document.getElementById("pubTopic");
    const topic = topicInput ? topicInput.value.trim() || PUBLISH_TOPIC : PUBLISH_TOPIC;
    const message = document.getElementById("pubMessage").value.trim();

    if (!message) {
        alert("Enter a message to publish");
        return;
    }

    mqttClient.publish(topic, message);
    mqttLog("TX [" + topic + "] : " + message);
}

function sendCommand(command) {
    if (!mqttConnected) {
        alert("Connect MQTT First");
        return;
    }

    const topicInput = document.getElementById("pubTopic");
    const topic = topicInput ? topicInput.value.trim() || PUBLISH_TOPIC : PUBLISH_TOPIC;
    const payloads = [command.trim(), command.toUpperCase().trim(), command.replace(/_/g, "").toLowerCase(), command.toLowerCase()];
    const uniquePayloads = payloads.filter(function (value, index) {
        return value && payloads.indexOf(value) === index;
    });

    function publishToTopic(targetTopic, payload) {
        mqttClient.publish(targetTopic, payload);
        mqttLog("TX [" + targetTopic + "] : " + payload);
    }

    uniquePayloads.forEach(function (payload) {
        publishToTopic(topic, payload);
    });

    const fallbackTopics = [PUBLISH_TOPIC, "stm32/command", "stm32/cmd", "cmd"].filter(function (value) {
        return value && value !== topic;
    });

    fallbackTopics.forEach(function (fallbackTopic) {
        uniquePayloads.forEach(function (payload) {
            publishToTopic(fallbackTopic, payload);
        });
    });
}

function sendCustomCommand() {
    const cmd = document.getElementById("customCommand").value.trim();

    if (cmd === "") {
        alert("Enter Command");
        return;
    }

    sendCommand(cmd);
    document.getElementById("customCommand").value = "";
}

function startUptime() {
    clearInterval(uptimeTimer);

    uptimeTimer = setInterval(function () {
        const now = new Date();
        const diff = now - connectTime;
        const sec = Math.floor(diff / 1000) % 60;
        const min = Math.floor(diff / 60000) % 60;
        const hr = Math.floor(diff / 3600000);

        const txt = String(hr).padStart(2, "0") + ":" + String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");

        const obj = document.getElementById("uptime");
        if (obj) obj.innerHTML = txt;
    }, 1000);
}

window.addEventListener("load", function () {
    const settings = JSON.parse(localStorage.getItem("mqttSettings") || "null");

    if (settings) {
        document.getElementById("host").value = settings.host || "";
        document.getElementById("port").value = settings.port || "";
        document.getElementById("username").value = settings.username || "";
        document.getElementById("clientid").value = settings.clientid || "";
    }
});