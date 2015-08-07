# gaia-develop
Developing gaia was always more cumbersome to me comparing to developing web apps. The main difference is that live reload is broadly supported for developing web apps. This project aims to remove this gap by providing live reload to gaia app development.
## Prerequisites
This module currently only works on Mac.

* Download b2g desktop from https://ftp.mozilla.org/pub/mozilla.org/b2g/nightly/latest-mozilla-central/ .
* Put b2g.app in Applications folder.
* Use node.js 0.12.7. (Other node.js versions may run into problems with the watch functionality of chokidar.)

## Installation
```bash
npm install -g gaia-develop
```
## Usage
In your gaia folder, run
```bash
gaia-develop b2g [deviceType] [appName]
```
## Examples
```bash
gaia-develop b2g phone sms
```
Shorthand version:
```bash
gaia-develop sms
```
If no ```appName``` argument is provided, on file changes it will rebuild Gaia and restart b2g.
## Known Issues
https://github.com/begeeben/gaia-develop/issues
