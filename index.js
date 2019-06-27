var express = require('express'),
	path = require('path'),
	app = express();
app.use(express.static('public'));
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var maxUsersPerRoom = 2;

// Express Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.redirect('index.html');
});
var defaultRoom = 'General';
var defaultName = 'anon';
var serverName = 'Server';
var userList = [];

io.on('connection', function(socket){
	socket.join(defaultRoom);
	io.to(socket.id).emit('joined room', defaultRoom);
	console.log('a user connected to default with socket:'+socket.id);
	//var message = "A new user has joined!";
	//io.to(defaultRoom).emit('chat message', newMsg(serverName, serverName,null,message)); 
	
	socket.on('reconnect', function(socket){
		console.log("reconnected:");
		console.log(socket);
	});
	
	socket.on('disconnect', function(){
		removeUser(socket.id);
		socket.emit('user list', userList);
		var message = "Goodbye " + getName(socket) + "!";
		socket.broadcast.emit('chat message', newMsg(serverName, serverName,null,message));
		io.emit('user list', userList);
	});
	
	socket.on('debug server', function(){
		console.log(io);
		console.log(socket);
		console.log(socket.adapter.rooms);

	});
	
	socket.on('assign name', function(msg){
		console.log('a user changed their name:'+ msg.id + ": " + msg.username + ":(room: " + msg.room + ")");
		var oldName = socket.username;
		socket.username = msg.username;
		addUser(socket.id, socket.username);
		var message;
		if(oldName == null || (typeof oldName == 'undefined')){
			message = getName(socket) + " is now chatting!";
		}else{
			message = oldName + " now identifies as '" + getName(socket) +"'!";
		}
		
		io.to(defaultRoom).emit('chat message', newMsg(serverName, serverName,null,message));
		io.emit('user list', userList);
	});
	
	socket.on('chat message', function(msg){
		console.log('userid: ' + msg.id);
		console.log(' username: ' + msg.username);
		console.log('  room: ' + msg.room);
		console.log('   message: ' + msg.msg);
		io.to(msg.room).emit('chat message', msg);
	});
	
	socket.on('private message', function(to,msg){
		console.log('message: ' + msg);
		io.to(to).emit('chat message', msg);
	});
	
	socket.on('join room', function(room){
		console.log('a user joined room:'+ room);
		if(socket.adapter.rooms.hasOwnProperty(room)){
			console.log("room exists");
			if(socket.adapter.rooms[room].length < maxUsersPerRoom){
				socket.join(room);
				var message = getName(socket) + " joined " + room;
				io.to(room).emit('chat message', newMsg(serverName, serverName,room,message));
				io.to(socket.id).emit('joined room', room);
			}else{
				var message = "Room " + room + " is full!";
				io.to(socket.id).emit('chat message', newMsg(serverName, serverName,room,message));
			}
		}else{
			console.log("created room");
			socket.join(room);
			io.to(room).emit('chat message', getName(socket) + " created " + room);
			io.to(socket.id).emit('joined room', room);
		}
		console.log(socket.adapter.rooms);
	});
	
	socket.on('leave room', function(room){
		if(room == defaultRoom){
			var message = 'Cannot leave ' + room;
			io.to(socket.id).emit('chat message', newMsg(serverName, serverName,room,message));
		}else{
			io.to(socket.id).emit('left room', room);
			socket.leave(room);
			console.log('a user left room:'+ room);
			var message = getName(socket) + " left " + room;
			io.to(room).emit('chat message', newMsg(serverName, serverName,room,message));
			console.log(socket.adapter.rooms);
		}
	});
});

addUser = function(id, username){
	var newUsr = newUser(id, username);
	console.log(newUsr);
	var exists = false;
	for(var i = 0; i < userList.length; i++){
		console.log("user:"+userList[i].id + " "  + userList[i].username);
		if(userList[i].id == newUsr.id){
			console.log("user exists, changing name...");
			userList[i] = newUser(userList[i].id, newUsr.username);
			exists = true;
			console.log("user:"+userList[i].id + " "  + userList[i].username);
		}
	}
	if(!exists){
		userList.push(newUsr);
	}
	console.log(userList.length + " users exist");
}

removeUser = function(id){
	console.log("remove: "+id);
	var remove = false;
	var removeIndex = -1;
	for(var i = 0; i < userList.length; i++){
		console.log(userList[i].id);
		if(userList[i].id == id){
			removeIndex = i;
			remove = true;
			console.log("remove index=" + i);
		}
	}
	if(remove){
		console.log("current userlist:" + userList);
		userList.splice(i,1);
		console.log("after delete:" + userList);
	}
}

newMsg = function(id,username,room,message){
	var msg = new Object();
	msg.id = id;
	msg.username = username;
	msg.room = room;
	msg.msg = message;
	return msg
}

newUser = function(id, name){
	var usr = new Object();
	usr.id = id;
	usr.username = name;
	//console.log("new user object:" + usr.id + " " + usr.username);
	return usr;
}

getName = function(socket){
	if(socket.username){
		return socket.username;
	}else{
		return defaultName;
	}
}
http.listen(3000, function(){
	console.log('listening on *:3000');
});