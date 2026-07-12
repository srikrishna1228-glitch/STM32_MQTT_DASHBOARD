//-------------------------------------
// Dashboard Settings
//-------------------------------------

let dashboardSettings = {

    subscribeTopic: "stm32/temp",

    publishTopic: "stm32/f407/command",

    alarmTemp: 40,

    maxSamples: 50

};

//-------------------------------------

function saveSettings(){

    dashboardSettings.subscribeTopic =
    document.getElementById("settingTopic").value;

    dashboardSettings.publishTopic =
    document.getElementById("settingPublish").value;

    dashboardSettings.alarmTemp =
    Number(document.getElementById("alarmTemp").value);

    dashboardSettings.maxSamples =
    Number(document.getElementById("maxSamples").value);

    localStorage.setItem(
        "dashboardSettings",
        JSON.stringify(dashboardSettings)
    );

    alert("Settings Saved.");

}

//-------------------------------------

window.addEventListener("load",function(){

const saved =
localStorage.getItem("dashboardSettings");

if(saved){

dashboardSettings =
JSON.parse(saved);

document.getElementById("settingTopic").value =
dashboardSettings.subscribeTopic;

document.getElementById("settingPublish").value =
dashboardSettings.publishTopic;

document.getElementById("alarmTemp").value =
dashboardSettings.alarmTemp;

document.getElementById("maxSamples").value =
dashboardSettings.maxSamples;

}

});