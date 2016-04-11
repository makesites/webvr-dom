// Rasterize

function Rasterize( el, options ){
	// save params
	this.el = el;
	this.options = options;

	var html = this.getHTML();
	var styles = this.getStyles();
	this.drawImage({ html: html, styles: styles });
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
		self.trigger('render', canvas);
	};
	// image source
	img.src = url;
};
