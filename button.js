load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_azure.js');

let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');


print('LED GPIO:', led, 'button GPIO:', button);

// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {
  let value = GPIO.toggle(led);
}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 20, function() {
  print('button pressed')
  Azure.sendD2CMsg('btn=1', "t");
  GPIO.toggle(led);
  Sys.usleep(100000);
  GPIO.toggle(led);
  Sys.usleep(100000);
  GPIO.toggle(led);
  Sys.usleep(100000);
  GPIO.toggle(led);
  Sys.usleep(100000);
  GPIO.toggle(led);
}, null);
