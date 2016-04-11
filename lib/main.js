/**
 * @name {{name}}
 * Version: {{version}} ({{build_date}})
 *
 * @author {{author}}
 * Homepage: {{homepage}}
 * @license {{#license licenses}}{{/license}}
 */

(function (lib) {

	//"use strict";

	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define('webvr-dom', [], lib); // give the module a name
	} else if ( typeof module === "object" && module && typeof module.exports === "object" ){
		// Expose as module.exports in loaders that implement CommonJS module pattern.
		module.exports = lib;
	} else {
		// Browser globals
		lib(this.window, this.document);
	}
 }(function (window, document) {

// Cross Browser stuff
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

var DOMURL = window.URL || window.webkitURL || window;

var shaders = {{{shaders}}};

{{{lib}}}

}));
