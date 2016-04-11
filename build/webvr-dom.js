/**
 * @name webvr-dom
 * Version: 0.1.0 (Mon, 11 Apr 2016 11:15:25 GMT)
 *
 * @author makesites
 * Homepage: https://github.com/makesites/webvr-dom
 * @license Apache License, Version 2.0
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

var shaders = {"distortion.fs":"precision highp float; uniform sampler2D texture; uniform vec2 LensCenter; uniform vec2 ScreenCenter; uniform vec2 Scale; uniform vec2 ScaleIn; uniform vec4 HmdWarpParam; varying vec2 oTexCoord;  vec2 HmdWarp(vec2 in01) {  vec2 theta  = (in01 - LensCenter) * ScaleIn;  float rSq  = theta.x * theta.x + theta.y * theta.y;  vec2 rvector = theta * (HmdWarpParam.x + HmdWarpParam.y * rSq +   HmdWarpParam.z * rSq * rSq +   HmdWarpParam.w * rSq * rSq * rSq);   return LensCenter + Scale * rvector; }  void main() {  vec2 tc = HmdWarp(oTexCoord);   if (any(bvec2(clamp(tc,ScreenCenter-vec2(0.25,0.5), ScreenCenter+vec2(0.25,0.5)) - tc)))  {   gl_FragColor = vec4(vec3(0.0), 1.0);    return;  }   gl_FragColor = texture2D(texture, tc); } ","distortion.vs":"attribute vec2 coord; varying vec2 oTexCoord;  void main() {  oTexCoord = coord;  gl_Position = vec4((coord-vec2(0.5))*2.0, 0.0, 1.0); } ","texture.fs":"precision highp float; uniform sampler2D texture; varying vec2 texCoord;  void main() {  gl_FragColor = texture2D(texture, texCoord); } ","texture.vs":"attribute vec2 pos; attribute vec2 coord; uniform vec2 offset; varying vec2 texCoord;  void main() {  texCoord = coord;  gl_Position = vec4(pos + offset, 0.0, 1.0); } "};

var defaults = {
	update: true
};
/*	1080:
var HMD = {
	distortionK: [1.0, 0.22, 0.24, 0.0],
	chromaAbCorrection: [ 0.996, -0.004, 1.014, 0.0],
	hScreenSize: 0.12576,
	vScreenSize: 0.07074,
	hResolution: 1920,
	vResolution: 1080,
	eyeToScreenDistance: 0.041,
	interpupillaryDistance: 0.0635,
	lensSeparationDistance: 0.0635
}
*/
var HMD = {
	hScreenSize: 0.14976,
	vScreenSize: 0.0936,
	hResolution: 1280,
	vResolution: 800,
	distortionK: [1.0, 0.22, 0.24, 0.0],
	chromaAbCorrection:  [ 0.996, -0.004, 1.014, 0.0],
	eyeToScreenDistance: 0.041,
	interpupillaryDistance: 0.064,
	lensSeparationDistance: 0.064
};

// Rasterize

function Rasterize( el, options ){
	// save params
	this.el = el;
	this.options = options;

	var html = this.getHTML();
	var styles = this.getStyles();
	this.drawImage({ html: html, styles: styles });

	return this;
}

Rasterize.prototype.getHTML = function(){
	var html = this.el.innerHTML;
	// cleanup
	html = html.replace(/<!--[\s\S]*?-->/gi, ''); // html comments
	html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); //script tags

	return html;
};

Rasterize.prototype.getStyles = function(){

	var styles = ''; // get computed styles...
	// TBA
	return styles;
};

Rasterize.prototype.drawImage = function( data ){
	// Variables
	var self = this;
	var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
				'<foreignObject width="100%" height="100%">' +
				'<div xmlns="http://www.w3.org/1999/xhtml">' +
				data.html +
				'</div>' +
				'</foreignObject>' +
				'</svg>';

	var blob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}); //data:text/html;charset=utf-8 //image/png;base64,image/svg+xml;charset=utf-8
	var url = DOMURL.createObjectURL(blob);

	img = new Image();
	img.crossOrigin = "anonymous";
	img.crossOrigin = 'http://profile.ak.fbcdn.net/crossdomain.xml';//crossdomain xml file, this is facebook example
	img.width  = 1280;
	img.height = 800;
	//img.preserveAspectRatio =

	img.onload = function (){
		var canvas = document.createElement("canvas");
		canvas.id = "dom";
		canvas.width  = 1280;
		canvas.height = 800;
		canvas.crossOrigin = "anonymous";
		//document.body.appendChild(canvas);
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		//image = cloneCanvas(dom);
		//image = image.toDataURL('image/png');
		DOMURL.revokeObjectURL(url);
		// use canvas as texture
		var event = new CustomEvent('render', { detail: null }); // canvas is tainted...
		self.el.dispatchEvent(event);
	};
	// image source
	img.src = url;
};

// Shaders

function Shaders( el, options ){
	// save params
	this.el = el;
	this.options = options;

	// create output canvas element
	var canvas = document.createElement("canvas");
	canvas.id = "webvr-dom";
	canvas.width  = 1280;
	canvas.height = 800;
	canvas.style.position = "absolute";
	canvas.style.top = 0;
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	canvas.style.zIndex = 9999;
	canvas.crossOrigin = "anonymous";
	this.el.appendChild(canvas);
	// get WebGL context
	var gl;
	if(!window.WebGLRenderingContext){
		// the browser doesn't even know what WebGL is
		window.location = "http://get.webgl.org";
	} else {
		gl = canvas.getContext("webgl"); // = canvas.getContext("experimental-webgl");

	}
	if (!gl) return error('WebGL context not available');
	// save for later
	this.gl = gl;

}

Shaders.prototype.draw = function( source ){
	// Initialize WebGL Context
	var canvas = document.getElementById("webvr-dom"),
		gl = this.gl;

	// Initialize Left Eye
	this.left = {
		source	: null,
		texture	: this.initTexture(gl)
	};

	// Initialize Right Eye
	this.right = {
		source	: null,
		texture	: this.initTexture(gl)
	};

	this.left.source = source;
	this.right.source = source;

	// Initialize Programs
	this.position = this.initPosition();
	this.distortion = this.initDistortion();

	// Update Loop
	this.update();
};

// Create Shader
Shaders.prototype.createShader = function(gl, str, type){
	var shader = gl.createShader(type);
	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	return shader;
};

// Create Program
Shaders.prototype.createProgram = function(gl, vstr, fstr){
	var program = gl.createProgram();
	var vshader = this.createShader(gl, vstr, gl.VERTEX_SHADER);
	var fshader = this.createShader(gl, fstr, gl.FRAGMENT_SHADER);

	gl.attachShader(program, vshader);
	gl.attachShader(program, fshader);
	gl.linkProgram(program);

	return program;
};

// Initialize Texture
Shaders.prototype.initTexture = function(gl){
	var texture = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	return texture;
};

// Initialize Position
Shaders.prototype.initPosition = function(){
	var gl = this.gl;
	// Initialize Vertex Buffer
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

	// Vertex Data
	var vertices = [
		-1.0, -1.0, 0, 0,
		0.0, -1.0, 1, 0,
		-1.0,  1.0, 0, 1,
		0.0,  1.0, 1, 1
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	// Create Program
	var texVs = shaders['texture.vs'];
	var texFs = shaders['texture.fs'];
	var program = this.createProgram(gl, texVs, texFs);
	gl.useProgram(program);

	program.vertexPosAttrib = gl.getAttribLocation(program, 'pos');
	gl.enableVertexAttribArray(program.vertexPosAttrib);
	gl.vertexAttribPointer(program.vertexPosAttrib, 2, gl.FLOAT, false, 16, 0);

	program.vertexCoordAttrib = gl.getAttribLocation(program, 'coord');
	gl.enableVertexAttribArray(program.vertexCoordAttrib);
	gl.vertexAttribPointer(program.vertexCoordAttrib, 2, gl.FLOAT, false, 16, 8);

	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

	return program;
};

// Initialize Distortion
Shaders.prototype.initDistortion = function(){
	// Initialize Frame Buffer
	var gl = this.gl;
	var buffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);

	// Initialize Texture
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	var w = 1280;
	var h = 800;
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

	// Create Program
	var vs = shaders['distortion.vs'];
	var fs = shaders['distortion.fs'];
	var program = this.createProgram(gl, vs, fs);
	gl.useProgram(program);

	program.vertexCoordAttrib = gl.getAttribLocation(program, 'coord');
	gl.enableVertexAttribArray(program.vertexCoordAttrib);
	gl.vertexAttribPointer(program.vertexCoordAttrib, 2, gl.FLOAT, false, 16, 8);

	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

	return {
		buffer	: buffer,
		texture	: texture,
		program	: program
	};
};

// Update Eye
Shaders.prototype.updateEye = function(gl, eye){
	gl.bindTexture(gl.TEXTURE_2D, eye.texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, eye.source);
};

Shaders.prototype.update = function() {
	// Variables
	var gl = this.gl,
		position = this.position,
		distortion = this.distortion;

	this.updateEye(gl, this.left);
	this.updateEye(gl, this.right);

	gl.bindFramebuffer(gl.FRAMEBUFFER, distortion.buffer);
	gl.useProgram(position);

	gl.uniform2f(gl.getUniformLocation(position, "offset"), 0, 0);
	gl.bindTexture(gl.TEXTURE_2D, this.left.texture);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	gl.uniform2f(gl.getUniformLocation(position, "offset"), 1, 0);
	gl.bindTexture(gl.TEXTURE_2D, this.right.texture);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(distortion.program);
	gl.bindTexture(gl.TEXTURE_2D, distortion.texture);

	//var aspect = HMD.hResolution / (2*HMD.vResolution);
	//console.log( aspect );
	//var r = -1.0 - (4 * (HMD.hScreenSize/4 - HMD.lensSeparationDistance/2) / HMD.hScreenSize);
	//var distScale = (HMD.distortionK[0] + HMD.distortionK[1] * Math.pow(r,2) + HMD.distortionK[2] * Math.pow(r,4) + HMD.distortionK[3] * Math.pow(r,6));

	gl.uniform2f(gl.getUniformLocation(distortion.program, "Scale"), 0.1469278, 0.2350845); //: new THREE.Vector2(1.0/distScale, 1.0*aspect/distScale);
	gl.uniform2f(gl.getUniformLocation(distortion.program, "ScaleIn"), 4, 2.5); //: new THREE.Vector2(1.0,1.0/aspect);
	gl.uniform4f(gl.getUniformLocation(distortion.program, "HmdWarpParam"), 1, 0.22, 0.24, 0); //:new THREE.Vector4(HMD.distortionK[0], HMD.distortionK[1], HMD.distortionK[2], HMD.distortionK[3]);
	//uniforms['chromAbParam'].value = new THREE.Vector4(HMD.chromaAbParameter[0], HMD.chromaAbParameter[1], HMD.chromaAbParameter[2], HMD.chromaAbParameter[3]);

	// Scissors
	gl.enable(gl.SCISSOR_TEST);

	// Left Eye
	gl.scissor(0, 0, 640, 800);
	gl.uniform2f(gl.getUniformLocation(distortion.program, "LensCenter"), 0.2863248, 0.5);
	gl.uniform2f(gl.getUniformLocation(distortion.program, "ScreenCenter"), 0.25, 0.5);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	// Right Eye
	gl.scissor(640, 0, 640, 800);
	gl.uniform2f(gl.getUniformLocation(distortion.program, "LensCenter"), 0.7136753, 0.5);
	gl.uniform2f(gl.getUniformLocation(distortion.program, "ScreenCenter"), 0.75, 0.5);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	gl.disable(gl.SCISSOR_TEST);
};

// Utils

// Clone canvas content to another
function cloneCanvas(oldCanvas) {

	//create a new canvas
	var newCanvas = document.createElement('canvas');
	var context = newCanvas.getContext('2d');

	//set dimensions
	newCanvas.width = oldCanvas.width;
	newCanvas.height = oldCanvas.height;

	//apply the old canvas to the new one
	context.drawImage(oldCanvas, 0, 0);

	//return the new canvas
	return newCanvas;
}

// Log Errors
function error(e) {
	console.log(e);
}

// Common.js extend method: https://github.com/commons/common.js
function extend(){
	var objects = Array.prototype.slice.call( arguments ); // to array?
	var destination = {};
	for( var obj in objects ){
		var source = objects[obj];
		for (var property in source){
			if (source[property] && source[property].constructor && source[property].constructor === Object) {
				destination[property] = destination[property] || {};
				destination[property] = arguments.callee(destination[property], source[property]);
			} else {
				destination[property] = source[property];
			}
		}
	}
	return destination;
}

// VRDOM
var VRDOM = function( options ){
	// fallbacks
	options = options || {};
	// find element
	this.el = options.el || document.getElementsByTagName('body')[0]; // fallback to body
	delete options.el;
	// extend defaults
	this.options = extend({}, defaults, options);
	// variables
	var dom, img, image;
	var self = this;

	// init main classes
	this.raster = new Rasterize( this.el, this.options );
	this.shader = new Shaders( this.el, this.options );
	// events
	this.el.addEventListener('render', function( e ){
		self.hideDOM(); // do this only once?
		self.shader.draw( e.detail );
	}, false);

};

// Update method to refresh render
VRDOM.prototype.update = function(){
	// Variables
	// ...
	// condition only when there are changes...
	this.shader.update();
	// Loop
	requestAnimationFrame( this.update.bind(this) );

};

VRDOM.prototype.hideDOM = function(){
	var el = this.el;
	// hide all elements
	for( var i = 0; i < this.el.childNodes.length; i++ ){
		// skip if not an element
		var cel = el.childNodes[i];
		if( cel.nodeType !== 1 ) continue;
		// skip script tags or the vrdom canvas
		var tag = cel.tagName.toLowerCase();
		if( tag == "script" || (tag == "canvas" && cel.id == "webvr-dom") ) continue;
		// hide all other elements
		cel.style.visibility = "hidden";
	}
	/*
	var parser = new DOMParser(), doc = parser.parseFromString(html, "text/xml");
	doc.firstChild // => <div id="foo">...
	doc.firstChild.firstChild // => <a href="#">...
	*/
};


// stop in case this becomes part of the official API
window.VRDOM = window.VRDOM || function( options ){
	new VRDOM( options );
};

}));
