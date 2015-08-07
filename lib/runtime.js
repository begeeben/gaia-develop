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
  this.childProcess = null;

  if (deviceType === 'tv') {
    // XXX: display resolution has to be bigger than the -screen attribute
    this.script += path.join(process.cwd(), 'profile') + ' -start-debugger-server 6000 -screen 1280x720';
    // this.script += ' -screen 1920x1080 app://browser.gaiamobile.org';
  } else {
    this.script += path.join(process.cwd(), 'profile') + ' -start-debugger-server 6000';
    // this.script += path.join(process.cwd(), 'profile-debug') + ' --no-remote app://sms.gaiamobile.org';
  }
}

Runtime.prototype.start = function (callback) {
  console.log('start gaia: ' + this.script);

  this.childProcess = exec(this.script);

  this.childProcess.stdout.on('data', function (data) {
    console.log(data);
  });

  this.childProcess.stderr.on('data', function (data) {
    console.log(data);
  });

  this.childProcess.on('close', function (code, signal) {
    console.log(code);

    if (typeof callback === 'function') {
      callback();
    }

    if (signal === 'reopen') {
      self.start();
    }
  });
};

Runtime.prototype.stop = function () {
  this.childProcess.kill();
};

Runtime.prototype.reopen = function () {
  this.stop();
  this.start();
};

Runtime.prototype.reload = function (appName) {
  console.log('reloading ' + appName);

  if (!appName) {
    console.log('no app selected');
    return;
  }

  var self = this;

  if (client) {
    // XXX: check connection first
    console.log('debugger server connected');
    this._installAndRelaunch(appName);

  } else {
    console.log('finding ports... \n');
    findPorts({detailed: true}).then(function (results) {
      // console.log('found ports', results);

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
    }, function (err) {
      console.log(err);
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
      // XXX: for 3rd party apps to work might need to get the appId argument from getInstalledApps
      webapps.installPackaged(installPath, appName + '.gaiamobile.org', function (err, appId) {
        console.log(appName + ' installed');
        webapps.launch('app://' + appName + '.gaiamobile.org/manifest.webapp', function () {
          console.log(appName + ' launched');
        });

        // webapps.getApp('app://' + appName + '.gaiamobile.org/manifest.webapp', function (err, actor) {
        //   console.log('get app', actor);
        //   actor.reload(function (err) {
        //     if (!err) {
        //       console.log('app reloaded');
        //     }
        //   });
        // });

        // To get a appId of any app
        // webapps.getInstalledApps(function (err, apps) {
        //   console.log('get installed apps', apps);
        // });
      });

    });

  });
};

