var canvas, context;
var drawing = false;
var penCursor = {
	color: '#ff0000'
};

function onResize() {
	canvas.width = (window.innerWidth *0.9);
	canvas.height = (window.innerHeight * 0.94);
}

function drawLine(x0, y0, x1, y1, color, emit){
	context.beginPath();
	context.moveTo(x0, y0);
	context.lineTo(x1, y1);
	context.strokeStyle = color;
	context.lineWidth = 3;
	context.stroke();
	context.closePath();

	if (!emit) { return; }
	var w = canvas.width;
	var h = canvas.height;
	var line = {
		x0: x0 / w,
		y0: y0 / h,
		x1: x1 / w,
		y1: y1 / h,
		color: color
	};
	
	socket.emit('drawing',newMsg(socket.id, socket.username, vm.currentRoom,line));
}

function onMouseDown(e){
	drawing = true;
	penCursor.x = e.clientX||e.touches[0].clientX;
	penCursor.y = e.clientY||e.touches[0].clientY;
}
function onMouseUp(e){
	if (!drawing) { return; }
	drawing = false;
	drawLine(penCursor.x, penCursor.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, penCursor.color, true);
}
function onMouseMove(e){
	if (!drawing) { return; }
	drawLine(penCursor.x, penCursor.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, penCursor.color, true);
	penCursor.x = e.clientX||e.touches[0].clientX;
	penCursor.y = e.clientY||e.touches[0].clientY;
}
function onDrawingEvent(msg){
	var w = canvas.width;
	var h = canvas.height;
	var data = msg.msg;
	drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}
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
