var express = require('express'),
	path = require('path'),
	app = express();
app.use(express.static('public'));
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var tictac = require('./tictac');

const port = 3000;
const minUsersPerGameRoom = 2;
const maxUsersPerGameRoom = 6;
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
const gameStatus = {
		created: 'created',
		waiting: 'waiting',
		ready: 'ready',
		playing: 'playing',
		finished: 'finished'
	};		
const gameType = {
		tictac: 'tictac',
		paint: 'paint'
	};		
const playerStatus = {
		idle: 'idle',
		ready: 'ready',
		playing: 'playing'
	};		
const defaultAvatar = 'images/avatar.png';
const serverAvatar = 'images/server.png';
// Express Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.redirect('index.html');
});
var userList = [];
var gamelist = [];
var roomSecret = {}; //{roomName:'secret'}
var roomPassword = {}; //{roomName:'password'}

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
			io.emit('users_rooms_list', userList, socket.adapter.rooms);
		}
	});

	socket.on('drawing', function(msg){
		io.to(msg.room).emit('drawing', msg);
	});
	socket.on('user_status_update', function(msg){
		if(!socket.adapter.rooms[msg.room]){return}
		console.log("user status update");
		console.log(msg);
		console.log(socket.adapter.rooms[msg.room].type);
		if(socket.adapter.rooms[msg.room].type == roomType.game){
			if(msg.msg in playerStatus){
				socket.adapter.rooms[msg.room].playerStatus[msg.id] = msg.msg;
				console.log("Status updated");
				console.log(socket.adapter.rooms[msg.room].playerStatus[msg.id]);
				var statusN = '';
				if(Object.keys(socket.adapter.rooms[msg.room].playerStatus).length >= minUsersPerGameRoom){
					var playersReady = true;
					for(var player in socket.adapter.rooms[msg.room].playerStatus){
						console.log(playerStatus.ready)
						console.log(socket.adapter.rooms[msg.room].playerStatus[player]);
						if(socket.adapter.rooms[msg.room].playerStatus[player] != playerStatus.ready){
							playersReady = false;
							console.log('all players not ready');
						}
					}
					if(playersReady){
						console.log("Game ready");
						statusN = gameStatus.ready;
						
					}else{
						console.log("Game waiting");
						statusN = gameStatus.waiting;
					}
					socket.adapter.rooms[msg.room].roomStatus = statusN;
					io.emit('users_rooms_list', userList, socket.adapter.rooms); //will send updated room statuses
				}else{
					console.log("Game waiting");
					statusN = gameStatus.waiting;
					socket.adapter.rooms[msg.room].roomStatus = statusN;
					io.emit('users_rooms_list', userList, socket.adapter.rooms); //will send updated room statuses
				}
			}
		}
	});
	socket.on('start_game', function(msg){
		var message = '';
		if(socket.adapter.rooms[msg.room].roomStatus == gameStatus.ready){
			message = "Starting Game...";
			io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
			io.to(msg.room).emit('start_game', msg); 
			socket.adapter.rooms[msg.room].roomStatus = gameStatus.playing;
			io.emit('users_rooms_list', userList, socket.adapter.rooms); //will send updated room statuses
		}else{
			message = "Unable to start game. Game not in ready state!";
			io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
		}
	});
	socket.on('clear_canvas', function(msg){
		io.to(msg.room).emit('clear_canvas', msg);
	});
	socket.on('track_cursor', function(msg){
		io.to(msg.room).emit('track_cursor', msg);
	});
	socket.on('register_secret', function(msg){
		var message = "Secret submitted";
		var doneSecret = false;

		if(roomSecret.hasOwnProperty(msg.room)){
			if(roomSecret[msg.room] != null){
				message = "Cannot change secret until it has been guessed.";
			}else{
				roomSecret[msg.room] = msg.msg;
			}
			doneSecret = true;
		}

		if(!doneSecret){
			roomSecret[msg.room] = msg.msg;
		}
		io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,msg.room,message))
	});
	socket.on('guess_secret', function(msg){
		var message = 'No secret!';

		if(roomSecret.hasOwnProperty(msg.room)){
			if(roomSecret[msg.room] == msg.msg){
				message = "Correct Guess!";
				roomSecret[msg.room] = null;
			}else{
				message = "Incorrect Guess!";
			}
		}
		
		io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message))
	});

	socket.on('debug server', function(){
		console.log(io);
		console.log(socket);
		console.log(socket.adapter.rooms);
		console.log(userList);
	});
	
	socket.on('assign_name', function(msg, avatar){
		console.log("avatar: " + avatar);
		if(msg.username.length <= 40){
			if(avatar == null || avatar == undefined){
				avatar = defaultAvatar
			}
			var oldName = socket.username;
			if(oldName == msg.username){
				socket.avatar = avatar;
				msg = addUser(msg, socket.avatar);
			}else{
				msg.id = socket.id;
				socket.username = msg.username;
				socket.userId = msg.userId;
				socket.avatar = avatar;
			
				msg = addUser(msg, avatar);

				var message;
				if(oldName == null || (typeof oldName == 'undefined')){
					message = getName(socket) + " is now chatting!";
				}else{
					console.log('a user changed their name:'+ msg.id + ": " + msg.username + ":(room: " + msg.room + ")");
					message = oldName + " now identifies as '" + getName(socket) +"'!";
				}
				io.to(defaultRoom).emit('chat_message', newMsg(serverName, serverName,null,message));
			}
			io.to(socket.id).emit('force_name_update', msg.username);
			io.emit('users_rooms_list', userList, socket.adapter.rooms);
		}else{
			var message = "Nicknames must 40 characters or less.";
			io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,msg.room,message))		
		}
	});

	socket.on('chat_message', function(msg){
		console.log('socketId: ' + msg.id);
		console.log(' -userId: ' + msg.userId);
		console.log('   -username: ' + msg.username);
		console.log('    -room: ' + msg.room);
		console.log('     -message: ' + msg.msg);
		if(msg.room != serverRoom){
			io.to(msg.room).emit('chat_message', msg);
		}
	});
	
	socket.on('got_canvas', function(msg){
		console.log(msg.msg);
		io.to(msg.id).emit('canvas_deliver', newMsg(serverName, serverName,null,msg.msg)); //canvas image
	});
	
	socket.on('join_room', function(room, fromRoom, type, pword,gType){
		if(!room){
			var message = "Must have a room name.";
			io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
			console.log('No room name...');
			return
		};
		var maxUsersPerRoom;
		var gotCanvas = false;
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
					if((roomPassword.hasOwnProperty(room))){ //it's private
						if(pword == roomPassword[room]){
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
						socket.join(room);
						console.log("public " +type+ " room joined");
						var message = getName(socket) + " joined " + room;
						io.to(room).emit('chat_message', newMsg(serverName, serverName,room,message));
						io.to(socket.id).emit('joined_room', thisRoom);
						if(socket.adapter.rooms[room].type == roomType.game && socket.adapter.rooms[room].gameType == gameType.paint ){
							socket.to(room).emit('get_canvas', newMsg(socket.id, socket.username,room))
						}
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
			if(room.length < 50){
				if(!pword){
					console.log("created public " +type+ " room");
					socket.join(room);
					socket.adapter.rooms[room].type = type;
					socket.adapter.rooms[room].name = room;
					if(type == roomType.game){
						socket.adapter.rooms[room].roomStatus = gameStatus.created;
						socket.adapter.rooms[room].gameType = gameType[gType];
					}
					socket.adapter.rooms[room].playerStatus = {};
					var message = getName(socket) + " created " + type + " " + room;
					io.to(fromRoom).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
					io.to(socket.id).emit('joined_room', socket.adapter.rooms[room]);
				}else{
					console.log("created private " +type+ " room:" + pword);
					socket.join(room);
					roomPassword[room] = pword;
					socket.adapter.rooms[room].type = type;
					socket.adapter.rooms[room].name = room;
					if(type == roomType.game){
						socket.adapter.rooms[room].roomStatus = gameStatus.created;
						socket.adapter.rooms[room].gameType = gameType[gType];
					}
					socket.adapter.rooms[room].playerStatus = {};
					io.to(socket.id).emit('joined_room', socket.adapter.rooms[room]);
				}
				updateGameList(socket);
				io.emit('update_game_list', gamelist);
			}else{
				var message = "Room name must be less than 50 characters.";
				io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
			}
		}
		io.emit('users_rooms_list', userList, socket.adapter.rooms);
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
			io.emit('users_rooms_list', userList, socket.adapter.rooms);
		}
	});
	
	checkForDupName = function (msg){
		for(var i=0; i < userList.length; i++){
			if(userList[i].username == msg.username){ //matching username
				if(userList[i].id == msg.id){
					return false; //existing user reconnecting
				}
				return true;
			}
		}
		return false;
	}

	fixDupName = function (msg){
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
				}else{
					index++;
				}
			}
		}else{
			msg.username = msg.username + "2";
		}
		io.to(socket.id).emit('force_name_update', msg.username);
		return msg;
	}
});

updateGameList = function(socket){
	gamelist = [];
	for(var room in socket.adapter.rooms){	
		if(socket.adapter.rooms[room].type == roomType.game){
			var game = {
				gameType: socket.adapter.rooms[room].gameType,
				players: socket.adapter.rooms.sockets,
				name: socket.adapter.rooms[room].name,
				status: socket.adapter.rooms[room].roomStatus
			}
			gamelist.push(game);
		}
	}
};

addUser = function(msg, avatar){
	var newUsr = newUser(msg.id, msg.userId, msg.username, avatar);
	console.log(newUsr);
	var existsId = false;
	var existsUuid = false;
	var dupName = checkForDupName(msg);
	var matchIndex = -1;
	for(var i = 0; i < userList.length; i++){
		if(userList[i].id == newUsr.id){
			console.log("user exists, changing name...");
			matchIndex = i;
			existsId = true;
		}
		if(userList[i].userId == newUsr.userId){
			console.log("user matches existing uuid, overwriting old user...");
			matchIndex = i;
			existsUuid = true;
		}
	}
	if(dupName){
		if((!existsUuid && !existsId)){
			newUsr = fixDupName(newUsr); //add to name  +1
			userList.push(newUsr);
		}else{
			userList[matchIndex] = newUsr;
		}
	}else{
		userList[matchIndex] = newUsr;
	}

	if(!existsId && !existsUuid && !dupName){
		userList.push(newUsr);
		console.log("adding new user");
	}
	console.log("user:"+userList[userList.length-1].id + " " + userList[userList.length-1].userId + " " + userList[userList.length-1].username);
	console.log(userList.length + " users exist");
	return newUsr;
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
		console.log("current userlist:" + userList.toString());
		userList.splice(i,1);
		console.log("after delete:" + userList.toString());
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

newUser = function(id, userId,name, avatar){
	var usr = new Object();
	usr.id = id;
	usr.userId = userId;
	usr.username = name;
	usr.avatar = avatar;
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
