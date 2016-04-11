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
