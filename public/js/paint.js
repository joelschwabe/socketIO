var canvas, context, cursorCanvas, cursorContext;
var drawing = false;
var drawType = {
	brush: 'brush',
	pencil: 'pencil',
	eyedrop: 'eyedrop',
	star: 'star',
	line: 'line',
	polygon:'polygon'
};
var penCursor = {
	type : drawType.pencil,
	color: '#ff0000',
	colorMod: false,
	colorTrim : '#ffffff',
	colorTrimMod: false,
	width: 50,
	widthMod: false,
	edgeWidth: 1,
	edgeWidthMod: false,
	points: 5,
	pointsMod: false,
	startPoint: 0,
	startPointMod: false,
	indent: 0.3,
	indentMod: false,
	mod: 0,
	x:0,
	y:0,
	xh:0,
	yh:0
};

function throttle(callback, delay) {
	var previousCall = new Date().getTime();
	return function() {
		var time = new Date().getTime();

		if ((time - previousCall) >= delay) {
			previousCall = time;
			callback.apply(null, arguments);
		}
	};
}

fillCanvas = function(canvasImage){
	var cImage = new Image();
	cImage.src = canvasImage;
	cImage.onload = function(){
		context.drawImage(cImage, 0, 0);
	}
}

clearCanvas = function(){
	context.fillStyle = "#000000";
	context.fillRect(0, 0, canvas.width, canvas.height);
}

updateColor = function(){
	penCursor.color = $('#colorPickerBar')[0].value;
	penCursor.colorTrim = $('#colorPickerTrimBar')[0].value;
}

updateModifiers = function(){
	penCursor.width = $('#widthBar')[0].value;
	penCursor.points = $('#pointBar')[0].value;
	penCursor.edgeWidth = $('#edgeWidthBar')[0].value;
	penCursor.startPoint = $('#startPointBar')[0].value;
	penCursor.indent = $('#indentBar')[0].value / 100;
	penCursor.colorMod = $('#colorPickerMod').prop('checked');
	penCursor.colorTrimMod = $('#colorPickerTrimMod').prop('checked');
	penCursor.widthMod = $('#widthMod').prop('checked');
	penCursor.pointsMod = $('#pointMod').prop('checked');
	penCursor.edgeWidthMod = $('#edgeWidthMod').prop('checked');
	penCursor.startPointMod = $('#startPointMod').prop('checked');
	penCursor.indentMod = $('#indentMod').prop('checked');
	penCursor.mod = parseInt($('#randomBar')[0].value);
}

getRandomMod = function(balance){
	var modx = Math.floor(Math.random()*(penCursor.mod/balance)); // this will get a number between 1 and penCursor.mod;
	var mody= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases
	var mod = modx * mody;
	return mod;
}

randomNumberShift = function(type, isOn, balance){
	if(isOn){
		var mod = getRandomMod(balance);
		penCursor[type] = mod;
		return penCursor[type];
	}else{
		return penCursor[type];
	}
}

randomColorShift = function(type, isOn){
	if(isOn){
		var color = '#';
		for(var i =1; i < 6; i+=2){
			var mod = getRandomMod(1);
			tempCol = '';
			var col = Math.abs(255 - (parseInt(penCursor[type].substr(i,2), 16) + mod));
			if(col < 16){
				tempCol = '0';
			}
			color += tempCol + col.toString(16);
		}
		penCursor[type] = color; 
		return color;
	}else{
		if(type=="colorTrim"){
			return penCursor.colorTrim;
			}
		if(type=="color"){
			return penCursor.color;
		}
	}
}

colorCloneHandle = function(event) {
	var imgData = context.getImageData(event.clientX, event.clientY,1,1);
	var color = '#';
	for(var i =0; i < 3; i++){
		tempCol = '';
		if(imgData.data[i] < 16){
			tempCol = '0';
		}
		color += tempCol + imgData.data[i].toString(16)
	}
	$('#colorPickerBar')[0].value = color;
	updateColor();
}

addListeners = function (){
	canvas.addEventListener('mousedown', onMouseDown, false);
	canvas.addEventListener('mouseup', onMouseUp, false);
	canvas.addEventListener('mouseout', onMouseUp, false);
	canvas.addEventListener('mousemove', onMouseMove, false);
	canvas.addEventListener('touchstart', onMouseDown, false);
	canvas.addEventListener('touchend', onMouseUp, false);
	canvas.addEventListener('touchcancel', onMouseUp, false);
	canvas.addEventListener('touchmove', onMouseMove, false);
	canvas.addEventListener('onresize', onResize, false);
}

onResize = function () {
	canvas.width = (window.innerWidth *0.9);
	canvas.height = (window.innerHeight * 0.95);
	cursorCanvas.width = (window.innerWidth *0.9);
	cursorCanvas.height = (window.innerHeight * 0.95);
}

function drawPencil(x0, y0, x1, y1, color, width,emit){
	context.beginPath();
	context.save();
	context.moveTo(x0, y0);
	context.lineTo(x1, y1);
	context.strokeStyle = color;
	context.lineWidth = width;
	context.stroke();
	context.restore();	
	context.closePath();

	if (!emit) { return; }
	var w = canvas.width;
	var h = canvas.height;
	var pencil = {
		type: drawType.pencil,
		x0: x0 / w,
		y0: y0 / h,
		x1: x1 / w,
		y1: y1 / h,
		color: color,
		width: width
	};
	
	socket.emit('drawing',newMsg(socket.id, socket.username, vm.currentRoom,pencil));
}

function drawStar(x0, y0, color, colorTrim, width, edgeWidth, points, indent, startPoint, emit){
	context.save();
	context.beginPath();
	context.fillStyle = color; 
	context.strokeStyle = colorTrim; 
	context.lineWidth = edgeWidth;
	context.lineJoin = 'miter';
	context.miterLimit = 100;
    context.translate(x0, y0);
	context.rotate(startPoint * Math.PI / 180);
    context.moveTo(0,0-width);
    for (var i = 0; i < points; i++)
    {
        context.rotate(Math.PI / points);
        context.lineTo(0, 0 - (width*indent));
        context.rotate(Math.PI / points);
        context.lineTo(0, 0 - width);
    }
	context.closePath();
    context.fill();
	
	context.stroke();
	
    context.restore();	
	

	if (!emit) { return; }
	var w = canvas.width;
	var h = canvas.height;
	var star = {
		type: drawType.star,
		x0: x0 / w,
		y0: y0 / h,
		width: width,
		edgeWidth: edgeWidth,
		points: points,
		indent: indent,
		startPoint: startPoint,
		color: color,
		colorTrim : colorTrim
	};
	
	socket.emit('drawing',newMsg(socket.id, socket.username, vm.currentRoom, star));
}

function drawPolygon(x0, y0, color, colorTrim, width, edgeWidth, points, startPoint, emit) {
	if (points < 3) return;
	context.beginPath();
	context.save();
	context.strokeStyle = colorTrim; //color of edge
	context.fillStyle = color; //color of inside
	context.lineWidth = edgeWidth;
	context.lineJoin = 'miter';
	context.miterLimit = 100;
	var a = ((Math.PI * 2)/points);
	context.translate(x0,y0);
	context.rotate(startPoint * Math.PI / 180);
	context.moveTo(width,0);
	for (var i = 1; i <= points; i++) {
		context.lineTo(width*Math.cos(a*i),width*Math.sin(a*i));
	}
	context.fill();
	context.stroke();
	context.restore();
	context.closePath();

	if (!emit) { return; }
	var w = canvas.width;
	var h = canvas.height;
	var polygon = {
		type: drawType.polygon,
		x0: x0 / w,
		y0: y0 / h,
		width: width,
		points: points,
		edgeWidth: edgeWidth,
		startPoint: startPoint,
		color: color,
		colorTrim : colorTrim
	};
	
	socket.emit('drawing',newMsg(socket.id, socket.username, vm.currentRoom, polygon));
}

function drawBrush(x0, y0, color, width, emit){
	context.beginPath();
	context.save();
	context.strokeStyle = color; //color of edge
	context.fillStyle = color; //color of inside
	context.arc(x0, y0, width, 0, 2 * Math.PI);
	context.fill();
	context.stroke();
	context.restore();
	context.closePath();

	if (!emit) { return; }
	var w = canvas.width;
	var h = canvas.height;
	var splotch = {
		type: drawType.brush,
		x0: x0 / w,
		y0: y0 / h,
		color: color,
		width: width
	};
	
	socket.emit('drawing',newMsg(socket.id, socket.username, vm.currentRoom,splotch));
}

function trackCursor() {
	var w = canvas.width;
	var h = canvas.height;
	var cursor = {
		x: penCursor.x / w,
		y: penCursor.y / h,
		color: penCursor.color
	};
	var coor = "Coordinates: (" + penCursor.x + "," + penCursor.y + ")";
	document.getElementById("cursorCoords").innerHTML = coor;
	socket.emit('track_cursor',newMsg(socket.id, socket.username, vm.currentRoom,cursor));
}

function onMouseDown(e){
	drawing = true;
	trackPen(e);
	doDraw(e);
}
function onMouseMove(e){
	if (!drawing) { 
		trackPen(e);
		trackCursor();
		return; 
	}
	doDraw(e);
	trackPen(e)
	trackCursor();
}
function onMouseUp(e){
	if (!drawing) { return; }
	drawing = false;
}

function doDraw(e){
	if(penCursor.type == drawType.brush){
		drawBrush(e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY,  randomColorShift('color',penCursor.colorMod), randomNumberShift('width',penCursor.widthMod,1),true);
	}else if(penCursor.type == drawType.pencil){
		drawPencil(penCursor.x, penCursor.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY,  randomColorShift('color',penCursor.colorMod),  randomNumberShift('width',penCursor.widthMod,1),true);
	}else if(penCursor.type == drawType.star){
		drawStar(e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY,  randomColorShift('color',penCursor.colorMod),  randomColorShift('colorTrim',penCursor.colorTrimMod), 
			randomNumberShift('width',penCursor.widthMod,1), randomNumberShift('edgeWidth',penCursor.edgeWidthMod,1), randomNumberShift('points',penCursor.pointsMod,5), randomNumberShift('indent',penCursor.indentMod,5), randomNumberShift('startPoint',penCursor.startPointMod,1), true); 
	}else if(penCursor.type == drawType.polygon){
		drawPolygon(e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, randomColorShift('color',penCursor.colorMod), randomColorShift('colorTrim',penCursor.colorTrimMod), 
		randomNumberShift('width',penCursor.widthMod,1), randomNumberShift('edgeWidth',penCursor.edgeWidthMod,1), randomNumberShift('points',penCursor.pointsMod,5), randomNumberShift('startPoint',penCursor.startPointMod,1), true); 
	}else if(penCursor.type == drawType.eyedrop){
		colorCloneHandle(e);
	}
}
function trackPen(e){
	penCursor.x = e.clientX||e.touches[0].clientX;
	penCursor.y = e.clientY||e.touches[0].clientY;
}

function onDrawingEvent(msg){
	var w = canvas.width;
	var h = canvas.height;
	var data = msg.msg;
	if(data.type == drawType.pencil){
		drawPencil(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.width);
	}
	if(data.type == drawType.brush){
		drawBrush(data.x0 * w, data.y0 * h, data.color, data.width);
	}
	if(data.type == drawType.star){
		drawStar(data.x0 * w, data.y0 * h, data.color, data.colorTrim, data.width, data.edgeWidth, data.points, data.indent, data.startPoint);
	}
	if(data.type == drawType.polygon){
		drawPolygon(data.x0 * w, data.y0 * h, data.color, data.colorTrim, data.width, data.edgeWidth, data.points, data.startPoint);
	}
}

//draw frame for cursor_canvas
function drawCursor(){
	cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
	var p = 20;
	var w = cursorCanvas.width;
	var h = cursorCanvas.height;
	for(var c in vm.cursors){
		var x = vm.cursors[c].msg.x * w;
		var y = vm.cursors[c].msg.y * h;
		//x += 10; //idk why
		var col = vm.cursors[c].msg.color;
 		cursorContext.beginPath(); //draw crosshair
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x - p, y);
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x + p, y);
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x , y - p);
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x , y + p);
		cursorContext.strokeStyle = col;
		cursorContext.lineWidth = 2;
		cursorContext.stroke(); 
		cursorContext.closePath();
	}
	window.requestAnimationFrame(drawCursor);
}

function ontrackCursor(msg){
	vm.cursors[msg.id] = msg;
}


