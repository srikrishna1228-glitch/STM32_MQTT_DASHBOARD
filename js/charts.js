//=========================================
// Charts
//=========================================
let temperatureGauge;
let adcGauge;

let tempChart;
let adcChart;

let labels = [];

let tempData = [];

let adcData = [];

window.addEventListener("load", function(){

    //------------------------------------
    // Temperature Chart
    //------------------------------------

    tempChart = new Chart(
        document.getElementById("tempChart"),
        {

            type:"line",

            data:{

                labels:[],

                datasets:[{

                    label:"Temperature",

                    data:[],

                    borderColor:"red",

                    fill:false,

                    tension:0.3

                }]

            },

            options:{

                responsive:true,

                animation:false

            }

        }

    );

    //------------------------------------
    // ADC Chart
    //------------------------------------

    adcChart = new Chart(

        document.getElementById("adcChart"),

        {

            type:"line",

            data:{

                labels:[],

                datasets:[{

                    label:"ADC",

                    data:[],

                    borderColor:"blue",

                    fill:false,

                    tension:0.3

                }]

            },

            options:{

                responsive:true,

                animation:false

            }

        }

    );

});


//------------------------------------
// Temperature Gauge
//------------------------------------

temperatureGauge = new RadialGauge({

    renderTo: 'tempGauge',

    width: 250,

    height: 250,

    units: "°C",

    minValue: 0,

    maxValue: 100,

    majorTicks: [

        "0","10","20","30","40",

        "50","60","70","80","90","100"

    ],

    highlights: [

        { from:0,to:35,color:"#00C853" },

        { from:35,to:45,color:"#FFD600" },

        { from:45,to:100,color:"#D50000" }

    ],

    value:0

}).draw();


//------------------------------------
// ADC Gauge
//------------------------------------

adcGauge = new RadialGauge({

    renderTo: 'adcGauge',

    width:250,

    height:250,

    units:"ADC",

    minValue:0,

    maxValue:4095,

    majorTicks:[

        "0","500","1000","1500","2000",

        "2500","3000","3500","4095"

    ],

    value:0

}).draw();

function updateCharts(data){

    labels.push(data.time);

    tempData.push(data.temp);

    adcData.push(data.adc);

    if(labels.length > dashboardSettings.maxSamples){

        labels.shift();

        tempData.shift();

        adcData.shift();

    }

    tempChart.data.labels = labels;

    tempChart.data.datasets[0].data = tempData;

    tempChart.update();

    adcChart.data.labels = labels;

    adcChart.data.datasets[0].data = adcData;

    adcChart.update();
	
	//------------------------------------
// Update Gauges
//------------------------------------

temperatureGauge.value = data.temp;

adcGauge.value = data.adc;

}