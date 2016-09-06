module.exports = function(minified) {
  var clayConfig = this;
  var _ = minified._;
  var $ = minified.$;
  var HTML = minified.HTML;

  //clayConfig.on(clayConfig.getItemById('selectNightscoutUnits').change, function() {
    //console.log('Current unit: ' + clayConfig.getItemById('selectNightscoutUnits').value);
    //var Factor;
    //if (clayConfig.getItemById('selectNightscoutUnits').value == 'mg') {
    //  Factor = 1/18;
    //} else {
    //  Factor = 18;
    //}
    //clayConfig.getItemById('inputSetLow').value = (Factor * parseFloat(clayConfig.getItemById('inputSetLow').value)).toString(0);
  //});
  
//  function updateUnits() {
//    console.log('Updating units!');
//    console.log(this.get());
      //clayConfig.getItemById('selectNightscoutUnits').value;
    //} else {
    //  clayConfig.getItemByAppKey('background').disable();
   // }
//  }

//  clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function() {
//    console.log('after build event triggered');
//    var NightscoutUnits = clayConfig.getItemByAppKey('NightscoutUnits');
//    updateUnits.call(NightscoutUnits);
//    NightscoutUnits.on('change', updateUnits);
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