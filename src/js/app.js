// USEFUL REFERENCES:
//   https://developer.pebble.com/guides/tools-and-resources/color-picker/#AAAAAA
//   https://github.com/pebble/clay#getting-started-pebblejs
//   https://github.com/pebble/clay/blob/v0.1.7/README.md

// REQUIRE MODUES:
var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');
var Settings = require('settings');
//var Moment = require('moment');
//var Clock = require('clock');
var Feature = require('platform/feature');
var Clay = require('./clay');

// CONSTANTS:
var Colors = {
  'High': 'orange',
  'Mid': 'islamicGreen',
  'Low': 'red',
};
var Units = {
  'mmol': {
    'Font': 'bitham-34-medium-numbers', 
    'SGVMin': 2.5,
    'Precision': 0,
    'TextFieldHeight': 42,
  },
  'mg': {
    'Font': 'gothic-28-bold', 
    'SGVMin': 45,
    'Precision': -1,
    'TextFieldHeight': 36,
  },
};

// USER SETTINGS:
var clayConfig = require('./config');
//var clayAction = require('./config-action');
//var UserData = {'NightscoutURL': 'https://mynightscout.azurewebsites.net',
//                'NightscoutUnits': 'mmol',
//                'SetLow': 4,
//                'SetHigh': 7,
//                'FormatClock': '%H',
//               };

var clay = new Clay(clayConfig, null, {autoHandleEvents: false}); //var clay = new Clay(clayConfig, clayAction, {userData: UserData, autoHandleEvents: false}); //var clay = new Clay(clayConfig);


Pebble.addEventListener('showConfiguration', function(e) {
  
  console.log('showConfiguration argument: ' + JSON.stringify(e));
  console.log('Settings.option(): ' + JSON.stringify(Settings.option()));
  
  //if (SettingsValid()) {
    //clayConfig.getItemByAppKey('NightscoutURL').set(Settings.option('NightscoutURL'));
  //}
  
  Pebble.openURL(clay.generateUrl());
  
//  var claySettings = JSON.parse(localStorage.getItem("clay-settings"));
//  for (var key in claySettings) {
//    if (claySettings.hasOwnProperty(key)) {
//      if(key in Settings.option){
//        console.log(key + " -> " + Settings.option(key));
//        claySettings[key] = Settings.option(key);
//      }
//    }
//  }	
//  localStorage["clay-settings"] = JSON.stringify(claySettings);
//  Pebble.openURL(clay.generateUrl());
//  console.log("configuration shown");	
});


Pebble.addEventListener('webviewclosed', function(e) {
  console.log('webviewclosed triggered and handled manually');
  if (e && !e.response) {
    return;
  }
  
  // Clean argument e:
  //e.response = CleanSettings(e.response);
  //console.log('Response type: ' + typeof e.response);
  //console.log('Response: ' + e.response);
  
  try {
    // //e = JSON.parse(JSON.stringify(e).replace('\"','"'));
    //console.log('New settings: ' + JSON.stringify(getSettings(e.response)));
    
    var dict = clay.getSettings(e.response);
    //var dict = getSettings(e.response);
    
    //console.log('dict type: ' + typeof dict);
    //console.log('dict: ' + JSON.stringify(dict));
    // Save the Clay settings to the Settings module.
    //dict = CleanSettings(dict);
    Settings.option(dict);
    //try {console.log('Settings saved: ' + JSON.stringify(dict));} catch(err) {console.log('Settings saved error: ' + err.message);}
  } catch (err) {
    console.log('Settings error: ' + err.message);
  }
    
  // Update:
  FetchSGV();
});

// PRIVATE SETTINGS:
var LastData = {bgs: [{datetime: 0}]};
var Ready = false;
var SettingsMessageGiven = false;

// DECLARE MAIN WINDOW:
var main = new UI.Window({backgroundColor: 'black'});

// Declare field rectangles
var low = new UI.Rect({backgroundColor: Feature.color(Colors.Low, 'lightgray')});
var mid = new UI.Rect({backgroundColor: Feature.color(Colors.Mid, 'lightgray')});
var high = new UI.Rect({backgroundColor: Feature.color(Colors.High, 'lightgray')});

// Declare separator lines
var lowBar = new UI.Line({strokeWidth: 2, strokeColor: 'black'});
var highBar = new UI.Line({strokeWidth: 2, strokeColor: 'black'});

// Declare foreground circle
var circle = new UI.Circle({backgroundColor: 'white', radius: 20, position: new Vector2(-50,-50)});

// Declare background circle
var circleBack = new UI.Circle({backgroundColor: 'black', radius: 24, position: new Vector2(-50,-50)});

// Declare main value textfield
var textfield = new UI.Text({
  size: new Vector2(60, 42),
  font: 'gothic-28-bold', //'bitham-34-medium-numbers', //gothic-28-bold', //'roboto-bold-subset-49', //ROBOTO_BOLD_SUBSET_49
  color: 'black',
  backgroundColor: 'clear',
  text: '',
  textAlign: 'center',
  position: new Vector2(0, parseInt(main.size().y / 2)),
});

// Declare timetext
var clockText = new UI.TimeText({
  size: new Vector2(main.size().x, 40),
  font: 'gothic-28',
  color: 'black',
  backgroundColor: 'clear',
  text: '%H:%M',
  textAlign: 'center',
  position: new Vector2(0, main.size().y + 40),
});

// START:
// Ready event:
Pebble.addEventListener("ready", function() {
  if (!Ready) {
    console.log('ready');
    StartUp();
  }
});

// Timeout for ready event
setTimeout(function() {
  if (!Ready) {
    console.log('ready timeout');
    StartUp();
  }
},3000);
                        
// Check settings and initialise
function StartUp() {
 
  // Check for settings:
  if (SettingsValid()) {
    Ready = true;
    
    // Add elements as children to main window
    PopulateMain();
    
    // Paint window:
    UpdateMain(NaN);
    
    // GET NIGHTSCOUT DATA:
    FetchSGV();
 
  } else {
    
    if (!SettingsMessageGiven) {
      // Display settings message:
      var wind = new UI.Window({backgroundColor: 'black'});
      var messagetext = new UI.Text({
        size: new Vector2(wind.size().x, 80),
        font: 'gothic-14-bold',
        color: 'white',
        backgroundColor: 'clear',
        text: 'Apply settings and restart',
        textAlign: 'center',
        position: new Vector2(0, parseInt(wind.size().y / 2)),
      });
      wind.add(messagetext);
      wind.show();
      SettingsMessageGiven = true;
    }
    
    // Wait for settings:
    setTimeout(function(){StartUp();},10000);
  }
}

// Add elements as children to main window
function PopulateMain() {
  main.add(low);
  main.add(mid);
  main.add(high);
  main.add(lowBar);
  main.add(highBar);
  main.add(clockText);
  main.add(circleBack);
  main.add(circle);
  main.add(textfield);
  main.show();
}

// Update display
function UpdateMain(SGV) {
  // Calculate coordinates:
  var Unit = Settings.option('NightscoutUnits');
  var SGVMin = Units[Unit].SGVMin;
  var SetLow = Settings.option('SetLow');
  var SetHigh = Settings.option('SetHigh');   
  var SGVMax = SetHigh * SetLow / SGVMin;
  var yLow = parseInt(main.size().y * (1 - (Math.log(SetLow/SGVMin) / Math.log(SGVMax/SGVMin))));
  var yHigh = parseInt(main.size().y * (1 - (Math.log(SetHigh/SGVMin) / Math.log(SGVMax/SGVMin)))); 
  
  if (isNaN(SGV)) {
    // Invalid SGV:
    console.log('SGV is NaN');
    
    // Hide circle:
    circleBack.position(new Vector2(parseInt(main.size().x / 2), -50));
    circle.position(new Vector2(parseInt(main.size().x / 2), -50));
    textfield.position(new Vector2(parseInt((main.size().x - textfield.size().x) / 2), -50));
    
  } else {
    // Valid SGV - display:
    console.log('ySGV is numeric');
    
    //Calculate position and rounded values:
    SGVMax = Math.max(SetHigh * SetLow / SGVMin, SGV * Math.pow(SGV / SGVMin, 1/7));
    yLow = parseInt(main.size().y * (1 - (Math.log(SetLow/SGVMin) / Math.log(SGVMax/SGVMin))));
    yHigh = parseInt(main.size().y * (1 - (Math.log(SetHigh/SGVMin) / Math.log(SGVMax/SGVMin)))); 
    
    var ySGV = parseInt(main.size().y * (1 - (Math.log(parseFloat(SGV)/SGVMin) / Math.log(SGVMax/SGVMin))));
    var RoundFactor = Math.pow(10, Units[Unit].Precision);
    var sgvDisplay = (Math.floor(SGV * RoundFactor) / RoundFactor).toFixed(Math.max(Units[Unit].Precision, 0));

    // Update text:
    console.log('sgvDisplay = ' + sgvDisplay);
    textfield.text(sgvDisplay);
    
    // Text size:
    textfield.size(new Vector2(60, Units[Unit].TextFieldHeight));
    textfield.font(Units[Unit].Font);
    
    // Text colour:
    if (isLow(SGV)) {
      textfield.color(Colors.Low);
    } else {
      if (isHigh(SGV)) {
        textfield.color(Colors.High);
      } else {
        textfield.color(Colors.Mid);
      }
    }
    
    // Position circle:
    circleBack.position(new Vector2(parseInt(main.size().x / 2), ySGV));
    circle.position(new Vector2(parseInt(main.size().x / 2), ySGV));
    textfield.position(new Vector2(parseInt((main.size().x - textfield.size().x) / 2), ySGV - parseInt(textfield.size().y / 2)));
  }
    
  // Position field rectangles and separator lines:
  low.size(new Vector2(main.size().x, main.size().y - yLow));
  low.position(new Vector2(0, yLow));
  mid.size(new Vector2(main.size().x, yLow - yHigh));
  mid.position(new Vector2(0, yHigh));
  high.size(new Vector2(main.size().x, yHigh));
  high.position(new Vector2(0, 0));
  lowBar.position(new Vector2(0, yLow));
  lowBar.position2(new Vector2(main.size().x, yLow));
  highBar.position(new Vector2(0, yHigh));
  highBar.position2(new Vector2(main.size().x, yHigh));
  
  // Clock:
  if (Settings.option('FormatClock') == 'na') {
    clockText.position(new Vector2(0, main.size().y + 40));
  } else {
    clockText.position(new Vector2(0, main.size().y - 40));
  }
  clockText.text(Settings.option('FormatClock') + ':%M');
}

// GET NIGHTSCOUT DATA:
function FetchSGV() {
  var Result = {};
  
  // Construct URL:
  var Site = Settings.option('NightscoutURL');
  var Units = Settings.option('NightscoutUnits');
  var URL = Site + '/pebble?units=' + Units;
  console.log('Nightscout URL: ' + URL);

  // Execute the request:
  console.log('Starting ajax');
  ajax({ url: URL, type: 'json' },
       function(data, status, req) {
         console.log('ajax result: ' + JSON.stringify(data));
         // Success, process result:
         try {
           var dateTime = data.bgs[0].datetime;
           var timeLast = LastData.bgs[0].datetime;
           var isNew = dateTime != timeLast;

           Result.data = data;
           Result.isNew = isNew;

         } catch(err) {
           Result.data = LastData;
           Result.isNew = false;
           console.log('Data interpret error: ' + err.message);
         }
         Update(Result);
       },
       function(error) {
         console.log('ajax error: ' + error);
         Result.data = LastData;
         Result.isNew = false;
         Update(Result);
       }
    );
}

// UPDATE STATUS:
function Update(result) {
  // GET SGV FROM NIGHTSCOUT:
  //var result = FetchSGV();
  var isNew = result.isNew;
  var data = result.data;
  console.log('data: ' + JSON.stringify(data));

  // Evaluate result:
  var SGV = data.bgs[0].sgv;
  var SVGLast = LastData.bgs[0].sgv;
  var datetime = data.bgs[0].datetime;
  var timeAgo = Date.now() - datetime;
  
  console.log('Sample time: ' + datetime);
  //console.log('NitSct time: ' + data.status[0].now);
  console.log('Current time: ' + Date.now());
  console.log('Time ago: ' + timeAgo);
  console.log('New: ' + isNew);
  
  // Don't use old values:
  if (timeAgo > 600000) {
    console.log('Data older than 10 minutes');
    SGV = NaN;
  }
  
  // Notify the user:
  if (isNew && !isNaN(SGV)) {
    // Low (every time):
    if (isLow(SGV)) {Vibe.vibrate('long');}
    
    // High (first time):
    if (isHigh(SGV) && !isHigh(SVGLast)) {Vibe.vibrate('short');}
  }
  
  // Update main value textfield
  UpdateMain(SGV);
  console.log('main window loaded with value');
  
  // Save status:
  LastData = data;
  
  // Loop:
  setTimeout(function(){FetchSGV();},60000);
}

function isLow(sgv) {return (sgv < parseFloat(Settings.option('SetLow')));}
function isHigh(sgv) {return (sgv >= parseFloat(Settings.option('SetHigh')));}
function CleanSettings(str) {
  //var str = Settings;
  console.log('Raw settings: ' + str);
  //str = encodeURIComponent(str);
  //console.log('Raw settings: ' + str);
  str = str.replace('%5C','');
  console.log('Clean settings: ' + str);
  str = str.replace(/\\/g, '');
  console.log('Clean settings: ' + str);
  
  if (str.charAt(0) != '%') { 
    str = encodeURIComponent(str);
    console.log('Clean settings: ' + str);
  }

  //str = JSON.stringify(str);
  //console.log('Raw settings: ' + str);
  //str = encodeURIComponent(str.replace(/\\/g, '').replace(/(\"\{)+/g,'{').replace(/(\}\")+/g,'}'));
  //str = str.replace(/\\/g, '');
  //console.log('Clean settings: ' + str);
  //if (str.charAt(0) != /\"/) {
  //  str = '"' + str + '"';
  //  console.log('Clean settings: ' + str);
  //}
  return (str);
}
function SettingsValid() {
  try {
    var Unit = Settings.option('NightscoutUnits');
    var SGVMin = Units[Unit].SGVMin;
    return (SGVMin == SGVMin);
  } catch(e) {
    return (false);
  }
}
function getSettings(strSettings) {
  strSettings = strSettings.replace('%5C','');
  console.log('getSettings clean settings stage 1: ' + strSettings);
  strSettings = strSettings.replace(/\\/g, '');
  console.log('getSettings clean settings stage 2: ' + strSettings);
  if (strSettings.charAt(0) == '%') {
    console.log('getSettings decoding input..');
    strSettings = decodeURIComponent(strSettings);
    console.log('getSettings decoded input: ' + strSettings);
  }
  var SettingsRaw = JSON.parse(strSettings);
  console.log('getSettings parsed input: ' + JSON.stringify(SettingsRaw));
  var SettingsOut = {};
  for (var key in SettingsRaw) {SettingsOut[key] = SettingsRaw[key].value;}
  console.log('getSettings output: ' + JSON.stringify(SettingsOut));
  return (SettingsOut);
}