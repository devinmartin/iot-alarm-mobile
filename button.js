load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_shadow.js');
load('api_azure.js');

let led = Cfg.get('pins.led');  // Built-in LED GPIO number
let button = Cfg.get('pins.button');

print('LED GPIO:', led, 'button GPIO:', button);
GPIO.set_mode(led, GPIO.MODE_OUTPUT);


// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 20, function() {
  print('button pressed')
  Azure.sendD2CMsg('btn=1', "t");
}, null);
