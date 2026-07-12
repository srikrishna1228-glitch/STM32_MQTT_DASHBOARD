//=============================
// Login Module
//=============================

const LOGIN_USER = "admin";
const LOGIN_PASS = "admin123";

window.login = function () {

    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPassword").value.trim();

    if(user===LOGIN_USER && pass===LOGIN_PASS){

        sessionStorage.setItem("loggedin","true");

        document.getElementById("loginPage").style.display="none";
        document.getElementById("dashboard").style.display="block";

        document.getElementById("clientid").value =
        "dashboard_"+Math.floor(Math.random()*100000);

    }
    else{

        document.getElementById("loginMsg").innerHTML =
        "Invalid Username or Password";

    }

}

window.logout=function(){

sessionStorage.clear();

location.reload();

}

window.addEventListener("load", function () {

    if (sessionStorage.getItem("loggedin")) {

        document.getElementById("loginPage").style.display = "none";

        document.getElementById("dashboard").style.display = "block";

    }

    // Load MQTT Settings

    const settings = JSON.parse(
        localStorage.getItem("mqttSettings")
    );

    if (settings) {

        document.getElementById("host").value = settings.host;

        document.getElementById("port").value = settings.port;

        document.getElementById("username").value = settings.username;

        document.getElementById("clientid").value = settings.clientid;

    }

});