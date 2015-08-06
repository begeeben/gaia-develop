var exec = require('child_process').exec;

module.exports = Make;

function Make (deviceType, app) {
  this.script = app ? 'APP=' + app + ' ' : 'make clean;';

  // if (app) {
  //   this.script = 'APP=' + app + ' ';
  // }

  if (deviceType === 'tv') {
    this.script += 'GAIA_DEVICE_TYPE=' + deviceType + ' DEVICE_DEBUG=1 ';
  } else {
    this.script += 'DEVICE_DEBUG=1 NOFTU=1';
  }

  if (deviceType === 'nightly') {
    this.script += 'DESKTOP=0 ';
  }

  this.script += 'make';
}

Make.prototype.run = function (callback) {
  console.log('make gaia: ' + this.script);

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
