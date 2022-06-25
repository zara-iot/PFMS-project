function drawLineChart () {
  let j = 0
  let current_data = []
  let voltage_data = []
  let power_data = []
  let energy_data = []
  let power_factor_data = []
  let frequency_data = []

  let x = 0
  let y = 0
  let chart_area_common = {}
  let selection_all = true

  if (motor_selection) {
    selection_all = false
    x = window.innerWidth * 0.9
    y = window.innerHeight * 0.87
    chart_area_common = {
      left: x / 12,
      top: y / 9,
      width: x / 1.15,
      height: y / 1.35,
      titleTextStyle: { color: 'red', fontName: 'calibri', fontSize: 20, bold: true, italic: false },
      vAxis: { TextStyle: { fontSize: 20, color: 'red' } }
    }
  } else {
    selection_all = true
    x = window.innerWidth / 3.42
    y = window.innerHeight / 3.65
    chart_area_common = {}
  }

  const Line_Chart_current = new google.visualization.LineChart(document.getElementById('line_chart_current'))
  const Line_Chart_voltage = new google.visualization.LineChart(document.getElementById('line_chart_voltage'))
  const Line_Chart_power = new google.visualization.LineChart(document.getElementById('line_chart_power'))
  const Line_Chart_energy = new google.visualization.LineChart(document.getElementById('line_chart_energy'))
  const Line_Chart_power_factor = new google.visualization.LineChart(document.getElementById('line_chart_power_factor'))
  const Line_Chart_frequency = new google.visualization.LineChart(document.getElementById('line_chart_frequency'))

  const line_chart_current_data = new google.visualization.DataTable()
  const line_chart_voltage_data = new google.visualization.DataTable()
  const line_chart_power_data = new google.visualization.DataTable()
  const line_chart_energy_data = new google.visualization.DataTable()
  const line_chart_power_factor_data = new google.visualization.DataTable()
  const line_chart_frequency_data = new google.visualization.DataTable()

  line_chart_current_data.addColumn('datetime', 'Time')
  line_chart_current_data.addColumn('number', 'Current(A)')

  line_chart_voltage_data.addColumn('datetime', 'Time')
  line_chart_voltage_data.addColumn('number', 'Voltage(V)')

  line_chart_power_data.addColumn('datetime', 'Time')
  line_chart_power_data.addColumn('number', 'Power(W)')

  line_chart_energy_data.addColumn('datetime', 'Time')
  line_chart_energy_data.addColumn('number', 'Energy(w.h)')

  line_chart_power_factor_data.addColumn('datetime', 'Time')
  line_chart_power_factor_data.addColumn('number', 'Power_factor')

  line_chart_frequency_data.addColumn('datetime', 'Time')
  line_chart_frequency_data.addColumn('number', 'Frequency(Hz)')

  for (let i = 0; i < sdd_motors.length; i++) {
    if (sdd_motors[i].motor_id === global_f) {
      current_data[j] = [new Date(sdd_motors[i].date_time), sdd_motors[i].current]
      voltage_data[j] = [new Date(sdd_motors[i].date_time), sdd_motors[i].voltage]
      power_data[j] = [new Date(sdd_motors[i].date_time), sdd_motors[i].power]
      energy_data[j] = [new Date(sdd_motors[i].date_time), sdd_motors[i].energy]
      power_factor_data[j] = [new Date(sdd_motors[i].date_time), sdd_motors[i].power_factor]
      frequency_data[j] = [new Date(sdd_motors[i].date_time), sdd_motors[i].frequency]
      j++
    }
  }

  line_chart_current_data.addRows(current_data)
  line_chart_voltage_data.addRows(voltage_data)
  line_chart_power_data.addRows(power_data)
  line_chart_energy_data.addRows(energy_data)
  line_chart_power_factor_data.addRows(power_factor_data)
  line_chart_frequency_data.addRows(frequency_data)

  let line_chart_common = {
    titleTextStyle: { color: 'red' },
    curveType: 'function',
    pointSize: 2,
    series: {
      0: { pointShape: 'diamond' }
    },
    legend: {
      lineWidth: 0,
      textStyle: { color: 'white' }
    },
    chartArea: chart_area_common,
    vAxis: {
      titleTextStyle: { bold: true, color: 'black', fontSize: 14, italic: false }
    },
    hAxis: {
      title: 'Time',
      titleTextStyle: { bold: true, color: 'black', fontSize: 14, italic: false }
    },
    width: x,
    height: y
  }

  if (motor_selection === 1 || selection_all) {
    line_chart_common.title = 'Current vs. Time Performance'
    line_chart_common.vAxis.title = 'Current(A)'
    Line_Chart_current.draw(line_chart_current_data, line_chart_common)
  }
  if (motor_selection === 2 || selection_all) {
    line_chart_common.title = 'Voltage vs. Time Performance'
    line_chart_common.vAxis.title = 'Voltage(V)'
    Line_Chart_voltage.draw(line_chart_voltage_data, line_chart_common)
  }
  if (motor_selection === 3 || selection_all) {
    line_chart_common.title = 'Power vs. Time Performance'
    line_chart_common.vAxis.title = 'Power(W)'
    Line_Chart_power.draw(line_chart_power_data, line_chart_common)
  }
  if (motor_selection === 4 || selection_all) {
    line_chart_common.title = 'Energy vs. Time Performance'
    line_chart_common.vAxis.title = 'Energy(W)'
    Line_Chart_energy.draw(line_chart_energy_data, line_chart_common)
  }
  if (motor_selection === 5 || selection_all) {
    line_chart_common.title = 'Power_factor vs. Time Performance'
    line_chart_common.vAxis.title = 'Power_factor(W)'
    Line_Chart_power_factor.draw(line_chart_power_factor_data, line_chart_common)
  }
  if (motor_selection === 6 || selection_all) {
    line_chart_common.title = 'Frequency vs. Time Performance'
    line_chart_common.vAxis.title = 'Frequency(W)'
    Line_Chart_frequency.draw(line_chart_frequency_data, line_chart_common)
  }
}
/// ///////////////////////////////// End of Line Chart /////////////////////////////////////////////

function drawGauges () {
  f_m_currentData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Current', 0]
  ])

  f_m_voltageData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Voltage', 0]
  ])

  f_m_powerData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Power', 0]
  ])

  f_m_energyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Energy', 0]
  ])

  f_m_power_factorData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['p.f', 0]
  ])

  f_m_frequencyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['freq.', 0]
  ])

  /// ////////////////////////////////////////////////////////////////////
  f_l_currentData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Current', 0]
  ])

  f_l_voltageData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Voltage', 0]
  ])

  f_l_powerData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Power', 0]
  ])

  f_l_energyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Energy', 0]
  ])

  f_l_power_factorData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['p.f', 0]
  ])

  f_l_frequencyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['freq.', 0]
  ])

  // //////////////////////////////////////////////////////////////
  c_a_e_currentData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Current', 0]
  ])

  c_a_e_voltageData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Voltage', 0]
  ])

  c_a_e_powerData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Power', 0]
  ])

  c_a_e_energyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Energy', 0]
  ])

  c_a_e_power_factorData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['p.f', 0]
  ])

  c_a_e_frequencyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['freq.', 0]
  ])

  // /////////////////////////////////////////////////////////////
  c_e_currentData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Current', 0]
  ])

  c_e_voltageData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Voltage', 0]
  ])

  c_e_powerData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Power', 0]
  ])

  c_e_energyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Energy', 0]
  ])

  c_e_power_factorData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['p.f', 0]
  ])

  c_e_frequencyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['freq.', 0]
  ])

  // ////////////////////////////////////////////////////////
  c_currentData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Current', 0]
  ])

  c_voltageData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Voltage', 0]
  ])

  c_powerData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Power', 0]
  ])

  c_energyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Energy', 0]
  ])

  c_power_factorData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['p.f', 0]
  ])

  c_frequencyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['freq.', 0]
  ])

  // ////////////////////////////////////////////////////////
  h_currentData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Current', 0]
  ])

  h_voltageData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Voltage', 0]
  ])

  h_powerData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Power', 0]
  ])

  h_energyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['Energy', 0]
  ])

  h_power_factorData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['p.f', 0]
  ])

  h_frequencyData = google.visualization.arrayToDataTable([
    ['Label', 'Value'], ['freq.', 0]
  ])

  currentOptions = {
    width: window.innerWidth / 17.45,
    height: window.innerHeight / 8,
    redFrom: 9,
    redTo: 10,
    yellowFrom: 7.5,
    yellowTo: 9,
    minorTicks: 5,
    min: 0,
    max: 10
  }

  voltageOptions = {
    width: window.innerWidth / 17.45,
    height: window.innerHeight / 8,
    redFrom: 240,
    redTo: 300,
    yellowFrom: 200,
    yellowTo: 240,
    minorTicks: 5,
    min: 0,
    max: 300
  }

  powerOptions = {
    width: window.innerWidth / 17.45,
    height: window.innerHeight / 8,
    redFrom: 2700,
    redTo: 3000,
    yellowFrom: 2250,
    yellowTo: 2700,
    minorTicks: 5,
    min: 0,
    max: 3000
  }

  energyOptions = {
    width: window.innerWidth / 17.45,
    height: window.innerHeight / 8,
    redFrom: 9000,
    redTo: 10000,
    yellowFrom: 7500,
    yellowTo: 9000,
    minorTicks: 5,
    min: 0,
    max: 10000
  }

  power_factorOptions = {
    width: window.innerWidth / 17.45,
    height: window.innerHeight / 8,
    greenFrom: 0.9,
    greenTo: 1,
    yellowFrom: 0.75,
    yellowTo: 0.9,
    minorTicks: 5,
    min: 0,
    max: 1
  }

  frequencyOptions = {
    width: window.innerWidth / 17.45,
    height: window.innerHeight / 8,
    redFrom: 51,
    redTo: 55,
    greenFrom: 49,
    greenTo: 51,
    minorTicks: 5,
    min: 45,
    max: 55
  }

  f_m_currentChart = new google.visualization.Gauge(document.getElementById('f_m_current_div'))
  f_m_voltageChart = new google.visualization.Gauge(document.getElementById('f_m_voltage_div'))
  f_m_powerChart = new google.visualization.Gauge(document.getElementById('f_m_power_div'))
  f_m_energyChart = new google.visualization.Gauge(document.getElementById('f_m_energy_div'))
  f_m_power_factorChart = new google.visualization.Gauge(document.getElementById('f_m_power_factor_div'))
  f_m_frequencyChart = new google.visualization.Gauge(document.getElementById('f_m_frequency_div'))

  f_m_currentChart.draw(f_m_currentData, currentOptions)
  f_m_voltageChart.draw(f_m_voltageData, voltageOptions)
  f_m_powerChart.draw(f_m_powerData, powerOptions)
  f_m_energyChart.draw(f_m_energyData, energyOptions)
  f_m_power_factorChart.draw(f_m_power_factorData, power_factorOptions)
  f_m_frequencyChart.draw(f_m_frequencyData, frequencyOptions)

  f_l_currentChart = new google.visualization.Gauge(document.getElementById('f_l_current_div'))
  f_l_voltageChart = new google.visualization.Gauge(document.getElementById('f_l_voltage_div'))
  f_l_powerChart = new google.visualization.Gauge(document.getElementById('f_l_power_div'))
  f_l_energyChart = new google.visualization.Gauge(document.getElementById('f_l_energy_div'))
  f_l_power_factorChart = new google.visualization.Gauge(document.getElementById('f_l_power_factor_div'))
  f_l_frequencyChart = new google.visualization.Gauge(document.getElementById('f_l_frequency_div'))

  f_l_currentChart.draw(f_l_currentData, currentOptions)
  f_l_voltageChart.draw(f_l_voltageData, voltageOptions)
  f_l_powerChart.draw(f_l_powerData, powerOptions)
  f_l_energyChart.draw(f_l_energyData, energyOptions)
  f_l_power_factorChart.draw(f_l_power_factorData, power_factorOptions)
  f_l_frequencyChart.draw(f_l_frequencyData, frequencyOptions)

  c_a_e_currentChart = new google.visualization.Gauge(document.getElementById('c_a_e_current_div'))
  c_a_e_voltageChart = new google.visualization.Gauge(document.getElementById('c_a_e_voltage_div'))
  c_a_e_powerChart = new google.visualization.Gauge(document.getElementById('c_a_e_power_div'))
  c_a_e_energyChart = new google.visualization.Gauge(document.getElementById('c_a_e_energy_div'))
  c_a_e_power_factorChart = new google.visualization.Gauge(document.getElementById('c_a_e_power_factor_div'))
  c_a_e_frequencyChart = new google.visualization.Gauge(document.getElementById('c_a_e_frequency_div'))

  c_a_e_currentChart.draw(c_a_e_currentData, currentOptions)
  c_a_e_voltageChart.draw(c_a_e_voltageData, voltageOptions)
  c_a_e_powerChart.draw(c_a_e_powerData, powerOptions)
  c_a_e_energyChart.draw(c_a_e_energyData, energyOptions)
  c_a_e_power_factorChart.draw(c_a_e_power_factorData, power_factorOptions)
  c_a_e_frequencyChart.draw(c_a_e_frequencyData, frequencyOptions)

  c_e_currentChart = new google.visualization.Gauge(document.getElementById('c_e_current_div'))
  c_e_voltageChart = new google.visualization.Gauge(document.getElementById('c_e_voltage_div'))
  c_e_powerChart = new google.visualization.Gauge(document.getElementById('c_e_power_div'))
  c_e_energyChart = new google.visualization.Gauge(document.getElementById('c_e_energy_div'))
  c_e_power_factorChart = new google.visualization.Gauge(document.getElementById('c_e_power_factor_div'))
  c_e_frequencyChart = new google.visualization.Gauge(document.getElementById('c_e_frequency_div'))

  c_e_currentChart.draw(c_e_currentData, currentOptions)
  c_e_voltageChart.draw(c_e_voltageData, voltageOptions)
  c_e_powerChart.draw(c_e_powerData, powerOptions)
  c_e_energyChart.draw(c_e_energyData, energyOptions)
  c_e_power_factorChart.draw(c_e_power_factorData, power_factorOptions)
  c_e_frequencyChart.draw(c_e_frequencyData, frequencyOptions)

  c_currentChart = new google.visualization.Gauge(document.getElementById('c_current_div'))
  c_voltageChart = new google.visualization.Gauge(document.getElementById('c_voltage_div'))
  c_powerChart = new google.visualization.Gauge(document.getElementById('c_power_div'))
  c_energyChart = new google.visualization.Gauge(document.getElementById('c_energy_div'))
  c_power_factorChart = new google.visualization.Gauge(document.getElementById('c_power_factor_div'))
  c_frequencyChart = new google.visualization.Gauge(document.getElementById('c_frequency_div'))

  c_currentChart.draw(c_currentData, currentOptions)
  c_voltageChart.draw(c_voltageData, voltageOptions)
  c_powerChart.draw(c_powerData, powerOptions)
  c_energyChart.draw(c_energyData, energyOptions)
  c_power_factorChart.draw(c_power_factorData, power_factorOptions)
  c_frequencyChart.draw(c_frequencyData, frequencyOptions)

  h_currentChart = new google.visualization.Gauge(document.getElementById('h_current_div'))
  h_voltageChart = new google.visualization.Gauge(document.getElementById('h_voltage_div'))
  h_powerChart = new google.visualization.Gauge(document.getElementById('h_power_div'))
  h_energyChart = new google.visualization.Gauge(document.getElementById('h_energy_div'))
  h_power_factorChart = new google.visualization.Gauge(document.getElementById('h_power_factor_div'))
  h_frequencyChart = new google.visualization.Gauge(document.getElementById('h_frequency_div'))

  h_currentChart.draw(h_currentData, currentOptions)
  h_voltageChart.draw(h_voltageData, voltageOptions)
  h_powerChart.draw(h_powerData, powerOptions)
  h_energyChart.draw(h_energyData, energyOptions)
  h_power_factorChart.draw(h_power_factorData, power_factorOptions)
  h_frequencyChart.draw(h_frequencyData, frequencyOptions)

  document.getElementById('f_m_off').style.opacity = 0.2
  document.getElementById('f_m_on').style.opacity = 0.2
  document.getElementById('f_l_off').style.opacity = 0.2
  document.getElementById('f_l_on').style.opacity = 0.2
  document.getElementById('c_a_e_off').style.opacity = 0.2
  document.getElementById('c_a_e_on').style.opacity = 0.2
  document.getElementById('c_e_off').style.opacity = 0.2
  document.getElementById('c_e_on').style.opacity = 0.2
  document.getElementById('c_off').style.opacity = 0.2
  document.getElementById('c_on').style.opacity = 0.2
  document.getElementById('h_off').style.opacity = 0.2
  document.getElementById('h_on').style.opacity = 0.2
}

function restart_drawing_motors_guages() {
  f_m_currentData.setValue(0, 1, 0)
  f_m_voltageData.setValue(0, 1, 0)
  f_m_powerData.setValue(0, 1, 0)
  f_m_energyData.setValue(0, 1, 0)
  f_m_power_factorData.setValue(0, 1, 0)
  f_m_frequencyData.setValue(0, 1, 0)

  f_l_currentData.setValue(0, 1, 0)
  f_l_voltageData.setValue(0, 1, 0)
  f_l_powerData.setValue(0, 1, 0)
  f_l_energyData.setValue(0, 1, 0)
  f_l_power_factorData.setValue(0, 1, 0)
  f_l_frequencyData.setValue(0, 1, 0)

  c_a_e_currentData.setValue(0, 1, 0)
  c_a_e_voltageData.setValue(0, 1, 0)
  c_a_e_powerData.setValue(0, 1, 0)
  c_a_e_energyData.setValue(0, 1, 0)
  c_a_e_power_factorData.setValue(0, 1, 0)
  c_a_e_frequencyData.setValue(0, 1, 0)

  c_currentData.setValue(0, 1, 0)
  c_voltageData.setValue(0, 1, 0)
  c_powerData.setValue(0, 1, 0)
  c_energyData.setValue(0, 1, 0)
  c_power_factorData.setValue(0, 1, 0)
  c_frequencyData.setValue(0, 1, 0)

  c_e_currentData.setValue(0, 1, 0)
  c_e_voltageData.setValue(0, 1, 0)
  c_e_powerData.setValue(0, 1, 0)
  c_e_energyData.setValue(0, 1, 0)
  c_e_power_factorData.setValue(0, 1, 0)
  c_e_frequencyData.setValue(0, 1, 0)

  h_currentData.setValue(0, 1, 0)
  h_voltageData.setValue(0, 1, 0)
  h_powerData.setValue(0, 1, 0)
  h_energyData.setValue(0, 1, 0)
  h_power_factorData.setValue(0, 1, 0)
  h_frequencyData.setValue(0, 1, 0)

  f_m_currentChart.draw(f_m_currentData, currentOptions)
  f_m_voltageChart.draw(f_m_voltageData, voltageOptions)
  f_m_powerChart.draw(f_m_powerData, powerOptions)
  f_m_energyChart.draw(f_m_energyData, energyOptions)
  f_m_power_factorChart.draw(f_m_power_factorData, power_factorOptions)
  f_m_frequencyChart.draw(f_m_frequencyData, frequencyOptions)

  f_l_currentChart.draw(f_l_currentData, currentOptions)
  f_l_voltageChart.draw(f_l_voltageData, voltageOptions)
  f_l_powerChart.draw(f_l_powerData, powerOptions)
  f_l_energyChart.draw(f_l_energyData, energyOptions)
  f_l_power_factorChart.draw(f_l_power_factorData, power_factorOptions)
  f_l_frequencyChart.draw(f_l_frequencyData, frequencyOptions)

  c_a_e_currentChart.draw(c_a_e_currentData, currentOptions)
  c_a_e_voltageChart.draw(c_a_e_voltageData, voltageOptions)
  c_a_e_powerChart.draw(c_a_e_powerData, powerOptions)
  c_a_e_energyChart.draw(c_a_e_energyData, energyOptions)
  c_a_e_power_factorChart.draw(c_a_e_power_factorData, power_factorOptions)
  c_a_e_frequencyChart.draw(c_a_e_frequencyData, frequencyOptions)

  c_e_currentChart.draw(c_e_currentData, currentOptions)
  c_e_voltageChart.draw(c_e_voltageData, voltageOptions)
  c_e_powerChart.draw(c_e_powerData, powerOptions)
  c_e_energyChart.draw(c_e_energyData, energyOptions)
  c_e_power_factorChart.draw(c_e_power_factorData, power_factorOptions)
  c_e_frequencyChart.draw(c_e_frequencyData, frequencyOptions)

  c_currentChart.draw(c_currentData, currentOptions)
  c_voltageChart.draw(c_voltageData, voltageOptions)
  c_powerChart.draw(c_powerData, powerOptions)
  c_energyChart.draw(c_energyData, energyOptions)
  c_power_factorChart.draw(c_power_factorData, power_factorOptions)
  c_frequencyChart.draw(c_frequencyData, frequencyOptions)

  h_currentChart.draw(h_currentData, currentOptions)
  h_voltageChart.draw(h_voltageData, voltageOptions)
  h_powerChart.draw(h_powerData, powerOptions)
  h_energyChart.draw(h_energyData, energyOptions)
  h_power_factorChart.draw(h_power_factorData, power_factorOptions)
  h_frequencyChart.draw(h_frequencyData, frequencyOptions)

  document.getElementById('linear_gauge').setAttribute('data-value', 0)
  document.getElementById('radial_gauge').setAttribute('data-value', 0)
    
  
  document.getElementById('f_m_off').style.opacity = 0.2
  document.getElementById('f_m_on').style.opacity = 0.2
  document.getElementById('f_l_off').style.opacity = 0.2
  document.getElementById('f_l_on').style.opacity = 0.2
  document.getElementById('c_a_e_off').style.opacity = 0.2
  document.getElementById('c_a_e_on').style.opacity = 0.2
  document.getElementById('c_e_off').style.opacity = 0.2
  document.getElementById('c_e_on').style.opacity = 0.2
  document.getElementById('c_off').style.opacity = 0.2
  document.getElementById('c_on').style.opacity = 0.2
  document.getElementById('h_off').style.opacity = 0.2
  document.getElementById('h_on').style.opacity = 0.2  
}

function start_drawing_gauges() {
  const radial_gauge = document.getElementById("radial_gauge")
  const linear_gauge = document.getElementById("linear_gauge")

  const width_radial_gauge = window.innerWidth / 9.5
  const height_radial_gauge = window.innerHeight / 5.5

  const width_linear_gauge = window.innerWidth / 16
  const height_linear_gauge = window.innerHeight / 4

  radial_gauge.setAttribute('data-width', width_radial_gauge)
  radial_gauge.setAttribute('data-height', height_radial_gauge)
  linear_gauge.setAttribute('data-width', width_linear_gauge)
  linear_gauge.setAttribute('data-height', height_linear_gauge)
}
