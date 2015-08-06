var exec = require('child_process').exec;
var path = require('path');
var findPorts = require('node-firefox-find-ports');
var firefoxRuntimes = require('./config').firefoxRuntimes;
var FirefoxClient = require('firefox-client');

var client;

module.exports = Runtime;

function Runtime (runtimeType, deviceType) {
  this.script = firefoxRuntimes[runtimeType] + ' -profile ';
  this.deviceType = deviceType;

  if (deviceType === 'tv') {
    this.script += path.join(process.cwd(), 'profile') + ' -start-debugger-server 6000 -screen 1920x1080';
    // this.script += ' -screen 1920x1080 app://browser.gaiamobile.org';
  } else {
    this.script += path.join(process.cwd(), 'profile') + ' -start-debugger-server 6000';
    // this.script += path.join(process.cwd(), 'profile-debug') + ' --no-remote app://sms.gaiamobile.org';
  }
}

Runtime.prototype.start = function (callback) {
  console.log('start gaia: ' + this.script);

  var process = exec(this.script);

  process.stdout.on('data', function (data) {
    console.log(data);
  });

  process.stderr.on('data', function (data) {
    console.log(data);
  });

  process.on('close', function (code) {
    console.log(code);

    if (typeof callback === 'function') {
      callback();
    }
  });
};

Runtime.prototype.reload = function (appName) {
  console.log('reloading ' + appName);

  if (!appName) {
    return;
  }

  var self = this;

  if (client) {
    this._installAndRelaunch(appName);
  } else {
    findPorts().then(function (results) {
      var isPortOpened = results.some(function (value, index, array) {
        return value.port === 6000;
      });

      if (isPortOpened) {
        console.log('found port 6000');

        client = new FirefoxClient();

        client.connect(6000, function () {
          console.log('connected to debugger server');
          self._installAndRelaunch(appName);
        });
      }
    });
  }
};

Runtime.prototype._installAndRelaunch = function (appName) {
  console.log('install and relaunch ' + appName);

  var self = this;

  client.getWebapps(function (err, webapps) {
    console.log('got webapps');

    webapps.close('app://' + appName + '.gaiamobile.org/manifest.webapp', function (err) {
      console.log(appName + ' closed');
      console.log(err);
      var installPath = path.join(process.cwd(), 'profile/webapps', appName + '.gaiamobile.org/application.zip');
      console.log('installing packaged app', installPath);
      // webapps.installPackaged(installPath, 'app://' + appName + '.gaiamobile.org/manifest.webapp', function (err, appId) {
      webapps.installPackaged(installPath, null, function (err, appId) {
        console.log(appName + ' installed');
        // webapps.launch('app://' + appName + '.gaiamobile.org/manifest.webapp', function () {
        //   console.log(appName + ' launched');
        // });

        webapps.getApp('app://' + appName + '.gaiamobile.org/manifest.webapp', function (err, actor) {
          console.log('get app', actor);
          actor.reload();
        });
      });

    });

  });
};

