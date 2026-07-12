//==========================================
// Dashboard Module
//==========================================

let lastMessageTime = Date.now();
let messagesThisSecond = 0;
let lastPacket = "";
let totalADC = 0;
let minTemperature = Number.MAX_VALUE;
let maxTemperature = Number.MIN_VALUE;
let totalTemperature = 0;
let messageCounter = 0;
let logData = [];
let alarmIsActive = false;
let alarmAudioContext = null;

function formatIST(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(date) + " IST";
}
let alarmOscillator = null;
let alarmGain = null;
let alarmTimer = null;

function ensureAlarmAudio() {
    if (alarmAudioContext) return alarmAudioContext;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    alarmAudioContext = new AudioCtx();
    alarmGain = alarmAudioContext.createGain();
    alarmGain.gain.value = 0;
    alarmGain.connect(alarmAudioContext.destination);

    return alarmAudioContext;
}

function playAlarmBeep() {
    const ctx = ensureAlarmAudio();
    if (!ctx) return;

    if (ctx.state === "suspended") {
        ctx.resume().catch(function () {});
    }

    if (!alarmOscillator) {
        alarmOscillator = ctx.createOscillator();
        alarmOscillator.type = "sawtooth";
        alarmOscillator.frequency.value = 2200;
        alarmOscillator.connect(alarmGain);
        alarmOscillator.start();
    }

    const now = ctx.currentTime;
    alarmGain.gain.cancelScheduledValues(now);
    alarmGain.gain.setValueAtTime(0.0, now);
    alarmGain.gain.linearRampToValueAtTime(0.75, now + 0.01);
    alarmGain.gain.linearRampToValueAtTime(0.0, now + 0.08);
}

function startAlarmTone() {
    if (alarmTimer) return;
    playAlarmBeep();
    alarmTimer = setInterval(playAlarmBeep, 220);
}

function stopAlarmTone() {
    if (alarmTimer) {
        clearInterval(alarmTimer);
        alarmTimer = null;
    }

    if (alarmGain && alarmAudioContext) {
        try {
            alarmGain.gain.cancelScheduledValues(alarmAudioContext.currentTime);
            alarmGain.gain.setValueAtTime(0.0, alarmAudioContext.currentTime);
        } catch (err) {}
    }

    if (alarmOscillator) {
        try {
            alarmOscillator.stop();
        } catch (err) {}
        alarmOscillator.disconnect();
        alarmOscillator = null;
    }
}

function dashboardReceive(message) {
    let data;

    try {
        data = JSON.parse(message);
    } catch (err) {
        mqttLog("Invalid JSON : " + err);
        return;
    }

    lastMessageTime = Date.now();
    messagesThisSecond++;

    const deviceStatusEl = document.getElementById("deviceStatus");
    const lastPacketEl = document.getElementById("lastPacket");
    const ledStatusEl = document.getElementById("ledStatus");
    const alarmStatusEl = document.getElementById("alarmStatus");
    const tempValueEl = document.getElementById("tempValue");
    const adcValueEl = document.getElementById("adcValue");
    const msgCountEl = document.getElementById("msgCount");
    const avgADCEl = document.getElementById("avgADC");
    const minTempEl = document.getElementById("minTemp");
    const maxTempEl = document.getElementById("maxTemp");
    const avgTempEl = document.getElementById("avgTemp");
    const lastUpdateEl = document.getElementById("lastUpdate");
    const tbody = document.getElementById("tableBody");

    if (deviceStatusEl) deviceStatusEl.innerHTML = "🟢 Online";
    if (lastPacketEl) {
        lastPacket = formatIST(new Date());
        lastPacketEl.innerHTML = lastPacket;
    }

    if (ledStatusEl) {
        ledStatusEl.innerHTML = data.led === "ON" ? "💡 ON" : "⚫ OFF";
    }

    if (alarmStatusEl) {
        const isHighAlarm = Number(data.temp) > Number(dashboardSettings.alarmTemp);

        if (isHighAlarm) {
            alarmStatusEl.innerHTML = "🔴 HIGH";
            alarmStatusEl.style.color = "red";

            if (!alarmIsActive) {
                alarmIsActive = true;
                startAlarmTone();
                if (navigator.vibrate) navigator.vibrate([400, 180, 400]);
            }
        } else {
            alarmStatusEl.innerHTML = "🟢 NORMAL";
            alarmStatusEl.style.color = "green";

            if (alarmIsActive) {
                alarmIsActive = false;
                stopAlarmTone();
            }
        }
    }

    messageCounter++;

    if (msgCountEl) msgCountEl.innerHTML = messageCounter;
    if (adcValueEl) adcValueEl.innerHTML = data.adc;
    if (tempValueEl) tempValueEl.innerHTML = data.temp + " °C";

    totalADC += Number(data.adc) || 0;
    if (avgADCEl) avgADCEl.innerHTML = (totalADC / messageCounter).toFixed(0);

    minTemperature = Math.min(minTemperature, Number(data.temp) || 0);
    maxTemperature = Math.max(maxTemperature, Number(data.temp) || 0);
    totalTemperature += Number(data.temp) || 0;

    if (minTempEl) minTempEl.innerHTML = minTemperature.toFixed(2);
    if (maxTempEl) maxTempEl.innerHTML = maxTemperature.toFixed(2);
    if (avgTempEl) avgTempEl.innerHTML = (totalTemperature / messageCounter).toFixed(2);
    if (lastUpdateEl) lastUpdateEl.innerHTML = data.time ? formatIST(data.time) : "--";

    if (tbody) {
        const row = tbody.insertRow(0);
        row.insertCell(0).innerHTML = messageCounter;
        row.insertCell(1).innerHTML = data.time ? formatIST(data.time) : "--";
        row.insertCell(2).innerHTML = data.adc;
        row.insertCell(3).innerHTML = data.temp;

        while (tbody.rows.length > 20) {
            tbody.deleteRow(20);
        }
    }

    logData.push(data);
    localStorage.setItem("stm32logs", JSON.stringify(logData));

    if (typeof updateCharts === "function") {
        updateCharts(data);
    }
}

window.addEventListener("load", function () {
    const saved = localStorage.getItem("stm32logs");

    if (saved) {
        logData = JSON.parse(saved);
        console.log("Loaded", logData.length, "records");
    }
});

function updateClock() {
    const clock = document.getElementById("clock");
    if (clock) {
        clock.innerHTML = formatIST(new Date());
    }
}

updateClock();
setInterval(updateClock, 1000);

window.addEventListener("load", function () {
    const search = document.getElementById("searchTable");

    if (!search) return;

    search.addEventListener("keyup", function () {
        const filter = this.value.toLowerCase();
        const rows = document.querySelectorAll("#tableBody tr");

        rows.forEach(function (row) {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(filter) ? "" : "none";
        });
    });
});

setInterval(function () {
    if (Date.now() - lastMessageTime > 5000) {
        const deviceStatusEl = document.getElementById("deviceStatus");
        if (deviceStatusEl) deviceStatusEl.innerHTML = "🔴 Offline";
    }
}, 1000);

setInterval(function () {
    const msgRateEl = document.getElementById("msgRate");
    if (msgRateEl) {
        msgRateEl.innerHTML = messagesThisSecond;
        messagesThisSecond = 0;
    }
}, 1000);