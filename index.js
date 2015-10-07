#! /usr/bin/env node

// Usage: In gaia folder
//
//        node PATH_TO_GAIA_DEVELOP/index.js b2g tv browser
//        node PATH_TO_GAIA_DEVELOP/index.js simulator tv tv-deck
//        node PATH_TO_GAIA_DEVELOP/index.js b2g tv
//        node PATH_TO_GAIA_DEVELOP/index.js tv
//        node PATH_TO_GAIA_DEVELOP/index.js tv browser
//
//        node PATH_TO_GAIA_DEVELOP/index.js nightly phone settings
//        node PATH_TO_GAIA_DEVELOP/index.js sms
//        node PATH_TO_GAIA_DEVELOP/index.js
//

var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');


var config = require('./lib/config');
var Make = require('./lib/make');
var Runtime = require('./lib/runtime');

var runtimeTypes = ['firefox', 'developer', 'b2g', 'mulet', 'nightly', 'simulator'];
var deviceTypes = ['phone', 'tv'];

var appsPath = path.join(process.cwd(), 'apps');
var apps = fs.existsSync(appsPath) ?
  fs.readdirSync(appsPath).filter(function(file) {
    return fs.statSync(path.join(appsPath, file)).isDirectory();
  }) : [];

var tvAppsPath = path.join(process.cwd(), 'tv_apps');
var tvApps = fs.existsSync(tvAppsPath) ?
  fs.readdirSync(tvAppsPath).filter(function(file) {
    return fs.statSync(path.join(tvAppsPath, file)).isDirectory();
  }) : [];

// Default runtime and device type
var runtimeType = config.defaultRuntimeType;
var deviceType = config.defaultDeviceType;
var app = '';

process.argv.forEach(function(val, index, array) {
  if (runtimeTypes.indexOf(val) > -1) {
    runtimeType = val;
  } else if (deviceTypes.indexOf(val) > -1) {
    deviceType = val;
  } else if ((apps && apps.indexOf(val) > -1) ||
             (tvApps && tvApps.indexOf(val) > -1)) {
    app = val;
  }
});

var makeGaia = new Make(deviceType);
var makeApp = new Make(deviceType, app);
var runtime = new Runtime(runtimeType, deviceType);

var watcher;

function onfilechange (path) {
  console.log('File', path, 'has been changed');

  watcher.close();

  if (deviceType === 'tv' || !app || needB2gReopenList.indexOf(app) > -1) {
    runtime.stop();
  }

  if (!app) {
    makeGaia.run(function () {
      reload();
      watch();
    });
  } else {
    makeApp.run(function () {
      reload();
      watch();
    });
  }
}

function watch () {
  console.log('watch file changes...\n');

  watcher = chokidar.watch(['apps', 'tv_apps', 'shared'], {
    ignored: /build_stage/,
    persistent: true,
    cwd: process.cwd()
  });

  watcher.on('change', onfilechange);
}

// Apps that doesn't work with 'install and relaunch'
var needB2gReopenList = config.needB2gReopenList;

function reload() {
  if (deviceType === 'tv' || !app || needB2gReopenList.indexOf(app) > -1) {
    if (app && app !== 'system' && app !== 'smart-system') {
      runtime.start(app, onRuntimeClose);
    } else {
      runtime.start(null, onRuntimeClose);
    }
  } else {
    runtime.reload(app);
  }
}

function onRuntimeClose () {
  process.exit();
}

makeGaia.run(function () {
  if (app && app !== 'system' && app !== 'smart-system') {
    runtime.start(app, onRuntimeClose);
  } else {
    runtime.start(null, onRuntimeClose);
  }
  watch();
});

function exitHandler(options, err) {
  runtime.isRunning && runtime.stop();

  if (options.cleanup) console.log('clean');
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
