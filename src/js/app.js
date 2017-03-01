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
var TimeSpan = 3600000;
var History = 7;

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
var LastData = [{date: 0, sgv: NaN}];
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

// Declare circles
var circleHist = [ ];
var circleHistBack = [ ];
var circlePred = [ ];
var circlePredBack = [ ];

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
    Update(LastData);
    
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
  
  for (var i = 0; i < History; i++) {
    circlePred[i] = new UI.Circle({backgroundColor: 'white', radius: 16, position: new Vector2(-50,-50)});
    circlePredBack[i] = new UI.Circle({backgroundColor: 'black', radius: 20, position: new Vector2(-50,-50)});
    
    main.add(circlePredBack[i]);
    main.add(circlePred[i]);
  }

  for (i = History - 1; i >= 0; i--) {
    circleHist[i] = new UI.Circle({backgroundColor: 'white', radius: 20, position: new Vector2(-50,-50)});
    circleHistBack[i] = new UI.Circle({backgroundColor: 'black', radius: 24, position: new Vector2(-50,-50)});
    
    main.add(circleHistBack[i]);
    main.add(circleHist[i]);
  }

  main.add(textfield);
  main.show();
}

// GET NIGHTSCOUT DATA:
function FetchSGV() {
  var Result = {};
  
  // Construct URL:
  var Site = Settings.option('NightscoutURL');
  var Units = Settings.option('NightscoutUnits');
  //var URL = Site + '/pebble?units=' + Units;
  var URL = Site + '/api/v1/entries/sgv?count=' + History.toFixed(0);
  console.log('Nightscout URL: ' + URL);

  // Execute the request:
  console.log('Starting ajax');
  ajax({ url: URL },
       function(data, status, req) {
         console.log('ajax result: ' + data);
         // Success, process result:
         try {
           var entryStrings = data.split('\n');
           console.log('First line: ' + entryStrings[0]);
           var Entries = [ ];
           for (var i = 0; i < entryStrings.length; i++) {
             var entryValues = entryStrings[i].split('\t');
             
             var Entry = {
               "dateString": entryValues[0], 
               "date": Number(entryValues[1]), 
               "sgv": Number(entryValues[2]), 
               "direction": entryValues[3], 
               "device": entryValues[4]
             };
             if (Units == "mmol") {Entry.sgv = Entry.sgv / 18;}
             Entries.push(Entry);
           }

           Result = Entries;
           //Result.isNew = isNew;

         } catch(err) {
           Result = LastData;
           //Result.isNew = false;
           console.log('Data interpret error: ' + err.message);
         }
         Update(Result);
       },
       function(error) {
         console.log('ajax error: ' + error);
         Result = LastData;
         //Result.isNew = false;
         Update(Result);
       }
    );
}

// UPDATE STATUS:
function Update(data) {
  // GET SGV FROM NIGHTSCOUT:
  //var result = FetchSGV();
  //var isNew = result.isNew;
  //var data = result.Entries;
  console.log('data: ' + JSON.stringify(data));
  
  // Evaluate result:
  var now = Date.now();
  //var SGV = data[0].sgv;
  //var SVGLast = LastData[0].sgv;
  //var datetime = data[0].date;
  //var timeAgo = now - datetime;
  
  // Predict:
  //  Adjust time:
  for (var i = 0; i < data.length; i++) {
    data[i].timeAgo = now - data[i].date;
  }
  
  //  Declare variables:
  var future = [ ];
  var coeffs = [0, 0, data[0].sgv];
  
  //  Prepare to predict future values:
  for (i = 0; i < History; i++) {
    future.push({"timeAgo": -300000 * i});
    future[i].date = now - future[i].timeAgo;
    future[i].sgv = NaN;
  }
  
  try {
    if(data.length > 2){
      //  Generate constants:
      var order = 2;
      coeffs = polyFit([[data[2].timeAgo/10000,data[2].sgv],[data[1].timeAgo/10000,data[1].sgv],[data[0].timeAgo/10000,data[0].sgv]],order);
      
      //  Predict future values:
      for (i = 0; i < History; i++) {
        future[i].sgv = 0;
        for (var pow = 0; pow <= order; pow++) {
          future[i].sgv += coeffs[pow]*Math.pow(future[i].timeAgo/10000,pow);
        }
      }
    }
  } catch(err) {
    console.log("Unable to evaluate prediction polynomial: " + err.message);
  }

  // Analyse:
  var stats = {"old":  data[0].timeAgo > 600000, "max": 0};
  for (i = 0; i < data.length; i++) {
    if (!isNaN(data[i].sgv)) {stats.max = Math.max(stats.max,data[i].sgv);}
  }
  stats.isNew = data[0].date != LastData[0].date;
  
    // Debugging:
  console.log('Sample time: ' + data[0].date);
  //console.log('NitSct time: ' + data.status[0].now);
  console.log('Current time: ' + now);
  console.log('Time ago: ' + data[0].timeAgo);
  console.log('New: ' + stats.isNew);
  console.log('Stale (old): ' + stats.old);
  
  // Notify the user:
  if (stats.isNew && !stats.old) {
    // Low (every time):
    if (isLow(data[0].sgv)) {Vibe.vibrate('long');}
    if (isLow(future[3].sgv)) {Vibe.vibrate('long');}
    // High (first time):
    if (isHigh(data[0].sgv) && !isHigh(LastData[0].sgv)) {Vibe.vibrate('short');}
    
  }
  
  // Update main value textfield
  UpdateMain(data, future, stats);
  console.log('main window loaded with value');
  
  // Save status:
  LastData = data;
  
  // Loop:
  setTimeout(function(){FetchSGV();},60000);
}

// Update display
function UpdateMain(data, future, stats) {
  // Calculate coordinates:
  //var SGV = data[0].sgv;
  var Unit = Settings.option('NightscoutUnits');
  var SGVMin = Units[Unit].SGVMin;
  var SetLow = Settings.option('SetLow');
  var SetHigh = Settings.option('SetHigh');   
  var SGVMax = Math.max(SetHigh * SetLow / SGVMin, stats.max * Math.pow(stats.max / SGVMin, 1/7))             
  var yLow = parseInt(main.size().y * (1 - (Math.log(SetLow/SGVMin) / Math.log(SGVMax/SGVMin))));
  var yHigh = parseInt(main.size().y * (1 - (Math.log(SetHigh/SGVMin) / Math.log(SGVMax/SGVMin))));
  
  var i;
  var xSGV;
  var ySGV;
  
  // Valid SGV - display:
  console.log('ySGV is numeric');
    
  //Calculate position and rounded values:
  //SGVMax = Math.max(SetHigh * SetLow / SGVMin, SGV * Math.pow(SGV / SGVMin, 1/7));
  //yLow = parseInt(main.size().y * (1 - (Math.log(SetLow/SGVMin) / Math.log(SGVMax/SGVMin))));
  //yHigh = parseInt(main.size().y * (1 - (Math.log(SetHigh/SGVMin) / Math.log(SGVMax/SGVMin)))); 
  
  // Plot history:
  for (i = 0; i < data.length; i++) {
    if (isNaN(data[i].sgv)){
      // Position circle:
      circleHistBack[i].position(new Vector2(-50,-50));
      circleHist[i].position(new Vector2(-50,-50));
    } else {
      // Calculate values:
      xSGV = parseInt(main.size().x * (0.5 - (data[i].timeAgo / TimeSpan)));
      ySGV = parseInt(main.size().y * (1 - (Math.log(parseFloat(data[i].sgv)/SGVMin) / Math.log(SGVMax/SGVMin))));
     
      // Position circle:
      circleHistBack[i].position(new Vector2(xSGV, ySGV));
      circleHist[i].position(new Vector2(xSGV, ySGV));
      //circleHistBack[i].radius(parseInt(main.size().y * (0.23 * (1 - 0.5*(data[i].timeAgo / TimeSpan))) + 4));
      //circleHist[i].radius(parseInt(main.size().y * (0.23 * (1 - 0.5*(data[i].timeAgo / TimeSpan)))));
    }
      
    // Current value:
    if (i === 0) {
      // Update text:
      if (stats.old) {
        textfield.text("");
      }else{
        textfield.position(new Vector2(parseInt(xSGV - textfield.size().x / 2), ySGV - parseInt(textfield.size().y / 2)));
        var RoundFactor = Math.pow(10, Units[Unit].Precision);
        var displayText = (Math.floor(data[i].sgv * RoundFactor) / RoundFactor).toFixed(Math.max(Units[Unit].Precision, 0));
        textfield.text(displayText);
  
        // Text size:
        textfield.size(new Vector2(60, Units[Unit].TextFieldHeight));
        textfield.font(Units[Unit].Font);
    
        // Text colour:
        if (isLow(data[i].sgv)) {
          textfield.color(Colors.Low);
        } else {
          if (isHigh(data[i].sgv)) {
            textfield.color(Colors.High);
          } else {
            textfield.color(Colors.Mid);
          }
        }
      }
    }
  }
  //Hide unused history circles:
  for (i = data.length; i < History; i++) {
    // Position circle:
    circleHistBack[i].position(new Vector2(-50,-50));
    circleHist[i].position(new Vector2(-50,-50));
  }
  
  // Plot prediction:
  for (i = 0; i < future.length; i++) { //i+=3) {
    if (isNaN(future[i].sgv)){
      // Position circle:
      circlePredBack[i].position(new Vector2(-50,-50));
      circlePred[i].position(new Vector2(-50,-50));
    } else {
      // Calculate values:
      xSGV = parseInt(main.size().x * (0.5 - (future[i].timeAgo / TimeSpan)));
      ySGV = parseInt(main.size().y * (1 - (Math.log(parseFloat(future[i].sgv)/SGVMin) / Math.log(SGVMax/SGVMin))));
    
      // Position circle:
      circlePredBack[i].position(new Vector2(xSGV, ySGV));
      circlePred[i].position(new Vector2(xSGV, ySGV));
    }  
  }
  //Hide unused prediction circles:
  for (i = future.length; i < History; i++) {
    // Position circle:
    circlePredBack[i].position(new Vector2(-50,-50));
    circlePred[i].position(new Vector2(-50,-50));
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

function polyFit(Points, order) {
  // Declare counters:
	var col; // As Integer
	var row; // As Integer

	// FIND SUMS:

	// Declare counters:
	var i; // Point number
	var o; // Power of x
  var Ex = [ ]; // new double[2 * order];
	var pEyx = [ ]; // new double[order];

	// Zero sums:
	for (o = 0; o <= 2*order; o++) {Ex.push(parseFloat(0));}
  for (o = 0; o <= order; o++) {pEyx.push(parseFloat(0));}

	// Find sums:
	Ex[0] = Points.length;
	for (i = 0; i < Points.length; i++) {
		for (o = 1; o <= (2 * order); o++) {
			Ex[o] += Math.pow(Points[i][0], o);
		}
		for (o = 0; o <= order; o++) {
			pEyx[o] += (Points[i][1] * Math.pow(Points[i][0], o));
		}
	}
  
	// CREATE MATRIX:

	// Reorder matrix for correct order:
	var mat = [ ]; //new double[order, order + 1];

	// Create matrix:
	for (row = 0; row <= order; row++) {
    var newRow = [ ];
    for (col = 0; col <= order; col++) {
      newRow.push(Ex[col + row]);
		}
    mat.push(newRow);
	}
  
	// PREPARE FOR GAUSSIAN ELIMINATION PROCESS:

	// Modifying matrix:
	//  M M M    M M M Eyx
	//  M M M -> M M M Eyx
	//  M M M    M M M Eyx
	for (row = 0; row <= order; row++) {
		mat[row].push(pEyx[row]);
	}
  
	// GUASSIAN ELIMINATION:

	// Eliminate lower triangle of matrix:
	//  M M M    M' M' M' Eyx'
	//  M M M -> 0' M' M' Eyx'
	//  M M M    0' 0' M' Eyx'
	
	for (o = 0; o < order; o++) {
		for (row = o + 1; row <= order; row++) {
			var kRow = mat[row][o] / mat[o][o];
			for (col = 0; col <= order + 1; col++) {
				mat[row][col] = mat[row][col] - (kRow * mat[o][col]);
			}
		}
	}
  
	// Find Coefficients:
	var ValueWanted; // As Integer
	var pA = [ ]; // new double[order] 'order coefficient vector
  var SpareAddress = [ ]; // As Integer[order - 1];
	var num; // As Double
  
  for (o = 0; o <= order; o++) {pA.push(parseFloat(0));}
  for (o = 0; o < order; o++) {SpareAddress.push(0);}
  
	// Set up addresses of variables not being evaluated:
	for (ValueWanted = order; ValueWanted >= 0; ValueWanted--) {
		for (o = 0; o < ValueWanted; o++) {
			SpareAddress[o] = o;
		}
		for (o = ValueWanted; o < order; o++) {
			SpareAddress[o] = o + 1;
		}

		// FINAL CALCULATIONS:

		// Create num:
		num = mat[ValueWanted][order + 1];
		for (o = 0; o < order; o++) {
			num -= (mat[ValueWanted][SpareAddress[o]] * pA[SpareAddress[o]]);
		}
	
		// Calculate coefficient:
		pA[ValueWanted] = num / mat[ValueWanted][ValueWanted];
  }
	
	return (pA);
}

function printArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0; i < arr.length; i++) {
      var line = "";
      if (Array.isArray(arr[i])) {
        for (var ii = 0; ii < arr[i].length; ii++) {
          line += arr[i][ii] + ", ";
        }
      } else {
        line = arr[i];
      }
      console.log(line);
    }
  } else {
    console.log(arr);
  }
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