# WebVR: DOM

A shim of rendering the DOM for VR devices.

## Install

```
$ npm install webvr-dom
```


## Usage

Initiate after all the DOM elements are rendered:
```
VRDOM();
```
If you don't want to convert the whole ```body``` you can pass the element as an option in the method:
```
var el = document.getElementById('main');
VRDOM({ el: el });
```


## Options

* **update**: Automatically monitor updates in the element and re-render


## Credits

Initiated by [Makis Tracend](http://github.com/tracend)

Started as a [Makesites Hackathon](https://www.eventbrite.com/e/webvr-dom-tickets-24371493794)

Distributed through [Makesites.org](http://www.makesites.org/)

Released under the [Apatche license v2.0](http://www.makesites.org/licenses/APACHE-2.0)
