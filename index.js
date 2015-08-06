#! /usr/bin/env node

// Usage: node make_onsave.js b2g tv browser
//        node make_onsave.js nightly phone settings
//        node make_onsave.js simulator tv tv-deck
//        node make_onsave.js b2g tv

var fs = require('fs');
var path = require('path');
// var exec = require('child_process').exec;
var chokidar = require('chokidar');

var Make = require('./lib/make');
var Runtime = require('./lib/runtime');

var runtimeTypes = ['firefox', 'developer', 'b2g', 'mulet', 'nightly', 'simulator'];
var deviceTypes = ['phone', 'tv'];

var apps = fs.readdirSync(path.join(process.cwd(), 'apps')).filter(function(file) {
  return fs.statSync(path.join(path.join(process.cwd(), 'apps'), file)).isDirectory();
});
var tvApps = fs.readdirSync(path.join(process.cwd(), 'tv_apps')).filter(function(file) {
  return fs.statSync(path.join(path.join(process.cwd(), 'tv_apps'), file)).isDirectory();
});

// Default runtime and device type
var runtimeType = 'b2g';
var deviceType = 'tv';
var app;

process.argv.forEach(function(val, index, array) {
  if (runtimeTypes.indexOf(val) > -1) {
    runtimeType = val;
  } else if (deviceTypes.indexOf(val) > -1) {
    deviceType = val;
  } else if (apps.indexOf(val) > -1 || tvApps.indexOf(val) > -1) {
    app = val;
  }
});

var makeGaia = new Make(deviceType);
var makeApp = new Make(deviceType, app);
var runtime = new Runtime(runtimeType, deviceType);

function watch () {
  console.log('watch');

  function onfilechange (path) {
    console.log('File', path, 'has been changed');
    makeApp.run(reload);
  }

  var watcher = chokidar.watch(['apps', 'tv_apps', 'shared'], {
    persistent: true,
    cwd: process.cwd()
  });
  // watcher.add('tv_apps');
  // watcher.add('shared');
  watcher.on('change', onfilechange);
}

function reload() {
  runtime.reload(app);
}

makeGaia.run(function () {
  runtime.start();
  watch();
});
