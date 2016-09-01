/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */


// REQUIRE MODUES:
var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Vibe = require('ui/vibe');
var Settings = require('settings');
//var Moment = require('moment');
//var Clock = require('clock');
var Feature = require('platform/feature');
var Clay = require('./js/clay');

// USER SETTINGS:
var clayConfig = require('./js/config');
var clayAction = require('./js/config-action');
var clay = new Clay(clayConfig, clayAction, {autoHandleEvents: false}); //var clay = new Clay(clayConfig);

Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL(clay.generateUrl());
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e && !e.response) {
    return;
  }
  var dict = clay.getSettings(e.response);

  // Save the Clay settings to the Settings module. 
  Settings.option(dict);
});

//Settings.data('NightscoutURL', {'id': 1, 'url': 'https://tobiasfelixcgm.azurewebsites.net'});
//Settings.data('Units', {'id': 2, 'unit': 'mmol'});
//Settings.data('Low', {'id': 3, 'BGLow': 3.9});
//Settings.data('High', {'id': 4, 'BGHigh': 7});

// PRIVATE SETTINGS:
console.log('NightscoutUnits: ' + Settings.option('NightscoutUnits'));
if (Settings.option('NightscoutUnits') == 'mg') {var BGMin = 45;} else {var BGMin = 2.5;}
var BGMax = Settings.option('SetHigh').BGHigh * Settings.option('SetLow').BGLow / BGMin;
var BGLast = NaN;
var timeLast = 0;

// CONSTANTS:
var Colors = {
  'high': 'orange',
  'mid': 'islamicGreen',
  'low': 'red',
};

// START:
Pebble.addEventListener("ready", function() {
  console.log('ready');
  Update();
});

// Timeout for ready:
setTimeout(function() {
  console.log('ready timeout');
  Update();
},5000);

// GENERATE WINDOW:
  // Declare main window
  var main = new UI.Window({backgroundColor: 'black'});

  // Declare field rectangles
  var low = new UI.Rect({backgroundColor: Feature.color(Colors.low, 'orange')});
  var mid = new UI.Rect({backgroundColor: Feature.color(Colors.mid, 'orange')});
  var high = new UI.Rect({backgroundColor: Feature.color(Colors.high, 'orange')});

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
    font: 'bitham-34-medium-numbers', //gothic-28-bold', //'roboto-bold-subset-49', //ROBOTO_BOLD_SUBSET_49
    color: 'black',
    backgroundColor: 'clear',
    text: '',
    textAlign: 'center'
  });

// Declare timetext
var clockText = new UI.TimeText({
  size: new Vector2(main.size().x, 40),
  font: 'gothic-28',
  color: 'black',
  backgroundColor: 'clear',
  text: '%H:%M',
  textAlign: 'center',
  position: new Vector2(0, main.size().y - 40),
});

  // Add elements as children to main window
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
  console.log('main window loaded for initialisation');

function updateMain(BG) {
  // Calculate coordinates:
  var BGLow = Settings.data('Low').BGLow;
  var BGHigh = Settings.data('High').BGHigh;
  
  if (!isNaN(BG)) {BGMax = Math.max(Settings.data('High').BGHigh * Settings.data('Low').BGLow / BGMin, BG);}
  
  var yLow = parseInt(main.size().y * (1 - (Math.log(BGLow/BGMin) / Math.log(BGMax/BGMin))));
  var yHigh = parseInt(main.size().y * (1 - (Math.log(BGHigh/BGMin) / Math.log(BGMax/BGMin))));
  var yBG = parseInt(main.size().y * (1 - (Math.log(parseFloat(BG)/BGMin) / Math.log(BGMax/BGMin))));
  var sgvDisplay = Math.floor(BG).toFixed(0);

  // Apply new coordinates:
  // Field rectangles:
  low.size(new Vector2(main.size().x, main.size().y - yLow)); //low.size(new Vector2(parseInt(main.size().x), main.size().y - yLow - 1));
  low.position(new Vector2(0, yLow)); // low.position(new Vector2(0, yLow + 1));
  mid.size(new Vector2(main.size().x, yLow - yHigh)); //mid.size(new Vector2(parseInt(main.size().x), yLow - yHigh - 1));
  mid.position(new Vector2(0, yHigh)); //mid.position(new Vector2(0, yHigh + 1));
  high.size(new Vector2(main.size().x, yHigh)); // high.size(new Vector2(parseInt(main.size().x), yHigh - 1));
  high.position(new Vector2(0, 0));
  lowBar.position(new Vector2(0, yLow));
  lowBar.position2(new Vector2(main.size().x, yLow));
  highBar.position(new Vector2(0, yHigh));
  highBar.position2(new Vector2(main.size().x, yHigh));
  
  // Circle and text:
  if (isNaN(yBG)) {
    console.log('yBG is NaN');
    circleBack.position(new Vector2(parseInt(main.size().x / 2), -50));
    circle.position(new Vector2(parseInt(main.size().x / 2), -50));
    textfield.position(new Vector2(parseInt((main.size().x - textfield.size().x) / 2), -50));
  } else {
    console.log('yBG is numeric');
    circleBack.position(new Vector2(parseInt(main.size().x / 2), yBG));
    circle.position(new Vector2(parseInt(main.size().x / 2), yBG));
    textfield.position(new Vector2(parseInt((main.size().x - textfield.size().x) / 2), yBG - parseInt(textfield.size().y / 2)));
  }
  
  // Update text:
  console.log('sgvDisplay = ' + sgvDisplay);
  textfield.text(sgvDisplay);
  
  // Text colour:
  if (isLow(BG)) {textfield.color(Colors.low);}
  else {if (isHigh(BG)) {textfield.color(Colors.high);}
    else {textfield.color(Colors.mid);}
  }

  // Text size:
  if (Settings.data('Units').unit == "mmol") {
    
  } else {
    
  }
  
  // Save status:
  BGLast = BG;
  
}

// UPDATE STATUS:
function Update() {
  // GET SGV FROM NIGHTSCOUT:
  // Construct URL:
  var site = Settings.data('NightscoutURL').url;
  var units = Settings.data('Units').unit;
  var URL = site + '/pebble?units=' + units;

  // Build the request:
  var sgv = [ ];
  var datetime = [ ];

  // Execute the request:
  console.log('starting ajax');
  ajax({ url: URL, type: 'json' },
    function(data, status, req) {
      // Process result:
      try {
        sgv = data.bgs[0].sgv;
        datetime = data.bgs[0].datetime;
        console.log('Sample time: ' + datetime);
        console.log('NitSct time: ' + data.status[0].now);
        console.log('Current time: ' + Date.now());
        var timeAgo = Date.now() - datetime;
        console.log('Time ago: ' + timeAgo);
        var isNew = datetime != timeLast;
        console.log('New: ' + isNew);
        
        // Don't use old values:
        if (timeAgo > 600000) {sgv = NaN;}
        
        // Notify the user:
        if (isNew && !isNaN(sgv)) {
          // Low (every time):
          if (isLow(sgv)) {Vibe.vibrate('long');}
          // High (first time):
          if (isHigh(sgv) && !isHigh(BGLast)) {Vibe.vibrate('short');}
        }
        
      } catch(err) {
        sgv = NaN;
        console.log(err.message);
      }
      
      // Update main value textfield
      if (sgv != BGLast) {
        updateMain(sgv);
        console.log('main window loaded with value');
      }
    },
    function(error) {
      console.log('ajax error');
      console.log('Download failed: ' + error);
      updateMain(NaN);
      
      console.log('main window loaded with dash');
    }
  );
  setTimeout(function(){Update();},60000);
}

function isLow(sgv) {return (sgv < Settings.data('Low').BGLow)}
function isHigh(sgv) {return (sgv >= Settings.data('High').BGHigh)}

//main.on('click', 'up', function(e) {
//  var menu = new UI.Menu({
//    sections: [{
//      items: [{
//        title: 'Pebble.js',
//        icon: 'images/menu_icon.png',
//        subtitle: 'Can do Menus'
//      }, {
//        title: 'Second Item',
//        subtitle: 'Subtitle Text'
//      }, {
//        title: 'Third Item',
//      }, {
//        title: 'Fourth Item',
//      }]
//    }]
//  });
//  menu.on('select', function(e) {
//    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
//    console.log('The item is titled "' + e.item.title + '"');
//  });
//  menu.show();
//});

//main.on('click', 'select', function(e) {
//  var wind = new UI.Window({
//    backgroundColor: 'black'
//  });
//  wind.show();
//});

//main.on('click', 'down', function(e) {
//  var card = new UI.Card();
//  card.title('A Card');
//  card.subtitle('Is a Window');
//  card.body('The simplest window type in Pebble.js.');
//  card.show();
//});
