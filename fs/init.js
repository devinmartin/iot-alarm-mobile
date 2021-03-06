load('api_config.js');
load('api_events.js');
load('api_adc.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_shadow.js');
load('api_rpc.js');
load('api_file.js');
load('api_pwm.js');

let buzzerPin = 14; //Cfg.get('pins.buzzer');
let state = {buzzer: false, sleep: false, schedule: true, voltage:0.1};

let raw = ADC.read(0);
let volt=(raw/1023.0) * 4.5;
print('voltage is', volt);
state.voltage = volt;


GPIO.set_mode(buzzerPin, GPIO.MODE_OUTPUT);
GPIO.write(buzzerPin, 0);
print('Alarm GPIO:', buzzerPin);

// init after 20 seconds
Timer.set(5000, Timer.REPEAT, function() {
  if (!state.buzzer && state.schedule) {
    // load schedule
    print('checking schedule');
    let schedule = JSON.parse(File.read('schedule.json'));
    for(let i = 0; i<schedule.times.length; i++){
      let pred = schedule.times[i];
      if (pred > schedule.last && Timer.now() >= pred) {
        print('schedule hit');
        schedule.last = Timer.now();
        File.write(JSON.stringify(schedule), 'schedule.json');
        state.buzzer = true;
        Shadow.update(0, state);
      }
    }
  }
}, null);

// check battery
Timer.set(300000, Timer.REPEAT, function(){
  let raw = ADC.read(0);
  let volt=(raw/1023.0) * 4.5;
  print('voltage is', volt);
  stage.voltage = volt;
  Shadow.update(0, state);
}, null);

// chirp buzzer if alarm is set
Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {
  if (state.buzzer){
    print('chirping:');
    PWM.set(buzzerPin, 2700, 0.5);
    GPIO.write(buzzerPin, 0);
    Timer.set(200 /* 1 sec */, 0, function() {
      PWM.set(buzzerPin, 0, 0);
      GPIO.write(buzzerPin, 0);
    }, null);
  }
  else {
    PWM.set(buzzerPin, 0, 0)
    GPIO.write(buzzerPin, 0);
  }
}, null);


// Set up Shadow handler to synchronise device state with the shadow state
Shadow.addHandler(function(event, obj) {
  if (event === 'CONNECTED') {
    // Connected to shadow - report our current state.
    Shadow.update(0, state);
  } else if (event === 'UPDATE_DELTA') {
    // Got delta. Iterate over the delta keys, handle those we know about.
    print('Got delta:', JSON.stringify(obj));
    for (let key in obj) {
      if (key === 'buzzer') {
        // Shadow wants us to change local state - do it.
        state.buzzer = obj.buzzer;
        print('Buzzer on ->', state.buzzer);
      } else if (key === 'sleep') {
        state.sleep = obj.sleep;
        print('Sleep on ->', state.sleep);
      } else {
        print('Dont know how to handle key', key);
      }
    }
    // Once we've done synchronising with the shadow, report our state.
    Shadow.update(0, state);
  }
});

// admin handlers
RPC.addHandler('Alarm.SetSchedule', function(args) {
    return File.write(JSON.stringify(args), 'schedule.json');
});

RPC.addHandler('Alarm.AddSchedule', function(args) {
  let schedule = JSON.parse(File.read('schedule.json'));
  for (let i in args){
    schedule.times.push(args[i]);
  }
  return File.write(JSON.stringify(schedule), 'schedule.json');
});

RPC.addHandler('Alarm.Silence', function(args) {
  state.buzzer = false;
  Shadow.update(0, state);
});

RPC.addHandler('Alarm.GetSchedule', function(args) {
    return JSON.parse(File.read('schedule.json'));
});
