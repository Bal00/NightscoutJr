module.exports = function(minified) {
  var clayConfig = this;
  var _ = minified._;
  var $ = minified.$;
  var HTML = minified.HTML;

  // https://github.com/pebble/clay/blob/v0.1.7/README.md
  
//  function toggleBackground() {
//    if (this.get()) {
//      clayConfig.getItemByAppKey('background').enable();
//    } else {
//      clayConfig.getItemByAppKey('background').disable();
//    }
//  }

//  clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function() {
//    var coolStuffToggle = clayConfig.getItemByAppKey('cool_stuff');
//    toggleBackground.call(coolStuffToggle);
//    coolStuffToggle.on('change', toggleBackground);
//
//    // Hide the color picker for aplite
//    if (!clayConfig.meta.activeWatchInfo || clayConfig.meta.activeWatchInfo.platform === 'aplite') {
//      clayConfig.getItemByAppKey('background').hide();
//    }

//    // Set the value of an item based on the userData
//    $.request('get', 'https://some.cool/api', {token: clayConfig.meta.userData.token})
//      .then(function(result) {
//        // Do something interesting with the data from the server
//      })
//      .error(function(status, statusText, responseText) {
//        // Handle the error
//      });
//  });

};