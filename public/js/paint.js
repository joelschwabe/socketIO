var canvas, context, cursorCanvas, cursorContext;
var drawing = false;
var drawType = {
	brush: 'brush',
	line: 'line',
	eyedrop: 'eyedrop'
};
var penCursor = {
	type : drawType.line,
	color: '#ff0000',
	lineWidth: 2,
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

clearCanvas = function(){
	context.fillStyle = "#000000";
	context.fillRect(0, 0, canvas.width, canvas.height);
}

updateColor = function(){
	penCursor.color = $('#colorPickerBar')[0].value;
}

updatelineWidth = function(){
	penCursor.lineWidth = $('#lineWidthBar')[0].value;
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

addEyeDropListeners = function (){
	canvas.addEventListener('mousedown', colorCloneHandle, false);
}
removeEyeDropListeners = function (){
	canvas.removeEventListener('mousedown', colorCloneHandle, false);
}
addLineListeners = function (){
	canvas.addEventListener('mousedown', lineOnMouseDown, false);
	canvas.addEventListener('mouseup', lineOnMouseUp, false);
	canvas.addEventListener('mouseout', lineOnMouseUp, false);
	canvas.addEventListener('mousemove', lineOnMouseMove, false);
	canvas.addEventListener('touchstart', lineOnMouseDown, false);
	canvas.addEventListener('touchend', lineOnMouseUp, false);
	canvas.addEventListener('touchcancel', lineOnMouseUp, false);
	canvas.addEventListener('touchmove', lineOnMouseMove, false);
}

removeLineListeners = function (){
	canvas.removeEventListener('mousedown', lineOnMouseDown, false);
	canvas.removeEventListener('mouseup', lineOnMouseUp, false);
	canvas.removeEventListener('mouseout', lineOnMouseUp, false);
	canvas.removeEventListener('mousemove', lineOnMouseMoveThrottle, false);
	canvas.removeEventListener('touchstart', lineOnMouseDown, false);
	canvas.removeEventListener('touchend', lineOnMouseUp, false);
	canvas.removeEventListener('touchcancel', lineOnMouseUp, false);
	canvas.removeEventListener('touchmove', lineOnMouseMoveThrottle, false);
}

addBrushListeners = function (){
	canvas.addEventListener('mousedown', brushOnMouseDown, false);
	canvas.addEventListener('mouseup', brushOnMouseUp, false);
	canvas.addEventListener('mouseout', brushOnMouseUp, false);
	canvas.addEventListener('mousemove', brushOnMouseMove, false);
	canvas.addEventListener('touchstart', brushOnMouseDown, false);
	canvas.addEventListener('touchend', brushOnMouseUp, false);
	canvas.addEventListener('touchcancel', brushOnMouseUp, false);
	canvas.addEventListener('touchmove', brushOnMouseMove, false);
	
}

removeBrushListeners = function(){
	canvas.removeEventListener('mousedown', brushOnMouseDown, false);
	canvas.removeEventListener('mouseup', brushOnMouseUp, false);
	canvas.removeEventListener('mouseout', brushOnMouseUp, false);
	canvas.removeEventListener('mousemove', brushOnMouseMove, false);
	canvas.removeEventListener('touchstart', brushOnMouseDown, false);
	canvas.removeEventListener('touchend', brushOnMouseUp, false);
	canvas.removeEventListener('touchcancel', brushOnMouseUp, false);
	canvas.removeEventListener('touchmove', brushOnMouseMove, false);
}

onResize = function () {
	canvas.width = (window.innerWidth *0.9);
	canvas.height = (window.innerHeight * 0.95);
	cursorCanvas.width = (window.innerWidth *0.9);
	cursorCanvas.height = (window.innerHeight * 0.95);
}

function drawLine(x0, y0, x1, y1, color, lineWidth,emit){
	context.beginPath();
	//context.moveTo(penCursor.xh, penCursor.yh); //historic last drawn end-of-line location
	//context.lineTo(x0, y0); //reported last cursor location by event handler
	//context.lineTo(x1, y1); //current event handler location 
	context.moveTo(x0, y0);
	context.lineTo(x1, y1);
	context.strokeStyle = color;
	context.lineWidth = lineWidth;
	context.stroke();
	context.closePath();

	if (!emit) { return; }
	var w = canvas.width;
	var h = canvas.height;
	var line = {
		type: drawType.line,
		x0: x0 / w,
		y0: y0 / h,
		x1: x1 / w,
		y1: y1 / h,
		color: color,
		lineWidth: lineWidth
	};
	
	socket.emit('drawing',newMsg(socket.id, socket.username, vm.currentRoom,line));
}

function drawBrush(x0, y0, color, lineWidth, emit){
	context.beginPath();
	context.strokeStyle = color; //color of edge
	context.fillStyle = color; //color of inside
	context.arc(x0, y0, lineWidth, 0, 2 * Math.PI);
	context.fill();
	context.stroke();
	context.closePath();

	if (!emit) { return; }
	var w = canvas.width;
	var h = canvas.height;
	var splotch = {
		type: drawType.brush,
		x0: x0 / w,
		y0: y0 / h,
		color: color,
		lineWidth: lineWidth
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

function lineOnMouseDown(e){
	drawing = true;
	penCursor.x = e.clientX||e.touches[0].clientX;
	penCursor.y = e.clientY||e.touches[0].clientY;
}
function lineOnMouseMove(e){
	if (!drawing) { 
		penCursor.x = e.clientX||e.touches[0].clientX;
		penCursor.y = e.clientY||e.touches[0].clientY;
		trackCursor();
		return; 
	}
	drawLine(penCursor.x, penCursor.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, penCursor.color, penCursor.lineWidth,true);
	penCursor.x = e.clientX||e.touches[0].clientX;
	penCursor.y = e.clientY||e.touches[0].clientY;
	trackCursor();
}
function lineOnMouseUp(e){
	if (!drawing) { return; }
	drawing = false;
	drawLine(penCursor.x, penCursor.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, penCursor.color, penCursor.lineWidth, true); //un-needed?
}

function brushOnMouseDown(e){
	drawing = true;
	penCursor.x = e.clientX||e.touches[0].clientX;
	penCursor.y = e.clientY||e.touches[0].clientY;
}
function brushOnMouseMove(e){
	if (!drawing) { 
		penCursor.x = e.clientX||e.touches[0].clientX;
		penCursor.y = e.clientY||e.touches[0].clientY;
		trackCursor();
		return; 
	}
	drawBrush(e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, penCursor.color, penCursor.lineWidth,true);
	penCursor.x = e.clientX||e.touches[0].clientX;
	penCursor.y = e.clientY||e.touches[0].clientY;
	trackCursor();
}
function brushOnMouseUp(e){
	if (!drawing) { return; }
	drawing = false;
	drawBrush(e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, penCursor.color, penCursor.lineWidth, true); //un-needed?
}

lineOnMouseMoveThrottle = function(){
	throttle(lineOnMouseMove, 10);
}
brushOnMouseMoveThrottle = function(){
	throttle(brushOnMouseMove, 10);
}

function onDrawingEvent(msg){
	var w = canvas.width;
	var h = canvas.height;
	var data = msg.msg;
	if(data.type == drawType.line){
		drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.lineWidth);
	}
	if(data.type == drawType.brush){
		drawBrush(data.x0 * w, data.y0 * h, data.color, data.lineWidth);
	}
}

//draw frame for cursor_canvas
function drawCursor(){
	cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
	var p = 20;
	var r = 6;
	var w = cursorCanvas.width;
	var h = cursorCanvas.height;
	for(var c in vm.cursors){
		var x = vm.cursors[c].msg.x * w;
		var y = vm.cursors[c].msg.y * h;
		x += 10;
		var col = vm.cursors[c].msg.color;
 		cursorContext.beginPath();
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x - p, y);
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x + p, y);
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x , y - p);
		cursorContext.moveTo(x , y);
		cursorContext.lineTo(x , y + p);
		cursorContext.strokeStyle = col;
		cursorContext.lineWidth = 3;
		cursorContext.stroke(); 
/* 		cursorContext.beginPath();
		cursorContext.arc(x+(r*2),y,r,0,2*Math.PI);
		cursorContext.strokeStyle = col;
		cursorContext.lineWidth = 3;
		cursorContext.stroke(); */
		cursorContext.closePath();
	}
	window.requestAnimationFrame(drawCursor);
}

function ontrackCursor(msg){
	vm.cursors[msg.id] = msg;
}


