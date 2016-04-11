// VRDOM
// stop in case this becomes part of the official API
window.VRDOM = window.VRDOM || function( options ){
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
	this.raster.on('render', function( texture ){
		self.hideDOM(); // do this only once?
		self.shader.draw( texture );
	});

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
