var express = require('express'),
	path = require('path'),
	app = express();
app.use(express.static('public'));
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const port = 3000;
const maxUsersPerGameRoom = 4;
const maxUsersPerChatRoom = 50;
const defaultRoom = 'General';
const serverRoom = 'Servers';
const defaultName = 'anon';
const serverName = 'Server';
const roomType = {
		game: 'game',
		chat: 'chat',
		dm: 'dm',
		server: 'server'
	};
// Express Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.redirect('index.html');
});

var userList = [];

io.on('connection', function(socket){

	console.log('a user connected to default with socket:'+socket.id);

	socket.on('reconnect', function(socket){
		console.log("reconnected:");
		console.log(socket);
	});

	socket.on('disconnect', function(){
		var userName = socket.username;
		console.log("disconnected:" + userName);
		if(userName){
			removeUser(socket.id);
			var message = "Goodbye " + getName(socket) + "!";
			socket.broadcast.emit('chat_message', newMsg(serverName, serverName,null,message));
			io.emit('user_list', userList, socket.adapter.rooms);
		}
	});

	socket.on('drawing', function(msg){
		console.log(msg);
		io.to(msg.room).emit('drawing', msg);
	});

	socket.on('debug server', function(){
		console.log(io);
		console.log(socket);
		console.log(socket.adapter.rooms);
		console.log(userList);
	});

	socket.on('assign_name', function(msg){
		msg = checkForDupName(msg);
		var oldName = socket.username;
		socket.username = msg.username;
		addUser(socket.id, socket.username);
		var message;
		if(oldName == null || (typeof oldName == 'undefined')){
			message = getName(socket) + " is now chatting!";
		}else{
			console.log('a user changed their name:'+ msg.id + ": " + msg.username + ":(room: " + msg.room + ")");
			message = oldName + " now identifies as '" + getName(socket) +"'!";
		}

		io.to(defaultRoom).emit('chat_message', newMsg(serverName, serverName,null,message));
		io.emit('user_list', userList, socket.adapter.rooms);
	});

	socket.on('chat_message', function(msg){
		console.log('userid: ' + msg.id);
		console.log(' -username: ' + msg.username);
		console.log('  -room: ' + msg.room);
		console.log('   -message: ' + msg.msg);
		io.to(msg.room).emit('chat_message', msg);
	});

	socket.on('join_room', function(room, fromRoom, type, pword){
		var maxUsersPerRoom = 0;
		if(type == roomType.game){
			maxUsersPerRoom = maxUsersPerGameRoom;
		}else if(type == roomType.chat){
			maxUsersPerRoom = maxUsersPerChatRoom;
		}else{
			maxUsersPerRoom = 9999;//or something
		}
		if(socket.adapter.rooms.hasOwnProperty(room)){
			console.log("room exists");
			var userInRoom = false;
			for(var i=0; i< socket.adapter.rooms[room].length; i++){
				if(socket.adapter.rooms[room].sockets.hasOwnProperty(socket.id)){
					userInRoom = true;
				}
			}
			if(!userInRoom){
				var thisRoom = socket.adapter.rooms[room];
				if(thisRoom.length < maxUsersPerRoom){
					if(thisRoom.hasOwnProperty('pword')){ //it's private
						if(pword == thisRoom.pword){
							console.log("private " +type+ " room joined");
							socket.join(room);
							var message = getName(socket) + " joined " + room;
							io.to(room).emit('chat_message', newMsg(serverName, serverName,room,message));
							io.to(socket.id).emit('joined_room', thisRoom);
						}else{
							console.log("private " +type+ " room: access denied");
							var message = "Invalid room password. Access Denied.";
							io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
						}
					}else{ //it's public
						console.log("public " +type+ " room joined");
						socket.join(room);
						var message = getName(socket) + " joined " + room;
						io.to(room).emit('chat_message', newMsg(serverName, serverName,room,message));
						io.to(socket.id).emit('joined_room', thisRoom);
					}
				}else{
					console.log("room full");
					var message = "Room " + room + " is full!";
					io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
				}
			}else{
				var message = "Already in room...";
				io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
			}
		}else{
			if(!pword){
				console.log("created public " +type+ " room");
				socket.join(room);
				socket.adapter.rooms[room].type = type;
				socket.adapter.rooms[room].name = room;
				var message = getName(socket) + " created " + type + " " + room;
				io.to(fromRoom).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
				io.to(socket.id).emit('joined_room', socket.adapter.rooms[room]);
			}else{
				console.log("created private " +type+ " room:" + pword);
				socket.join(room);
				socket.adapter.rooms[room].pword = pword;
				socket.adapter.rooms[room].type = type;
				socket.adapter.rooms[room].name = room;
				io.to(socket.id).emit('joined_room', socket.adapter.rooms[room]);

			}
		}
		io.emit('user_list', userList,socket.adapter.rooms);
		console.log(socket.adapter.rooms);
	});

	socket.on('leave_room', function(room){
		if(room == defaultRoom){
			var message = 'Cannot leave ' + room;
			io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,room,message));
		}else if(room == serverRoom){
			var message = 'Cannot leave ' + room;
			io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,room,message));
		}else{
			io.to(socket.id).emit('left_room', room);
			socket.leave(room);
			console.log('a user left_room:'+ room);
			var message = getName(socket) + " left " + room;
			io.to(room).emit('chat_message', newMsg(serverName, serverName,room,message));
			console.log(socket.adapter.rooms);
		}
	});
});

checkForDupName = function (msg){
	for(var i=0; i < userList.length; i++){
		if(userList[i].username == msg.username){
			var index = 1;
			if(!isNaN(parseInt(msg.username.charAt(msg.username.length-index)))){
				var isNumber = true;
				while(isNumber){
					if(!isNaN(parseInt(msg.username.charAt(msg.username.length-index)))){
						//is a letter
						isNumber = false;
						var numberName = msg.username.substr(msg.username.length - index, msg.username.length);
						var stringName =  msg.username.substr(0, msg.username.length - index);
						msg.username = stringName + (parseInt(numberName) + 1);
						//console.log(index);
					}else{
						//is a number
						index++;
						//console.log(index);
					}
				}
			}else{
				msg.username = msg.username + "1";
			}
		}
	}
	return msg;
}

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
			//console.log("remove index=" + i);
		}
	}
	if(remove){
		//console.log("current userlist:" + userList);
		userList.splice(i,1);
		//console.log("after delete:" + userList);
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
	return usr;
}

getName = function(socket){
	if(socket.username){
		return socket.username;
	}else{
		return defaultName;
	}
}

http.listen(port, function(){
	console.log('listening on *:'+port);
});
