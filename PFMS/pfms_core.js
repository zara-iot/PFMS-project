google.charts.load('current', {'packages':['gauge']})
google.charts.setOnLoadCallback(drawGauges)

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawLineChart)

/// ///////////////////////////////////////////// Global Variables /////////////////////////////////////////////////////////////
let charts_resize_flag = false
let meters_temp_hum_gauges_resize_flag = true
let flag1 = false
let connection_status = false
let global_f = 0
let ad = []
let sdd_motors = []
let sdd_temp_hum = []
let mdd_motors = []
let mdd_temp_hum = []
let sock = ''
let motor_selection = 0
let selected_table_flag = ''
let meter_R_f = 0
let alarm_f = 0
let password_priority = ''
let HCS_halls_motors_ids_array = []
//var motors_current_data = [f_m_currentData, f_l_currentData, c_a_e_currentData, c_e_currentData, c_currentData, h_currentData]

setInterval(function () {
  function addLeadingZeros (n) {
    if (n <= 9) {
      return '0' + n
    }
    return n
  }
  let d = new Date(); d = addLeadingZeros(d.getHours()) + ':' + addLeadingZeros(d.getMinutes()) + ':' + addLeadingZeros(d.getSeconds()); document.getElementById('system_clock').innerText = d
}, 1000)

start_drawing_gauges()

window.addEventListener(('resize'), function () {
  if (charts_resize_flag) {
    drawLineChart()
  };
  if (meters_temp_hum_gauges_resize_flag) {
    resize_meters_temp_humidity_gauges()
  }
})

set_HCS_panel()
con_server()

/// ////////////////////////////////////////// Full Screen ///////////////////////////////////////////////////////////////////

function fullScreen () {
  var elem = document.documentElement
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen()
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen()
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen()
  }
}

function set_HCS_panel () {
  let k = 1
  let j = 0
  for (var zone = 1; zone <= 6; zone++) {
    for (var hall = 1; hall <= 20; hall++) {
      window['hall_' + k] = document.createElement('div')
      window['hall_' + k].className = 'hall'
      window['hall_' + k].id = 'hall_' + k.toString()

      window['hall_water_mark_' + k] = document.createElement('div')
      window['hall_water_mark_' + k].className = 'hall_water_mark'
      window['hall_water_mark_' + k].id = 'hall_water_mark_' + k.toString()

      document.getElementById('zone' + zone.toString()).appendChild(window['hall_' + k])
      document.getElementById('hall_' + k.toString()).appendChild(window['hall_water_mark_' + k])
      document.getElementById('hall_water_mark_' + k.toString()).innerHTML = hall
      for (var motor = 1; motor <= 6; motor++) {
        window['hall_' + k + '_motor_' + motor] = document.createElement('div')
        window['hall_' + k + '_motor_' + motor].className = 'motor'
        window['hall_' + k + '_motor_' + motor].id = 'hall_' + k.toString() + '_motor_' + motor.toString()
        document.getElementById('hall_' + k.toString()).appendChild(window['hall_' + k + '_motor_' + motor])
        if (motor === 1) {
          document.getElementById('hall_' + k.toString() + '_motor_' + motor.toString()).innerHTML = 'FM'
        } else if (motor === 2) {
          document.getElementById('hall_' + k.toString() + '_motor_' + motor.toString()).innerHTML = 'FL'
        } else if (motor === 3) {
          document.getElementById('hall_' + k.toString() + '_motor_' + motor.toString()).innerHTML = 'CAE'
        } else if (motor === 4) {
          document.getElementById('hall_' + k.toString() + '_motor_' + motor.toString()).innerHTML = 'CE'
        } else if (motor === 5) {
          document.getElementById('hall_' + k.toString() + '_motor_' + motor.toString()).innerHTML = 'C'
        } else if (motor === 6) {
          document.getElementById('hall_' + k.toString() + '_motor_' + motor.toString()).innerHTML = 'H'
        }
        HCS_halls_motors_ids_array[j] = window['hall_' + k + '_motor_' + motor].id
        j++
      }
      k = k + 1
    }
  }
}

/// ////////////////////////////////////////// Connect to Server ///////////////////////////////////////////////////////////////////

function con_server() {
  sock = new WebSocket('ws://ec2-18-134-0-233.eu-west-2.compute.amazonaws.com:3000')
  sock.onopen = function (event) {
    document.getElementById('conn_server_panel').innerHTML = 'Connection to Server established'
    connection_status = true
  }

  sock.onmessage = function (event) {
    const message = JSON.parse(event.data)
    console.log(message)
    analyse_message(message)
  }

  sock.onerror = function (event) {
    document.getElementById('onerror, conn_server_panel').innerHTML = 'Server is OFF ...'
    connection_status = false
  }

  sock.onclose = function (event) {
    document.getElementById("conn_server_panel").innerHTML = 'No connection with the Server...'
    reset_message('Please, check the connection with the Server...')
    connection_status = false
  }
}

/// ///////////////////////////////////////////// Read Password //////////////////////////////////////////////////////////////////////////////////////////////

function read_pw () {
  //fullScreen()
  const user_name = document.getElementById('pwd')
  password = user_name.value
  if (connection_status) {
    sock.send(JSON.stringify({'type':'PASSWORD', 'value1': password}))
  } else {
    user_name.type = 'text'
    user_name.style.fontSize = '0.7vw'
    user_name.style.color = 'rgb(255, 0, 0)'
    user_name.value = 'Please, check the connection with the Server'
    setTimeout(function () {
      user_name.value = ''
      user_name.type = 'password'
      user_name.style.color = 'rgb(0, 0, 0)'
    }, 3000)
  }
}

/// ///////////////////////////////////////////// Choosing Zone and Hall ids //////////////////////////////////////////////////////////////////////////////////////////////
function request_data_from_server() {
  if (!connection_status) {
    reset_message('Please, check the connection with the Server...')
    return 0
  }
  const hcs_radio = document.getElementById('hcs_radio')
  const rtd_radio = document.getElementById('rtd_radio')
  const ltd_radio = document.getElementById('ltd_radio')
  const alarm_radio = document.getElementById('alarm_radio')
  const htd_radio = document.getElementById('htd_radio')
  const sd_radio = document.getElementById('sd_radio')
  const md_radio = document.getElementById('md_radio')
  const sd_date = document.getElementById('sd_date').value
  const md1_date = document.getElementById('sd_date').value
  const md2_date = document.getElementById('md_date').value

  reset_message('')
  document.getElementById('readings_time_stamp').innerHTML = ''
  const z = document.getElementById('z_selection').value
  const h = document.getElementById('h_selection').value

  if (!hcs_radio.checked) {
    if (z === '0' || h === '0') {
      reset_message('Please, enter both Zone_id and Hall_id...')
      return 0
    }

    if (alarm_radio.checked && (sd_date === '' || md2_date === '')) {
      reset_message('Please, enter a valid date...')
      return 0
    }

    if ((sd_radio.checked && sd_date === '') || (md_radio.checked && (sd_date === '' || md2_date === ''))) {
      reset_message('Please, enter a valid date...')
      return 0
    };

    if (htd_radio.checked && !sd_radio.checked && !md_radio.checked) {
      reset_message('Please, choose either Single day or Data period...')
      return 0
    }

    if (!rtd_radio.checked && !ltd_radio.checked && !htd_radio.checked && !alarm_radio.checked) {
      reset_message('Please, check either RTD, LTD, Alarm or History data input')
      return 0
    }

    document.getElementById('zone').style.color = 'rgb(51, 255, 51)'
    document.getElementById('zone').innerHTML = 'Zone_' + z
    document.getElementById('hall').style.color = 'rgb(51, 255, 51)'
    document.getElementById('hall').innerHTML = 'Hall_' + h
  }

  if (connection_status) {
    if (hcs_radio.checked) {
      sock.send(JSON.stringify({'type':'HCS', 'value1':'', 'value2':''}))
      reset_message("Waiting for sensors' data to come...")
    } else if (rtd_radio.checked) {
      sock.send(JSON.stringify({'type':'RTD', 'value1':z, 'value2':h}))
      reset_message("Waiting for sensors' data to come...")
      restart_drawing_motors_guages()
    } else if (ltd_radio.checked) {
      sock.send(JSON.stringify({'type':'LTD', 'value1':z, 'value2':h}))
      reset_message("Waiting for LTDs' data to come...")
      restart_drawing_motors_guages()
    } else if (alarm_radio.checked) {
      init_charts('table')
      sock.send(JSON.stringify({'type':'AD', 'value1':z, 'value2':h, 'value3':md1_date, 'value4': md2_date}))
      reset_message("Waiting for alarms' data to come...")
    } else if (sd_radio.checked) {
      init_charts('charts')
      sock.send(JSON.stringify({ 'type':'SDD', 'value1': z, 'value2': h, 'value3': sd_date }))
      reset_message("Waiting for SDDs' data to come...")
    } else if (md_radio.checked) {
      init_charts('table')
      sock.send(JSON.stringify({'type':'MDD', 'value1':z, 'value2':h, 'value3':md1_date, 'value4': md2_date}))
      reset_message("Waiting for MDDs' data to come...")
    }
  } else {
    document.getElementById('conn_server_panel').innerHTML = 'No connection with the Server...'
  }
}

/// ////////////////////////////////////////////////// Contorl Selection ///////////////////////////////////////////////////////////
function control_selection(v) {
  var sd_radio = document.getElementById("sd_radio")
  var md_radio = document.getElementById("md_radio")
  var sd_date = document.getElementById("sd_date")
  var md_date = document.getElementById("md_date")
  var switch_on_radio = document.getElementById("switch_on_radio")
  var switch_off_radio = document.getElementById("switch_off_radio")

  document.getElementById('switching_button').disabled = true
  document.getElementById('data_button').disabled = false
  document.getElementById('z_selection').disabled = false
  document.getElementById('h_selection').disabled = false
  document.getElementById('z_switching_selection').disabled = false
  document.getElementById('h_switching_selection').disabled = false
  document.getElementById('m_switching_selection').disabled = false

  if (v === 'RTD_RADIO' || v === 'LTD_RADIO' || v === 'HCS_RADIO') {
    if (v === 'HCS_RADIO') {
      document.getElementById('system_state').innerText = 'HCS'
      document.getElementById('z_selection').disabled = true
      document.getElementById('h_selection').disabled = true
      document.getElementById('z_switching_selection').disabled = true
      document.getElementById('h_switching_selection').disabled = true
      document.getElementById('m_switching_selection').disabled = true
    } else if (v === 'LTD_RADIO') {
      document.getElementById('system_state').innerText = 'LTD'
      init_charts('gauges')
    } else if (v === 'RTD_RADIO') {
      document.getElementById('system_state').innerText = 'RTD'
      init_charts('gauges')
    }
    if (v === 'HCS_RADIO') {
      init_charts('halls_current_state')
    } else {
      init_charts('gauges')
    }
    document.getElementById('readings_time_stamp').style.display = 'unset'
    document.getElementById('readings_time_stamp').innerText = ''
    charts_resize_flag = false
    document.getElementById('z_h_form').reset()
    document.getElementById('switching_form').reset()
    meters_temp_hum_gauges_resize_flag = true
    sd_date.value = ''
    md_date.value = ''
    sd_radio.disabled = true
    md_radio.disabled = true
    sd_radio.checked = false
    md_radio.checked = false
    sd_date.disabled = true
    md_date.disabled = true
    switch_on_radio.disabled = true
    switch_off_radio.disabled = true
    switch_on_radio.checked = false
    switch_off_radio.checked = false
  } else if (v === 'ALARM_RADIO') {
    document.getElementById('readings_time_stamp').style.display = 'none'
    document.getElementById('switching_button').disabled = true
    document.getElementById('data_button').disabled = false
    document.getElementById('system_state').innerText = 'ALARM'
    document.getElementById('z_h_form').reset()
    document.getElementById('switching_form').reset()
    meter_R_f = 0
    sd_date.value = ''
    md_date.value = ''
    sd_radio.disabled = true
    md_radio.disabled = true
    sd_radio.checked = false
    md_radio.checked = false
    sd_date.disabled = false
    md_date.disabled = false
    switch_on_radio.disabled = true
    switch_off_radio.disabled = true
    switch_on_radio.checked = false
    switch_off_radio.checked = false
    init_charts('table')
  } else if (v === 'HTD_RADIO') {
    document.getElementById('system_state').innerText = ''
    document.getElementById('readings_time_stamp').style.display = 'none'
    document.getElementById('switching_button').disabled = true
    document.getElementById('data_button').disabled = false
    reset_message('')
    meter_R_f = 0
    document.getElementById('zone').innerHTML = ''
    document.getElementById('hall').innerHTML = ''
    switch_on_radio.disabled = true
    switch_off_radio.disabled = true
    switch_on_radio.checked = false
    switch_off_radio.checked = false
    if (sd_radio.checked) {
      sd_date.disabled = false
    } else if (md_radio.checked) {
      sd_date.disabled = false
      md_date.disabled = false
    } else {
      sd_date.disabled = true
      md_date.disabled = true
      sd_radio.disabled = false
      md_radio.disabled = false
    }
  } else if (v === 'SD_RADIO') {
    document.getElementById('system_state').innerText = 'SDD'
    md_date.disabled = true
    sd_date.disabled = false
    sd_date.value = ''
    md_date.value = ''
    document.getElementById('z_h_form').reset()
    document.getElementById('switching_form').reset()
    init_charts('charts')
    meter_R_f = 0
  } else if (v === 'MD_RADIO') {
    document.getElementById('system_state').innerText = 'MDD'
    sd_date.disabled = false
    md_date.disabled = false
    sd_date.value = ''
    md_date.value = ''
    document.getElementById('z_h_form').reset()
    document.getElementById('switching_form').reset()
    init_charts('table')
    meter_R_f = 0
  } else if (v === 'MANUAL' || v === 'AUTO') {
    document.getElementById('readings_time_stamp').innerText = ''
    document.getElementById('data_button').disabled = true
    document.getElementById('switching_button').disabled = false
    document.getElementById('zone').innerHTML = ''
    document.getElementById('hall').innerHTML = ''
    document.getElementById('switching_form').reset()
    meter_R_f = 0
    sd_radio.disabled = true
    sd_radio.checked = false
    md_radio.disabled = true
    md_radio.checked = false
    if (v === 'MANUAL') {
      init_charts('gauges')
      switch_on_radio.disabled = false
      switch_off_radio.disabled = false
      document.getElementById('system_state').innerText = 'M-SWITCHING'
    } else {
      switch_on_radio.disabled = true
      switch_off_radio.disabled = true
      switch_on_radio.checked = false
      switch_off_radio.checked = false
      document.getElementById('system_state').innerText = 'A-SWITCHING'
    }
  } else if (v === 'SWITCH_ON' || v === 'SWITCH_OFF') {
    meter_R_f = 0
    document.getElementById('data_button').disabled = true
    document.getElementById('switching_button').disabled = false
    document.getElementById('switching_form').reset()
  }
}

function restart_all_controls() {
  var rtd = document.getElementById('rtd_radio')
  var ltd = document.getElementById('ltd_radio')
  var alarm = document.getElementById('alarm_radio')
  var htd = document.getElementById('htd_radio')
  var sd_radio = document.getElementById("sd_radio")
  var md_radio = document.getElementById("md_radio")
  var sd_date = document.getElementById("sd_date")
  var md_date = document.getElementById("md_date")
  var switch_on_radio = document.getElementById("switch_on_radio")
  var switch_off_radio = document.getElementById("switch_off_radio")
  var auto_switch = document.getElementById('auto_switch')
  var mode_manual = document.getElementById('mode_manual')

  rtd.checked = false
  ltd.checked = false
  alarm.checked = false
  htd.checked = false
  sd_date.value = ''
  sd_date.disabled = true
  md_date.value = ''
  md_date.disabled = true
  sd_radio.disabled = true
  sd_radio.checked = false
  md_radio.disabled = true
  md_radio.checked = false
  switch_on_radio.disabled = true
  switch_on_radio.checked = false
  switch_off_radio.disabled = true
  switch_off_radio.checked = false
  auto_switch.checked = false
  mode_manual.checked = false
  document.getElementById('z_h_form').reset()
  document.getElementById('switching_form').reset()
}

/// //////////////////////////////////////////////////////// RESTART_HALLS_REQ //////////////////////////////////////////////
function restart_halls_req() {
  restart_all_controls()
  init_charts('gauges')
  document.getElementById('yes_no_restart').style.display = 'none'
  document.getElementById('system_state').innerText = 'RESTART'
  sock.send(JSON.stringify({ type: 'RESTART_HALLS_REQ' }))
  reset_message('Send a message to restart halls\' firmware...')
  document.getElementById('readings_time_stamp').style.display = 'none'
  document.getElementById('spinner_text').innerText = 'Now restart halls...'
  document.getElementById('spinner-back').classList.add('show')
  document.getElementById('spinner-front').classList.add('show')
}

/// /////////////////////////////////////////////////////// RESTART_HALLS_RES ////////////////////////////////////////////////
function restart_halls_res (message) {
  if (message['value1'] === 'Waiting for Pi to connect') {
    reset_message('Server is waiting for the Gateway to connect...')
    document.getElementById('spinner-back').classList.remove('show')
    document.getElementById('spinner-front').classList.remove('show')
  } else if (message['value1'] === 'response_ok') {
    reset_message('Halls restart: ok')
    document.getElementById('spinner-back').classList.remove('show')
    document.getElementById('spinner-front').classList.remove('show')
  } else if (message['value1'] === 'no_response') {
    reset_message('Halls restart: no response')
    document.getElementById('spinner-back').classList.remove('show')
    document.getElementById('spinner-front').classList.remove('show')
  }
}

/// /////////////////////////////////////////////////////// UPDATE_HALLS_REQ ////////////////////////////////////////////////
function update_halls_req () {
  restart_all_controls()
  init_charts('gauges')
  document.getElementById('spinner_text').innerText = 'Now update halls...'
  document.getElementById('spinner-back').classList.add('show')
  document.getElementById('spinner-front').classList.add('show')
  document.getElementById('yes_no_update').style.display = 'none'
  document.getElementById('system_state').innerText = 'UPDATE'
  sock.send(JSON.stringify({ 'type': 'UPDATE_HALLS_REQ' }))
  reset_message('Send a message to update halls\' firmware...')
  document.getElementById('readings_time_stamp').style.display = 'none'
}

/// /////////////////////////////////////////////////////// UPDATE_HALLS_RES ////////////////////////////////////////////////
function update_halls_res (message) {
  document.getElementById('spinner_text').innerText = 'Now update halls...'
  if (message['type'] === 'UPDATE_HALLS_RES' && message['value1'] === 'Waiting for Pi to connect') {
    reset_message('Server is waiting for the Gateway to connect...')
    document.getElementById('spinner-back').classList.remove('show')
    document.getElementById('spinner-front').classList.remove('show')
  } else if (message['type'] === 'UPDATE_HALLS_RES' && message['value1'] === 'Update in progress') {
    reset_message('Halls\' firmware update in progress...')
  } else if (message['type'] === 'UPDATE_HALLS_COMPLETED') {
    reset_message('Halls\' firmware update completed...')
    document.getElementById('spinner-back').classList.remove('show')
    document.getElementById('spinner-front').classList.remove('show')
  } else if (message['type'] === 'UPDATE_HALLS_NOT_READY') {
    reset_message('Halls are not ready for update...')
    document.getElementById('spinner-back').classList.remove('show')
    document.getElementById('spinner-front').classList.remove('show')
  } else if (message['type'] === 'UPDATE_HALLS_FAILED') {
    reset_message('Halls\' firmware update failed.')
    document.getElementById('spinner-back').classList.remove('show')
    document.getElementById('spinner-front').classList.remove('show')
  }
}

/// /////////////////////////////////////////////////////// UPDATE_GATEWAY_REQ ////////////////////////////////////////////////
function update_gateway_req() {
  restart_all_controls()
  init_charts('gauges')
  document.getElementById('spinner_text').innerText = 'Now update Gateway...'
  document.getElementById('spinner-back').classList.add('show')
  document.getElementById('spinner-front').classList.add('show')
  document.getElementById('yes_no_update_gateway').style.display = 'none'
  document.getElementById('system_state').innerText = 'UPDATE Gateway'
  sock.send(JSON.stringify({ 'type': 'UPDATE_GATEWAY_REQ' }))
  reset_message('Send a message to update Gateway\'s firmware...')
  document.getElementById('readings_time_stamp').style.display = 'none'
}

/// /////////////////////////////////////////////////////// UPDATE_GATEWAY_RES ////////////////////////////////////////////////

function update_gateway_res(message) {
  init_charts('gauges')
  if (message['value1'] === 'Waiting for Pi to connect') {
    reset_message('Server is waiting for the Gateway to connect...')
  } else {
    if (message['value1'] === 'ok') {
      reset_message('Gateway\'s firmware update completed...')
    } else {
      reset_message('Gateway\'s firmware update failed...')
    }
  }
  document.getElementById('spinner-back').classList.remove('show')
  document.getElementById('spinner-front').classList.remove('show')
}

/// /////////////////////////////////////////////////// SWITCH_ON_OFF_REQ /////////////////////////////////////////////////////////////////////////////////

function switch_on_off_req () {
  const switch_on_radio = document.getElementById('switch_on_radio')
  const switch_off_radio = document.getElementById('switch_off_radio')
  const auto_switch = document.getElementById('auto_switch')
  for (let i = 0; i < 6; i++) {
    document.getElementsByClassName('motor_button')[i].style = 'display: none'
  }
  document.getElementById('display_motors_table_button').style.display = 'none'
  document.getElementById('display_environment_table_button').style.display = 'none'
  document.getElementById('download_table_button').style.display = 'none'
  document.getElementById('meter_R').style.display = 'none'

  reset_message('')
  document.getElementById('readings_time_stamp').innerHTML = ''

  const z = document.getElementById('z_switching_selection').value
  const h = document.getElementById('h_switching_selection').value
  const m = document.getElementById('m_switching_selection').value

  if (!switch_on_radio.checked && !switch_off_radio.checked && !auto_switch.checked) {
    reset_message('Please, check either Switch_ON or Switch_OFF input...')
    return 0
  }

  if (z === '0' || h === '0' || m === '0') {
    reset_message('Please, enter all Zone_id, Hall_id and Motor_id...')
    return 0
  }

  document.getElementById('zone').innerHTML = 'Zone_' + z
  document.getElementById('hall').innerHTML = 'Hall_' + h
  //document.getElementById('motor').style = 'display: unset'
  //document.getElementById('motor').innerHTML = document.getElementById('m_switching_selection')
  //  .options[document.getElementById('m_switching_selection').selectedIndex].text

  if (connection_status) {
    let node_id = (parseInt(z - 1) * 20 + parseInt(h))
    if (switch_on_radio.checked) {
      sock.send(JSON.stringify({'type':'SWITCH_ON_REQ', 'value1': node_id, 'value2': parseInt(m), 'value3': 'ON'}))
      reset_message('Send SWITCH_ON message to the Server...')
      document.getElementById('switching_button').disabled = true
    } else if (switch_off_radio.checked) {
      sock.send(JSON.stringify({'type':'SWITCH_OFF_REQ', 'value1': node_id, 'value2': parseInt(m), 'value3': 'OFF'}))
      reset_message('Send SWITCH_OFF message to the Server...')
      document.getElementById('switching_button').disabled = true
    } else if (auto_switch.checked) {
      reset_message('Send AUTO_SWITCH message to the Server')
      sock.send(JSON.stringify({'type': 'AUTO_SWITCH_REQ', 'value1': node_id, 'value2': parseInt(m)}))
    }
  } else {
    document.getElementById('conn_server_panel').innerHTML = 'No connection with the Server...'
    reset_message('Please, check the connection with the Server and retry later...')
  }
}

/// ///////////////////////////////////////////// SWITCH_ON_OFF_AUTO_RES ////////////////////////////////////////////////////////////////////

function switch_on_off_auto_res(message) {
  const node_id = message['value1']
  const motor_id = message['value2']
  const response = message['value3']
  const motor_state = message['value4']
  const operation_mode = ['f_m_mode', 'f_l_mode', 'c_a_e_mode', 'c_e_mode', 'c_mode', 'h_mode']
  const motors_on = ['f_m_on', 'f_l_on', 'c_a_e_on', 'c_e_on', 'c_on', 'h_on']
  const motors_off = ['f_m_off', 'f_l_off', 'c_a_e_off', 'c_e_off', 'c_off', 'h_off']

  let swap = { 0: 'no_response', 1: 'no_change, alarm', 2: 'reponse_ok' }

  document.getElementById('switching_button').disabled = false
  if (message['value1'] === 'Waiting for Pi to connect') {
    reset_message('Server is waiting for the Gateway to connect...')
  } else {
    if (message['type'] === 'SWITCH_ON_RES') {
      reset_message('Hall: ' + node_id.toString() + ' motor: ' + motor_id.toString() + ' switched_ON: ' + swap[response])
      if (response === 2) {
        document.getElementById(operation_mode[motor_id - 1]).innerText = 'MANUAL'
        document.getElementById(operation_mode[motor_id - 1]).style.background = 'rgb(252, 78, 78)'
        document.getElementById(motors_on[motor_id - 1]).style.opacity = 1
        document.getElementById(motors_off[motor_id - 1]).style.opacity = 0.2
      }
    } else if (message['type'] === 'SWITCH_OFF_RES') {
      reset_message('Hall: ' + node_id.toString() + ' motor: ' + motor_id.toString() + ' switched_OFF: ' + swap[response])
      if (response === 2) {
        document.getElementById(operation_mode[motor_id - 1]).innerText = 'MANUAL'
        document.getElementById(operation_mode[motor_id - 1]).style.background = 'rgb(252, 78, 78)'
        document.getElementById(motors_on[motor_id - 1]).style.opacity = 0.2
        document.getElementById(motors_off[motor_id - 1]).style.opacity = 1
      }
    } else if (message['type'] === 'AUTO_SWITCH_RES') {
      reset_message('Hall: ' + node_id.toString() + ' Motor: ' + motor_id.toString() + ' Switched_AUTO: ' + swap[response])
      if (response === 2) {
        document.getElementById(operation_mode[motor_id - 1]).innerText = 'AUTO'
        document.getElementById(operation_mode[motor_id - 1]).style.background = 'blue'
        if (motor_state) {
          document.getElementById(motors_on[motor_id - 1]).style.opacity = 1
          document.getElementById(motors_off[motor_id - 1]).style.opacity = 0.2
        } else {
          document.getElementById(motors_on[motor_id - 1]).style.opacity = 0.2
          document.getElementById(motors_off[motor_id - 1]).style.opacity = 1
        }
      }
    }
  }
}

/// ///////////////////////////////////////////// ALARM ////////////////////////////////////////////////////////////////////

function analyze_alarm_message(message) {
  let message_data = message['value1'].slice(2, message['value1'].length)
  console.log('message_data: ' + message_data)  
  let parameter = ''
  let alarm_panel_text = ''
  let parameter_value = ''
  let total_parameters = ''
  let zone_id = 0
  let hall_id = 0
  let motors = []
  motors[0] = ''
  motors[1] = ''
  motors[2] = ''
  motors[3] = ''
  motors[4] = ''
  motors[5] = ''

  zone_id = (Math.ceil(message['value1'][0] / 20)) + '\n'
  hall_id = 'Hall_ID: ' + (message['value1'][0] - (zone_id - 1) * 20) + '\n\n'
  zone_id = 'Zone_ID: ' + zone_id

  console.log(zone_id)
  console.log(hall_id)

  alarm_f = 1

  while (message_data.length > 0) {
    for (let i = 0; i <= message_data.length; i = i + 3) {
      if (message_data[i] === 1) {
        motors[0] = message_data.splice(0, i + 1)
        console.log('motors[0]: ' + motors[0])
        break
      } else if (message_data[i] === 2) {
        motors[1] = message_data.splice(0, i + 1)
        console.log('motors[1]: ' + motors[1])
        break
      } else if (message_data[i] === 3) {
        motors[2] = message_data.splice(0, i + 1)
        console.log('motors[2]: ' + motors[2])
        break
      } else if (message_data[i] === 4) {
        motors[3] = message_data.splice(0, i + 1)
        console.log('motors[3]: ' + motors[3])
        break
      } else if (message_data[i] === 5) {
        motors[4] = message_data.splice(0, i + 1)
        console.log('motors[4]: ' + motors[4])
        break
      } else if (message_data[i] === 6) {
        motors[5] = message_data.splice(0, i + 1)
        console.log('motors[5]: ' + motors[5])
        break
      }
    }
  }
  for (let j = 0; j < 6; j++) {
    if (motors[j].length > 0) {
      total_parameters = ''
      let motor_id = 'Motor_ID: ' + motors[j][motors[j].length - 1] + '\n'
      for (let i = 0; i < motors[j].length - 1; i = i + 3) {
        parameter = String.fromCharCode(motors[j][i])
        if (parameter === 'M') {
          parameter_value = 0
          parameter = 'Main Voltage: ' + parameter_value + '  ------> OFF'
        } else if (parameter === 'L') {
          parameter_value = 0
          parameter = 'Sensor buffer: ' + parameter_value + '  ------> LOW'
        } else if (parameter === 'V') {
          parameter_value = ((motors[j][i + 1] << 8) + motors[j][i + 2]) / 10.0
          if (parameter_value > 250) {
            parameter = 'Voltage: ' + parameter_value + '  ------> Over Voltage'
          } else {
            parameter = 'Voltage: ' + parameter_value + '  ------> Under Voltage'
          }
        } else if (parameter === 'I') {
          parameter_value = ((motors[j][i + 1] << 8) + motors[j][i + 2]) / 1000.0
          parameter = 'Current: ' + parameter_value + '  ------> Over Current'
        } else if (parameter === 'F') {
          parameter_value = ((motors[j][i + 1] << 8) + motors[j][i + 2]) / 10.0
          if (parameter_value > 52) {
            parameter = 'Frequency: ' + parameter_value + '  ------> Over Frequency'
          } else {
            parameter = 'Frequency: ' + parameter_value + '  ------> Under Frequency'
          }
        }
        total_parameters = total_parameters + parameter + '\n'
      }
      alarm_panel_text = alarm_panel_text + motor_id + total_parameters + '\n'
    }
  }
  document.getElementById('alarm_panel_text').innerText = zone_id + hall_id + alarm_panel_text
}

/// ///////////////////////////////////////////// FIRMWARE_FILES_REQ ////////////////////////////////////////////////////////////////////

function firmware_files_req(G_H_id, file_name) {
  init_charts('gauges')
  restart_all_controls()
  reset_message('Send FIRMWARE_FILES_REQ to Server...')
  document.getElementById('system_state').innerText = 'REQ NET PARAM'
  console.log('node_id: ' + G_H_id + '  file_name: ' + file_name)
  sock.send(JSON.stringify({ 'type': 'FIRMWARE_FILES_REQ', 'value1': G_H_id, 'value2': file_name }))
  if (G_H_id === 'G') {
    reset_message('Send a message to req a Gateway file...')
  } else {
    reset_message('Send a message to req a Hall file...')
  }
  document.getElementById('readings_time_stamp').style.display = 'none'
  document.getElementById('req_config_panel').style.width = '0%'
}

/// ///////////////////////////////////////////// FIRMWARE_FILES_RES ////////////////////////////////////////////////////////////////////

function firmware_files_res(msg) {
  let new_file_contents = ''
  if (msg['value1'] === 'Waiting for Pi to connect') {
    reset_message('Server is waiting for the Gateway to connect...')
  } else if (msg['value3'] === 'ok') {
    reset_message("Receiving firmware's file: ok")
    let file_contents = msg['value2']
    for (let i = 0; i < file_contents.length; i++) {
      if (file_contents[i] === '\n') {
        new_file_contents = new_file_contents + '\r\n'
      } else {
        new_file_contents = new_file_contents + file_contents[i]
      }
    }
    //console.log(new_file_contents)
    let date_time = new Date()
    date_time = date_time.getDate() + '-' + (date_time.getMonth() + 1) + '-' + date_time.getFullYear() + ' ' + date_time.getHours() + '-' + date_time.getMinutes()
    let filename = msg['value1'] + ' ' + date_time + '.txt'

    link = document.createElement("a")
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(new_file_contents))
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else if (msg['value3'] === 'failed') {
    reset_message('Receiving firmwares\' file: failed')
  } else if (msg['value3'] === 'not_ready') {
    reset_message('Hall is not ready ready to send the file...')
  }
}

/// //////////////////////////////////////////////// ENFORCE_SYNC_REQ ///////////////////////////////////////////////////////////////////////////////////
function enforce_sync_req() {
  restart_all_controls()
  init_charts('gauges')
  document.getElementById('yes_no_enforce_sync').style.display = 'none'
  document.getElementById('system_state').innerText = 'ENFORCE SYNC'
  sock.send(JSON.stringify({ type: 'ENFORCE_SYNC_REQ' }))
  reset_message("Send a message to sync. halls' clocks...")
  document.getElementById('readings_time_stamp').style.display = 'none'
  document.getElementById('spinner_text').innerText = "Now sync halls' clocks..."
  document.getElementById('spinner-back').classList.add('show')
  document.getElementById('spinner-front').classList.add('show')
}

/// /////////////////////////////////////////////////////// ENFORCE_SYNC_RES ////////////////////////////////////////////////
function enforce_sync_res (message) {
  if (message['value1'] === 'Waiting for Pi to connect') {
    reset_message('Server is waiting for the Gateway to connect...')
  } else if (message['value1'] === 'sync_ok') {
    reset_message('Halls clocks Synchronization: ok')
  } else if (message['value1'] === 'sync_failed') {
    reset_message('Halls clocks Synchronization: failed')
  }
  document.getElementById('spinner-back').classList.remove('show')
  document.getElementById('spinner-front').classList.remove('show')
}

/// //////////////////////////////////////////////// analyse_message /////////////////////////////////////////////////////////////////////////////////////
function analyse_message (message) {
  if (message['type'] === 'HCS_RES') {
    hcs_res(message)
  } else if (message['type'] === 'RTD_RES' || message['type'] === 'LTD_RES') {
    rtd_ltd_res(message)
  } else if (message['type'] === 'AD_RES') {
    ad_res(message)
  } else if (message['type'] === 'SDD_RES') {
    sdd_res(message)
  } else if (message['type'] === 'MDD_RES') {
    mdd_res(message)
  } else if (message['type'] === 'PASSWORD_RES') {
    password_res(message)
  } else if (message['type'] === 'RESTART_HALLS_RES') {
    restart_halls_res(message)
  } else if (message['type'] === 'UPDATE_HALLS_RES' || message['type'] === 'UPDATE_HALLS_COMPLETED' || message['type'] === 'UPDATE_HALLS_FAILED' || message['type'] === 'UPDATE_HALLS_NOT_READY') {
    update_halls_res(message)
  } else if (message['type'] === 'SWITCH_ON_RES' || message['type'] === 'SWITCH_OFF_RES' || message['type'] === 'SWITCH_ON_OFF_AUTO_RES' || message['type'] === 'AUTO_SWITCH_RES') {
    switch_on_off_auto_res(message)
  } else if (message['type'] === 'ALARM') {
    document.getElementById('alarm').innerText = 'ALARM'
    document.getElementById('alarm').style.animationPlayState = 'running'
    analyze_alarm_message(message)
  } else if (message['type'] === 'FIRMWARE_FILES_RES') {
    firmware_files_res(message)
  } else if (message['type'] === 'ENFORCE_SYNC_RES') {
    enforce_sync_res(message)
  } else if (message['type'] === 'UPDATE_GATEWAY_RES') {
    update_gateway_res(message)
  } else if (message['type'] === 'CONFIRM_CONNECTION') {
    confirm_connection()
  }
}

/// ////////////////////////////////////////////////////////////// CONFIRM_CONNECTION ///////////////////////////////////////////////////////////////////////////////
function confirm_connection() {
  if (password_priority === 'ADMIN') {
    sock.send(JSON.stringify({ 'type': 'ADMIN_OPERATOR_ON', 'value1': 'ADMIN'}))
  } else if (password_priority === 'OPERATOR') {
    sock.send(JSON.stringify({ 'type': 'ADMIN_OPERATOR_ON', 'value1': 'OPERATOR'}))
  }
  //reset_message('Receive CONFIRM_CONNECTION msg')
}

/// ////////////////////////////////////////////////////////////// HCS_RES ///////////////////////////////////////////////////////////////////////////////
function hcs_res(message) {
  if (message['type'] === 'HCS_RES' && message['value1'] === 'Waiting for Pi to connect') {
    reset_message(message['value2'])
  } else {
    reset_message('Receiving Halls current states (HCS)...')
    console.log('HCS data')
    console.log('Hall id: ', message.value3)
    console.log('Motors data: ' + message.value1)
    //console.log('Temp_Hum data: ' + message.value2)
    let hall_id = message.value3
    let hcs_motors = message.value1
    document.getElementById('readings_time_stamp').innerText = hcs_motors[0].date_time
    for (let i = 0; i < hcs_motors.length; i++) {
      console.log('motor_id: ' + hcs_motors[i].motor_id + '   voltage: ' + hcs_motors[i].voltage + '   motor_state: ' + hcs_motors[i].motor_state)
      if (hcs_motors[i].motor_state) {
        document.getElementById('hall_' + hall_id.toString() + '_motor_' + hcs_motors[i].motor_id).style.background = 'rgb(2, 226, 2)'
      } else {
        if (hcs_motors[i].voltage > 250 || hcs_motors[i].voltage < 170) {
          document.getElementById('hall_' + hall_id.toString() + '_motor_' + hcs_motors[i].motor_id).style.background = 'rgb(255, 179, 0)'
        } else {
          document.getElementById('hall_' + hall_id.toString() + '_motor_' + hcs_motors[i].motor_id).style.background = 'rgb(255, 53, 53)'
        }
      }
    }
  }
}

/// ////////////////////////////////////////////////////////////// RTD_LTD_RES ///////////////////////////////////////////////////////////////////////////////
function rtd_ltd_res (message) {
  restart_drawing_motors_guages()
  if (message['type'] === 'RTD_RES' && message['value1'] === 'Waiting for Pi to connect') {
    reset_message(message['value2'])
    return 0
  }

  if (message['type'] === 'LTD_RES' && message['value1'] === 'No data') {
    reset_message('No data for this hall in the databases !!!')
    return 0
  }

  if (message['type'] === 'RTD_RES') {
    reset_message('Receiving Real Time Data (RTD)...')
  } else {
    reset_message('Receiving last reading in the database (LTD) ...')
  }

  document.getElementById('readings_time_stamp').classList.remove('readings_time_stamp')
  document.getElementById('readings_time_stamp').classList.add('readings_time_stamp_b')
  setTimeout(function () {
    document.getElementById('readings_time_stamp').classList.remove('readings_time_stamp_b')
    document.getElementById('readings_time_stamp').classList.add('readings_time_stamp')
  }, 2000)

  meter_R_f = 1
  let motors_on_array = []
  let motors_off_array = []
  const all_motors_array = [1, 2, 3, 4, 5, 6]
  
  motors_current_data = [f_m_currentData, f_l_currentData, c_a_e_currentData, c_e_currentData, c_currentData, h_currentData]
  let motors_current_chart = [f_m_currentChart, f_l_currentChart, c_a_e_currentChart, c_e_currentChart, c_currentChart, h_currentChart]

  motors_voltage_data = [f_m_voltageData, f_l_voltageData, c_a_e_voltageData, c_e_voltageData, c_voltageData, h_voltageData]
  const motors_voltage_chart = [f_m_voltageChart, f_l_voltageChart, c_a_e_voltageChart, c_e_voltageChart, c_voltageChart, h_voltageChart]

  motors_power_data = [f_m_powerData, f_l_powerData, c_a_e_powerData, c_e_powerData, c_powerData, h_powerData]
  let motors_power_chart = [f_m_powerChart, f_l_powerChart, c_a_e_powerChart, c_e_powerChart, c_powerChart, h_powerChart]

  motors_energy_data = [f_m_energyData, f_l_energyData, c_a_e_energyData, c_e_energyData, c_energyData, h_energyData]
  let motors_energy_chart = [f_m_energyChart, f_l_energyChart, c_a_e_energyChart, c_e_energyChart, c_energyChart, h_energyChart]

  motors_power_factor_data = [f_m_power_factorData, f_l_power_factorData, c_a_e_power_factorData, c_e_power_factorData, c_power_factorData, h_power_factorData]
  let motors_power_factor_chart = [f_m_power_factorChart, f_l_power_factorChart, c_a_e_power_factorChart, c_e_power_factorChart, c_power_factorChart, h_power_factorChart]

  motors_frequency_data = [f_m_frequencyData, f_l_frequencyData, c_a_e_frequencyData, c_e_frequencyData, c_frequencyData, h_frequencyData]
  const motors_frequency_chart = [f_m_frequencyChart, f_l_frequencyChart, c_a_e_frequencyChart, c_e_frequencyChart, c_frequencyChart, h_frequencyChart]

  const motors_on = ['f_m_on', 'f_l_on', 'c_a_e_on', 'c_e_on', 'c_on', 'h_on']
  const motors_off = ['f_m_off', 'f_l_off', 'c_a_e_off', 'c_e_off', 'c_off', 'h_off']
  const operation_mode = ['f_m_mode', 'f_l_mode', 'c_a_e_mode', 'c_e_mode', 'c_mode', 'h_mode']
  
  document.getElementById('linear_gauge').setAttribute('data-value', 0)
  document.getElementById('radial_gauge').setAttribute('data-value', 0)

  let rtd_motors = message.value1
  let rtd_temp_hum = message.value2
  console.log('rtd_motors: ' + rtd_motors)

  for (let i = 0; i < rtd_motors.length; i++) {
    motors_current_data[rtd_motors[i].motor_id - 1].setValue(0, 1, rtd_motors[i].current)
    motors_current_chart[rtd_motors[i].motor_id - 1].draw(motors_current_data[rtd_motors[i].motor_id - 1], currentOptions)

    motors_voltage_data[rtd_motors[i].motor_id - 1].setValue(0, 1, rtd_motors[i].voltage)
    motors_voltage_chart[rtd_motors[i].motor_id - 1].draw(motors_voltage_data[rtd_motors[i].motor_id - 1], voltageOptions)
     

    motors_power_data[rtd_motors[i].motor_id - 1].setValue(0, 1, rtd_motors[i].power)
    motors_power_chart[rtd_motors[i].motor_id - 1].draw(motors_power_data[rtd_motors[i].motor_id - 1], powerOptions)

    motors_energy_data[rtd_motors[i].motor_id - 1].setValue(0, 1, rtd_motors[i].energy)
    motors_energy_chart[rtd_motors[i].motor_id - 1].draw(motors_energy_data[rtd_motors[i].motor_id - 1], energyOptions)

    motors_power_factor_data[rtd_motors[i].motor_id - 1].setValue(0, 1, rtd_motors[i].power_factor)
    motors_power_factor_chart[rtd_motors[i].motor_id - 1].draw(motors_power_factor_data[rtd_motors[i].motor_id - 1], power_factorOptions)

    motors_frequency_data[rtd_motors[i].motor_id - 1].setValue(0, 1, rtd_motors[i].frequency)
    motors_frequency_chart[rtd_motors[i].motor_id - 1].draw(motors_frequency_data[rtd_motors[i].motor_id - 1], frequencyOptions)

    if (rtd_motors[i].motor_state === 1) {
      document.getElementById(motors_off[i]).style.opacity = 0.2
      document.getElementById(motors_on[i]).style.opacity = 1
      motors_on_array.push(rtd_motors[i].motor_id)
    } else {
      document.getElementById(motors_off[i]).style.opacity = 1
      document.getElementById(motors_on[i]).style.opacity = 0.2
      motors_off_array.push(rtd_motors[i].motor_id)
    }

    if (rtd_motors[i].operation_mode === 1) {
      document.getElementById(operation_mode[i]).style.background = 'rgb(252, 78, 78)'
      document.getElementById(operation_mode[i]).innerText = 'MANUAL'
    } else {
      document.getElementById(operation_mode[i]).style.background = 'blue'
      document.getElementById(operation_mode[i]).innerText = 'AUTO'
    }
  }

  console.log('motors_on_array[]: ' + motors_on_array)
  console.log('motors_off_array[]: ' + motors_off_array)

  console.log('rtd_temp_hum: ' + rtd_temp_hum)
  if (rtd_temp_hum.length !== 0) {
    document.getElementById('linear_gauge').setAttribute('data-value', rtd_temp_hum[0].temperature)
    document.getElementById('radial_gauge').setAttribute('data-value', rtd_temp_hum[0].humidity)
    document.getElementById('readings_time_stamp').style.display = 'unset'
    document.getElementById('readings_time_stamp').innerText = rtd_temp_hum[0].date_time
  } else {
    console.log('Temp_Hum data are empty')
  }
}

/// ///////////////////////////////////////////////////////////////// AD_RES //////////////////////////////////////////////////////////////////
function ad_res (message) {
  console.log('alarm table is received')
  ad = []
  const alarm_table = document.getElementById('alarm_table')
  const alarmsRowCount = alarm_table.rows.length  
  
  if (message['value1'] === 'No data') {
    selected_table_flag = ''    
    document.getElementById('download_table_button').style.display = 'none'   
    reset_message('No data for this hall in the databases !!!')
    return 0
  } 
  
  document.getElementById('download_table_button').style.display = 'unset'  
  
  ad = message['value1']
  displayTable('alarm_table')   
}

/// ///////////////////////////////////////////////////////////////// SDD_RES ///////////////////////////////////////////////////////////////
function sdd_res(message) {
  if (message['value1'] === 'No data') {
    sdd_motors = []
    reset_message('No data for this hall in the databases !!!')
    global_f = 0
    for (let i = 0; i < 6; i++) {
      document.getElementsByClassName('motor_button')[i].style = 'display: none'
    }
    charts_resize_flag = true
    return 0
  }

  charts_resize_flag = true
  global_f = 0
  reset_message('Please, choose one of the motors to show its data')

  for (let i = 0; i < 6; i++) {
    document.getElementsByClassName('motor_button')[i].style = 'display: unset'
  }

  sdd_motors = message.value1
  sdd_temp_hum = message.value2
  console.log(sdd_motors)
  console.log(sdd_temp_hum)

  document.getElementById('readings_time_stamp').style.paddingTop = '0.6%'
  document.getElementById('readings_time_stamp').innerHTML = sdd_motors[0].date_time.split(' ', 1)
}

/// ///////////////////////////////////////////////////////////////// MDD_RES //////////////////////////////////////////////////////////////////
function mdd_res (message) {
  if (message['value1'] === 'No data' && message['value2'] === 'No data') {
    selected_table_flag = ''
    document.getElementById('display_motors_table_button').style.display = 'none'
    document.getElementById('display_environment_table_button').style.display = 'none'
    document.getElementById('download_table_button').style.display = 'none'
    reset_message('No data for this hall in the databases !!!')
    return 0
  }

  if (message['value1'] === 'No data') {
    mdd_motors = []
    mdd_temp_hum = message['value2']
    const motors_table = document.getElementById('motors_table')
    const motorsRowCount = motors_table.rows.length
    for (let i = 1; i < motorsRowCount; i++) {
      motors_table.deleteRow(i)
    }
  }

  if (message['value2'] === 'No data') {
    mdd_temp_hum = []
    mdd_motors = message['value1']
    const environment_table = document.getElementById('environment_table')
    const environmentRowCount = environment_table.rows.length
    for (let i = 1; i < environmentRowCount; i++) {
      environment_table.deleteRow(i)
    }
  }

  if (message['value1'] !== 'No data' && message['value2'] !== 'No data') {
    mdd_motors = message.value1
    mdd_temp_hum = message.value2
    console.log(mdd_motors)
    console.log(mdd_temp_hum)
  }

  document.getElementById('display_motors_table_button').style.display = 'unset'
  document.getElementById('display_environment_table_button').style.display = 'unset'
  document.getElementById('download_table_button').style.display = 'unset'
  reset_message('Please, choose one table to display...')  
}

/// ////////////////////////////////////////////////////// PASSWORD_RES /////////////////////////////////////////////////
function password_res (message) {
  const password_res = message['value1']
  password_priority = message['value2']
  if (password_res === 'correct' && password_priority === 'ADMIN') {    
    document.getElementById('system_state').innerText = 'RTD'
    console.log('Password is accepted with ADMIN priority')
    document.getElementById('user_login').innerHTML = 'LOGIN: {' + password_priority + '}'
    document.getElementById('mask').style.display = 'none'
    document.getElementById('user_name').style.display = 'none'
    document.getElementById('main_switching_container').style.display = 'block'
    document.getElementById('alarm').style.display = 'unset'
  } else if (password_res === 'correct' && password_priority === 'OPERATOR') {
    document.getElementById('system_state').innerText = 'RTD'
    console.log('Password is accepted with OPERATOR priority')
    document.getElementById('user_login').innerHTML = 'LOGIN: {' + password_priority + '}'
    document.getElementById('mask').style.display = 'none'
    document.getElementById('user_name').style.display = 'none'
    document.getElementById('main_switching_container').style.display = 'block'    
    document.getElementById('update_halls_container').style.display = 'none'
    document.getElementById('alarm').style.display = 'unset'
  } else if (password_res === 'correct' && password_priority === 'USER') {
    document.getElementById('system_state').innerText = 'RTD'
    console.log('Password is accepted with USER priority')
    document.getElementById('user_login').innerHTML = 'LOGIN: {' + password_priority + '}'
    document.getElementById('mask').style.display = 'none'
    document.getElementById('user_name').style.display = 'none'
    document.getElementById('alarm').style.display = 'none'
  } else if (password_res === 'wrong' || password_res === 'not_allowed_admin' || password_res === 'not_allowed_operator') {
    const user_name = document.getElementById('pwd')
    user_name.type = 'text'
    user_name.style.color = 'rgb(90, 90, 90)'
    user_name.value = password_priority
    setTimeout(function () {
      user_name.value = ''
      user_name.type = 'password'
      user_name.style.color = 'rgb(0, 0, 0)'
    }, 2000)
  }
}


/// //////////////////////////////////////////////////////// init_charts /////////////////////////////////////////////////////////////
function init_charts (selection) {
  meters_temp_hum_gauges_resize_flag = false
  if (selection === 'halls_current_state') {
    reset_message('')
    sdd_motors = []
    charts_resize_flag = false
    for (let i = 0; i < 6; i++) {
      document.getElementsByClassName('motor_button')[i].style.display = 'none'
    }
    document.getElementById('hall_current_state_main_container').style.display = 'unset'
    document.getElementById('charts_main_container').style.display = 'none'
    document.getElementById('motors_table').style.display = 'none'
    document.getElementById('environment_table').style.display = 'none'
    document.getElementById('display_motors_table_button').style.display = 'none'
    document.getElementById('display_environment_table_button').style.display = 'none'
    document.getElementById('download_table_button').style = 'display: none'
    document.getElementById('zone').innerHTML = ''
    document.getElementById('hall').innerHTML = ''

    
    document.getElementById('gauges_main_container').style.display = 'none'
    document.getElementById('readings_time_stamp').style.display = 'unset'
  }
  if (selection === 'gauges') {
    reset_message('')
    charts_resize_flag = false
    for (let i = 0; i < 6; i++) {
      document.getElementsByClassName('motor_button')[i].style.display = 'none'
    }
    document.getElementById('hall_current_state_main_container').style.display = 'none'
    document.getElementById('charts_main_container').style.display = 'none'
    document.getElementById('motors_table').style.display = 'none'
    document.getElementById('environment_table').style.display = 'none'
    document.getElementById('display_motors_table_button').style.display = 'none'
    document.getElementById('display_environment_table_button').style.display = 'none'
    document.getElementById('download_table_button').style.display = 'none'
    document.getElementById('zone').innerHTML = ''
    document.getElementById('hall').innerHTML = ''

    restart_drawing_motors_guages()    
    document.getElementById('gauges_main_container').style = 'display: unset'
    document.getElementById('readings_time_stamp').style.display = 'unset'    
  } else if (selection === 'charts') {
    reset_message('')
    sdd_motors = []
    charts_resize_flag = true    
    document.getElementById('gauges_main_container').style.display = 'none'
    document.getElementById('hall_current_state_main_container').style.display = 'none'
    document.getElementById('charts_main_container').style = 'display: unset'

    document.getElementById('motors_table').style = 'display: none'
    document.getElementById('environment_table').style = 'display: none'
    document.getElementById('display_motors_table_button').style.display = 'none'
    document.getElementById('display_environment_table_button').style.display = 'none'
    document.getElementById('download_table_button').style.display = 'none'
    document.getElementById('readings_time_stamp').style.display = 'none'
    for (let i = 0; i < 6; i++) {
      document.getElementsByClassName('motor_button')[i].style.display = 'none'
    }
    global_f = 0
    motor_selection = 0
    reset_line_charts()
    drawLineChart()
  } else if (selection === 'table') {
    selected_table_flag = ''
    reset_message('')
    document.getElementById('hall_current_state_main_container').style.display = 'none'
    document.getElementById('gauges_main_container').style.display = 'none'
    document.getElementById('charts_main_container').style.display = 'none'
    document.getElementById('readings_time_stamp').style.display = 'none'
    document.getElementById('display_motors_table_button').style.display = 'none'
    document.getElementById('display_environment_table_button').style.display = 'none'
    document.getElementById('download_table_button').style = 'display: none'
    free_tables();
    for (let i = 0; i < 6; i++) {
      document.getElementsByClassName('motor_button')[i].style.display = 'none'
    }    
  }
}

function free_tables() {  
  let rowCount = 0
  document.getElementById('motors_table').style.display = 'none'
  const motors_table = document.getElementById('motors_table')
  rowCount = motors_table.rows.length
  for (let i = 1; i < rowCount; i++) {
    motors_table.deleteRow(1)
  }
  document.getElementById('environment_table').style.display = 'none'
  const environment_table = document.getElementById('environment_table')
  rowCount = environment_table.rows.length
  for (let i = 1; i < rowCount; i++) {
    environment_table.deleteRow(1)
  }
  document.getElementById('alarm_table').style.display = 'none'
  const alarm_table = document.getElementById('alarm_table')
  rowCount = alarm_table.rows.length
  for (let i = 1; i < rowCount; i++) {
    alarm_table.deleteRow(1)
  }  
}

/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function reset_message (message) {
  document.getElementById('messages').innerText = message
}

/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function reset_motors_buttons () {
  for (let i = 0; i < 6; i++) {
    document.getElementsByClassName('motor_button')[i].style.color = 'rgb(251, 255, 0)'
    document.getElementsByClassName('motor_button')[i].style.backgroundColor = 'rgb(41, 41, 41)'
  }
}

/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function reset_line_charts() {
  document.getElementById('line_chart_current').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_voltage').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_power').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_energy').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_power_factor').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_frequency').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_spare1').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_spare2').style = 'width:33%; height:32.7%'
  document.getElementById('line_chart_spare3').style = 'width:33%; height:32.7%'
  
  document.getElementById('line_chart_current').style.display = 'unset'
  document.getElementById('line_chart_voltage').style.display = 'unset'
  document.getElementById('line_chart_power').style.display = 'unset'
  document.getElementById('line_chart_energy').style.display = 'unset'
  document.getElementById('line_chart_power_factor').style.display = 'unset'
  document.getElementById('line_chart_frequency').style.display = 'unset'
  document.getElementById('line_chart_spare1').style.display = 'unset'
  document.getElementById('line_chart_spare2').style.display = 'unset'
  document.getElementById('line_chart_spare3').style.display = 'unset'
}

/// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function show_line_charts (id_text, id) {
  reset_motors_buttons()
  document.getElementById(id_text).style.color = '#ff0000'
  document.getElementById(id_text).style.backgroundColor = '#ffe6f9'
  reset_message(id_text)  
  reset_line_charts()
  global_f = id
  motor_selection = 0
  drawLineChart()
}

/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function enlarge_line_chart(m_s) {
  motor_selection = m_s
  if (motor_selection && global_f) {
    document.getElementById('line_chart_current').style.display = 'none'
    document.getElementById('line_chart_voltage').style.display = 'none'
    document.getElementById('line_chart_power').style.display = 'none'
    document.getElementById('line_chart_energy').style.display = 'none'
    document.getElementById('line_chart_power_factor').style.display = 'none'
    document.getElementById('line_chart_frequency').style.display = 'none'
    document.getElementById('line_chart_spare1').style.display = 'none'
    document.getElementById('line_chart_spare2').style.display = 'none'
    document.getElementById('line_chart_spare3').style.display = 'none'
    if (motor_selection === 1) {
      document.getElementById('line_chart_current').style = 'width:100%; height:100%'
    } else if ( motor_selection === 2) {
      document.getElementById('line_chart_voltage').style = 'width:100%; height:100%'
    } else if ( motor_selection === 3) {
      document.getElementById('line_chart_power').style = 'width:100%; height:100%'
    } else if ( motor_selection === 4) {
      document.getElementById('line_chart_energy').style = 'width:100%; height:100%'
    } else if ( motor_selection === 5) {
      document.getElementById('line_chart_power_factor').style = 'width:100%; height:100%'
    } else if ( motor_selection === 6) {
      document.getElementById('line_chart_frequency').style = 'width:100%; height:100%'
    }
    drawLineChart()
  } /*else {
    document.getElementById('line_chart_current').style.display = 'none'
    document.getElementById('line_chart_voltage').style.display = 'none'
    document.getElementById('line_chart_power').style.display = 'none'
    document.getElementById('line_chart_energy').style.display = 'none'
    document.getElementById('line_chart_power_factor').style.display = 'none'
    document.getElementById('line_chart_frequency').style.display = 'none'
    document.getElementById('line_chart_spare1').style.display = 'none'
    document.getElementById('line_chart_spare2').style.display = 'none'
    document.getElementById('line_chart_spare3').style.display = 'none'
  }*/
  
}

/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resize_meters_temp_humidity_gauges () {
  const meter_width = window.innerWidth / 17.45
  const meter_height = window.innerHeight / 8

  currentOptions.width = meter_width
  currentOptions.height = meter_height
  voltageOptions.width = meter_width
  voltageOptions.height = meter_height 

  powerOptions.width = meter_width
  powerOptions.height = meter_height
  energyOptions.width = meter_width
  energyOptions.height = meter_height 

  power_factorOptions.width = meter_width
  power_factorOptions.height = meter_height
  frequencyOptions.width = meter_width
  frequencyOptions.height = meter_height

  f_m_currentChart.draw(f_m_currentData, currentOptions);
  f_m_voltageChart.draw(f_m_voltageData, voltageOptions);
  f_m_powerChart.draw(f_m_powerData, powerOptions);
  f_m_energyChart.draw(f_m_energyData, energyOptions);
  f_m_power_factorChart.draw(f_m_power_factorData, power_factorOptions);
  f_m_frequencyChart.draw(f_m_frequencyData, frequencyOptions);

  f_l_currentChart.draw(f_l_currentData, currentOptions);
  f_l_voltageChart.draw(f_l_voltageData, voltageOptions);
  f_l_powerChart.draw(f_l_powerData, powerOptions);
  f_l_energyChart.draw(f_l_energyData, energyOptions);
  f_l_power_factorChart.draw(f_l_power_factorData, power_factorOptions);
  f_l_frequencyChart.draw(f_l_frequencyData, frequencyOptions); 

  c_a_e_currentChart.draw(c_a_e_currentData, currentOptions);
  c_a_e_voltageChart.draw(c_a_e_voltageData, voltageOptions);
  c_a_e_powerChart.draw(c_a_e_powerData, powerOptions);
  c_a_e_energyChart.draw(c_a_e_energyData, energyOptions);
  c_a_e_power_factorChart.draw(c_a_e_power_factorData, power_factorOptions);
  c_a_e_frequencyChart.draw(c_a_e_frequencyData, frequencyOptions); 

  c_e_currentChart.draw(c_e_currentData, currentOptions);
  c_e_voltageChart.draw(c_e_voltageData, voltageOptions);
  c_e_powerChart.draw(c_e_powerData, powerOptions);
  c_e_energyChart.draw(c_e_energyData, energyOptions);
  c_e_power_factorChart.draw(c_e_power_factorData, power_factorOptions);
  c_e_frequencyChart.draw(c_e_frequencyData, frequencyOptions);  

  c_currentChart.draw(c_currentData, currentOptions);
  c_voltageChart.draw(c_voltageData, voltageOptions);
  c_powerChart.draw(c_powerData, powerOptions);
  c_energyChart.draw(c_energyData, energyOptions);
  c_power_factorChart.draw(c_power_factorData, power_factorOptions);
  c_frequencyChart.draw(c_frequencyData, frequencyOptions); 

  h_currentChart.draw(h_currentData, currentOptions);
  h_voltageChart.draw(h_voltageData, voltageOptions);
  h_powerChart.draw(h_powerData, powerOptions);
  h_energyChart.draw(h_energyData, energyOptions);
  h_power_factorChart.draw(h_power_factorData, power_factorOptions);
  h_frequencyChart.draw(h_frequencyData, frequencyOptions);               


  const radial_gauge = document.getElementById("radial_gauge");
  const linear_gauge = document.getElementById("linear_gauge");

  const width_radial_gauge = window.innerWidth / 9.5;
  const height_radial_gauge = window.innerHeight / 5.5;

  const width_linear_gauge = window.innerWidth / 16;
  const height_linear_gauge = window.innerHeight / 4;

  radial_gauge.setAttribute('data-width', width_radial_gauge);
  radial_gauge.setAttribute('data-height', height_radial_gauge);
  linear_gauge.setAttribute('data-width', width_linear_gauge);
  linear_gauge.setAttribute('data-height', height_linear_gauge);
}

/// ////////////////////////////////////////////////////////////// display table() ///////////////////////////////////////////////////////////////////

function displayTable(id) {
  free_tables(); 
  selected_table_flag = id;
  let number_of_readings = 0;
  if (id === 'motors_table') {
    if (mdd_motors.length === 0){
      reset_message('No motors data for this hall in the database !!!')
      return 0
    }          
    document.getElementById('environment_table').style.display = 'none'
    let motors_table = document.getElementById('motors_table')    
    motors_table.style.display = 'unset';
    number_of_readings = mdd_motors.length;
    for (let i = 0; i < mdd_motors.length; i++) {
      let row = motors_table.insertRow(i + 1)
      let id = row.insertCell(0)
      let zone_cell = row.insertCell(1)
      let hall_cell = row.insertCell(2)
      let motor_id_cell = row.insertCell(3)
      let motor_state_cell = row.insertCell(4)
      let operation_mode_cell = row.insertCell(5)
      let voltage_cell = row.insertCell(6)
      let current_cell = row.insertCell(7)      
      let power_cell = row.insertCell(8)
      let energy_cell = row.insertCell(9)
      let power_factor_cell = row.insertCell(10)
      let frequency_cell = row.insertCell(11)
      let date_time_cell = row.insertCell(12)

      id.innerHTML = i + 1
      if (mdd_motors[i].motor_state) {
        motor_state_cell.innerHTML = 'ON'        
      } else {
        motor_state_cell.innerHTML = 'OFF'
      }

      if (mdd_motors[i].operation_mode) {
        operation_mode_cell.innerText = 'MANUAL'
      } else {
        operation_mode_cell.innerHTML = 'AUTO'
      }
      
      zone_cell.innerHTML = mdd_motors[i].zone_id
      hall_cell.innerHTML = mdd_motors[i].hall_id
      motor_id_cell.innerHTML = mdd_motors[i].motor_id      
      voltage_cell.innerHTML = mdd_motors[i].voltage      
      current_cell.innerHTML = mdd_motors[i].current      
      power_cell.innerHTML = mdd_motors[i].power
      energy_cell.innerHTML = mdd_motors[i].energy
      power_factor_cell.innerHTML = mdd_motors[i].power_factor
      frequency_cell.innerHTML = mdd_motors[i].frequency
      date_time_cell.innerHTML = mdd_motors[i].date_time

      if (mdd_motors[i].voltage ===0 && mdd_motors[i].current === 0 && mdd_motors[i].frequency === 0 ) {
        row.style.background = '#f7a8a8'
      }
    }
  } else if (id === 'environment_table') { 
    if (mdd_temp_hum.length === 0){
      reset_message('No environment_table data for this hall in the database !!!')
      return 0
    }      
    document.getElementById('motors_table').style.display = 'none'
    let environment_table = document.getElementById('environment_table')     
    environment_table.style.display = 'unset'
    number_of_readings = mdd_temp_hum.length   
    for (let i = 0; i < mdd_temp_hum.length; i++) {
      row = environment_table.insertRow(i + 1)
      id = row.insertCell(0)
      zone_cell = row.insertCell(1)
      hall_cell = row.insertCell(2)
      let temprature_cell = row.insertCell(3)
      let humidity_cell = row.insertCell(4)
      let air_quality_cell = row.insertCell(5)
      let date_time_cell = row.insertCell(6)      

      id.innerHTML = i + 1
      zone_cell.innerHTML = mdd_temp_hum[i].zone_id
      hall_cell.innerHTML = mdd_temp_hum[i].hall_id
      temprature_cell.innerHTML = mdd_temp_hum[i].temperature
      humidity_cell.innerHTML = mdd_temp_hum[i].humidity
      air_quality_cell.innerHTML = mdd_temp_hum[i].air_quality      
      date_time_cell.innerHTML = mdd_temp_hum[i].date_time
    }
  } else if (id === 'alarm_table') { 
    if (ad.length === 0){
      reset_message('No alarm data for this hall in the database !!!')
      return 0
    }      
    
    let alarm_table = document.getElementById('alarm_table')     
    alarm_table.style.display = 'unset'
    number_of_readings = ad.length  
    for (let i = 0; i < number_of_readings; i++) {
      row = alarm_table.insertRow(i + 1)
      id = row.insertCell(0)
      let zone_cell = row.insertCell(1)
      let hall_cell = row.insertCell(2)
      let alarm_details_cell = row.insertCell(3)   
      let date_time_cell = row.insertCell(4)      

      id.innerHTML = i + 1
      zone_cell.innerHTML = ad[i].zone_id
      hall_cell.innerHTML = ad[i].hall_id
      alarm_details_cell.innerHTML = ad[i].alarm_details           
      date_time_cell.innerHTML = ad[i].date_time
    }
  }
  reset_message(number_of_readings + ' data records have been found ...')
}

/// /////////////////////////////////////////////////////////////////// exportToExcel() function //////////////////////////////////////////////////

function exportToExcel(filename = '') {  
  if (selected_table_flag == '') {
    reset_message('Please, choose one table to display...')
    return 0
  } 
  var table = document.getElementById(selected_table_flag);  
  var url = '' 
  var filename = ''
  var date_time = new Date();
  date_time = date_time.getDate() + '-' + (date_time.getMonth() + 1) + '-' + date_time.getFullYear() + ' ' + date_time.getHours() + '.' + date_time.getMinutes();

  if (selected_table_flag == 'alarm_table') {
    var cell_details = ''
    var new_cell_details = ''
    for (let j = 1; j < table.rows.length; j++) {      
      cell_details = table.rows[j].cells[3].innerHTML;
      new_cell_details = ''
      for(let i = 0; i < cell_details.length; i++) {      
        if (cell_details[i].charCodeAt(0) == 10) {        
          new_cell_details = new_cell_details + '<BR>'        
        } else {
          new_cell_details = new_cell_details + cell_details[i]
        }      
      }
      table.rows[j].cells[3].innerHTML = new_cell_details;
    } 
    var header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta><title>Export HTML To Doc</title></head><body>";
    var footer = "</body></html>";
    var sourcehtml = header + "<table border='1' cellpadding='1' cellspacing='1'>" + table.innerHTML + "</table>" + footer; 
    url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourcehtml);
    filename = date_time + '.doc'
  } else {  
    var rows =[];
    var columns = [];    
      //iterate through rows of table
    for(var i=0,row; row = table.rows[i];i++){ 
      columns = [];       
      columns[0] = row.cells[0].innerText;
      for(var j = 1; j < row.cells.length; j++){     
        columns.push(row.cells[j].innerText);     
      }      
      columns = columns.join();
      rows.push(columns.split(','));  
    }    
    csvContent = "data:text/csv;charset=utf-8,";
      /* add the column delimiter as comma(,) and each row splitted by new line character (\n) */
      rows.forEach(function(rowArray){
        row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    url = encodeURI(csvContent);
    filename = date_time + '.csv';
  }  
  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/// /////////////////////////////////////////////////////////////////// change_alarm_panel() function //////////////////////////////////////////////////

function change_alarm_panel(id, action) {
  if (id === 'alarm' && alarm_f) {
    document.getElementById('alarm_panel').style.display = action;
    return;
  }
  if (id === 'f_m_current_div' && meter_R_f) { 
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_current_data[0]['Wf'][0]['c'][1]['v'] + ' A';
  } else if (id ==='f_m_voltage_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_voltage_data[0]['Wf'][0]['c'][1]['v'] + ' V'; 
  } else if (id ==='f_m_power_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_data[0]['Wf'][0]['c'][1]['v'] + ' W';    
  } else if (id ==='f_m_energy_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_energy_data[0]['Wf'][0]['c'][1]['v'] + ' W.h';
  } else if (id ==='f_m_power_factor_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_factor_data[0]['Wf'][0]['c'][1]['v'] + ' %';
  } else if (id ==='f_m_frequency_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_frequency_data[0]['Wf'][0]['c'][1]['v'] + ' Hz';
  } else if (id === 'f_l_current_div' && meter_R_f) { 
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_current_data[1]['Wf'][0]['c'][1]['v'] + ' A';
  } else if (id ==='f_l_voltage_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_voltage_data[1]['Wf'][0]['c'][1]['v'] + ' V';
  } else if (id ==='f_l_power_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_data[1]['Wf'][0]['c'][1]['v'] + ' W';
  } else if (id ==='f_l_energy_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_energy_data[1]['Wf'][0]['c'][1]['v'] + ' W.h';
  } else if (id ==='f_l_power_factor_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_factor_data[1]['Wf'][0]['c'][1]['v'] + ' %';
  } else if (id ==='f_l_frequency_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_frequency_data[1]['Wf'][0]['c'][1]['v'] + ' Hz';
  } else if (id === 'c_a_e_current_div' && meter_R_f) { 
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_current_data[2]['Wf'][0]['c'][1]['v'] + ' A';
  } else if (id ==='c_a_e_voltage_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_voltage_data[2]['Wf'][0]['c'][1]['v'] + ' V';
  } else if (id ==='c_a_e_power_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_data[2]['Wf'][0]['c'][1]['v'] + ' W'
  } else if (id ==='c_a_e_energy_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_energy_data[2]['Wf'][0]['c'][1]['v'] + ' W.h';
  } else if (id ==='c_a_e_power_factor_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_factor_data[2]['Wf'][0]['c'][1]['v'] + ' %';
  } else if (id ==='c_a_e_frequency_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_frequency_data[2]['Wf'][0]['c'][1]['v'] + ' Hz';
  } else if (id === 'c_e_current_div' && meter_R_f) { 
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_current_data[3]['Wf'][0]['c'][1]['v'] + ' A';
  } else if (id ==='c_e_voltage_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_voltage_data[3]['Wf'][0]['c'][1]['v'] + ' V';
  } else if (id ==='c_e_power_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_data[3]['Wf'][0]['c'][1]['v'] + ' W'
  } else if (id ==='c_e_energy_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_energy_data[3]['Wf'][0]['c'][1]['v'] + ' W.h';
  } else if (id ==='c_e_power_factor_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_factor_data[3]['Wf'][0]['c'][1]['v'] + ' %';
  } else if (id ==='c_e_frequency_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_frequency_data[3]['Wf'][0]['c'][1]['v'] + ' Hz';
  } else if (id === 'c_current_div' && meter_R_f) { 
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_current_data[4]['Wf'][0]['c'][1]['v'] + ' A';
  } else if (id ==='c_voltage_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_voltage_data[4]['Wf'][0]['c'][1]['v'] + ' V';
  } else if (id ==='c_power_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_data[4]['Wf'][0]['c'][1]['v'] + ' W';
  } else if (id ==='c_energy_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_energy_data[4]['Wf'][0]['c'][1]['v'] + ' W.h';
  } else if (id ==='c_power_factor_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_factor_data[4]['Wf'][0]['c'][1]['v'] + ' %';
  } else if (id ==='c_frequency_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_frequency_data[4]['Wf'][0]['c'][1]['v'] + ' Hz';
  } else if (id === 'h_current_div' && meter_R_f) { 
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_current_data[5]['Wf'][0]['c'][1]['v'] + ' A';
  } else if (id ==='h_voltage_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_voltage_data[5]['Wf'][0]['c'][1]['v'] + ' V';
  } else if (id ==='h_power_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_data[5]['Wf'][0]['c'][1]['v'] + ' W';
  } else if (id ==='h_energy_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_energy_data[5]['Wf'][0]['c'][1]['v'] + ' W.h';
  } else if (id ==='h_power_factor_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_power_factor_data[5]['Wf'][0]['c'][1]['v'] + ' %';
  } else if (id ==='h_frequency_div' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    document.getElementById('meter_R').innerHTML = motors_frequency_data[5]['Wf'][0]['c'][1]['v'] + ' Hz';
  } else if (id === 'linear_gauge' && meter_R_f) {
    document.getElementById('meter_R').style.display = action;
    if (action === 'unset') {
      document.getElementById('meter_reading').innerHTML = document.getElementById('linear_gauge').getAttribute('data-value');
    } else {
      document.getElementById('meter_reading').innerHTML = '';
    }
  } else if (id === 'radial_gauge' && meter_R_f) {
    if (action === 'unset') {
      document.getElementById('meter_reading').innerHTML = document.getElementById('radial_gauge').getAttribute('data-value');
    } else {
    document.getElementById('meter_reading').innerHTML = '';
    }
  }
}