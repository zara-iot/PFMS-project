const script = document.createElement('script')
script.src = 'https://www.gstatic.com/charts/loader.js'
script.type = 'text/javascript'

document.getElementsByTagName('head').item(0).appendChild(script)
google.charts.load('current', {'packages':['gauge']})
google.charts.setOnLoadCallback(drawChart)
function drawChart () {
  let current_data = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Current', 0]
  ])

  let voltage_data = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Voltage', 0]
  ])

  let power_data = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Power', 0]
  ])

  let energy_data = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Energy', 0]
  ])

  let power_factor_data = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['p.f', 0.65]
  ])

  let frequency_data = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['frequency', 51]
  ])

  let current_options = {
    width: 300,
    height: 110,
    redFrom: 90,
    redTo: 100,
    yellowFrom: 75,
    yellowTo: 90,
    minorTicks: 5,
    min: 0,
    max: 100
  }

  let voltage_options = {
    width: 300,
    height: 110,
    redFrom: 240,
    redTo: 300,
    yellowFrom: 200,
    yellowTo: 240,
    minorTicks: 5,
    min: 0,
    max: 300
  }

  let power_options = {
    width: 300,
    height: 110,
    redFrom: 9000,
    redTo: 10000,
    yellowFrom: 7500,
    yellowTo: 90000,
    minorTicks: 5,
    min: 0,
    max: 10000
  }

  let energy_options = {
    width: 300,
    height: 110,
    redFrom: 9000,
    redTo: 10000,
    yellowFrom: 7500,
    yellowTo: 9000,
    minorTicks: 5,
    min: 0,
    max: 10000
  }

  let power_factor_options = {
    width: 300,
    height: 110,
    greenFrom: 0.9,
    greenTo: 1,
    yellowFrom: 0.75,
    yellowTo: 0.9,
    minorTicks: 5,
    min: 0,
    max: 1
  }

  let frequency_options = {
    width: 300,
    height: 110,
    redFrom: 51,
    redTo: 55,
    greenFrom: 49,
    greenTo: 51,
    minorTicks: 5,
    min: 45,
    max: 55
  }
  let current_chart = new google.visualization.Gauge(document.getElementById('current_div'));
  let voltage_chart = new google.visualization.Gauge(document.getElementById('voltage_div'));
  let power_chart = new google.visualization.Gauge(document.getElementById('power_div'));
  let energy_chart = new google.visualization.Gauge(document.getElementById('energy_div'));
  let power_factor_chart = new google.visualization.Gauge(document.getElementById('power_factor_div'));
  let frequency_chart = new google.visualization.Gauge(document.getElementById('frequency_div'));

  current_chart.draw(current_data, current_options)
  voltage_chart.draw(voltage_data, voltage_options)
  power_chart.draw(power_data, power_options)
  energy_chart.draw(energy_data, energy_options)
  power_factor_chart.draw(power_factor_data, power_factor_options)
  frequency_chart.draw(frequency_data, frequency_options)
}
