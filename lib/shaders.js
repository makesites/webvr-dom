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
