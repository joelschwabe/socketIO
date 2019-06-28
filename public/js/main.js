const defaultRoom = 'General';
var currentRoom = defaultRoom;
var roomType = {
		game: 'game',
		chat: 'chat',
		dm: 'dm'
	};
var currentRoomType = roomType.chat;
$('#main').hide();
var name = '';
var userList = [];

connect = function(name){
	var socket = io();
	
	$('#messageform').submit(function(e){
		e.preventDefault(); // prevents page reloading
		var inputval = $('#m').val();
		if(inputval.charAt(0) == '/'){
			checkCommand(inputval.substring(1, inputval.length)); //trim off /
			return false;
		}
		socket.emit('chat message', newMsg(socket.id, socket.username, currentRoom, inputval));
		if(currentRoomType == roomType.dm){ //dm's are only sent to the user dm'd, so we need to keep track of the messages we sent
			$('#'+currentRoom+'_messages').append($('<li>').text(socket.username + ":" + inputval));
		}
		$('#m').val('');
		return false;
	});
	
	socket.on('joined room', function(room){
		console.log("Joined:" + room);
		
		var oldRoom = currentRoom;
		currentRoom = room;
		createNewRoom(room, room);
		toggleActiveRooms(oldRoom,currentRoom);
		$('#'+room+'_messages').append($('<li>').text('Joined Room:'+room).css('color','blue'))
	});
	
	socket.on('room updated', function(room){
		var users = room.sockets;
		
	});

	socket.on('chat message', function(msg){
		var mediaChk = document.createElement('a');
		mediaChk.href = msg.msg;
		var imgChkValid = checkIfImage(mediaChk);
		var checkVideoValid = checkIfVideo(mediaChk);
		if(msg.room == null){
			msg.room = defaultRoom;
			currentRoomType = roomType.chat;
		}

		if(msg.room == socket.id){ //private message, needs the id to be the room
			if(!roomExists(msg.id)){
				var oldRoom = currentRoom;
				currentRoom = msg.id;
				createNewRoom(msg.id, msg.username);
				toggleActiveRooms(oldRoom,currentRoom);
			}
			msg.room = msg.id;
			currentRoomType = roomType.dm;
		}

		if(imgChkValid){
			appendImage(msg)
		}else if(checkVideoValid){
			appendVideo(msg);
		}else{
			appendText(msg);
		}
		window.scrollTo(0,document.body.scrollHeight);
	});
	
	socket.on('left room', function(room){
		currentRoom = defaultRoom;
		$('#'+room+ '_room').remove();
		$('#'+room+ '_messages').remove();
		$('#' +currentRoom+ '_messages').show();
		$('#'+currentRoom+'_messages').append($('<li>').text('Left Room:'+room).css('color','blue'));
		alignMessageToBottom();
	});
	
	socket.on('user list', function(usrList){
		userList = usrList;
		console.log(userList);
		updateUserList(userList);
	});
	
	checkCommand = function (inputval){
		var inputvalArgs = inputval.split(' ');
		
		if(inputvalArgs[0]=="joinchat"){
			join(inputvalArgs, 'chat');
			
		}else if(inputvalArgs[0]=="joingame"){
			join(inputvalArgs, 'game');
			
		}else if(inputvalArgs[0]=="leave"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			socket.emit('leave room', inputvalArgs[1]);
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="dm"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			var toUserName = inputvalArgs[1];
			var userId = getUserIdFromName(toUserName);
			if(userId){
				var message = '';
				for(var i = 2; i < inputvalArgs.length; i++){
					message+=inputvalArgs[i] + ' ';
				}
				if(!roomExists(userId)){
					var oldRoom = currentRoom;
					currentRoom = userId;
					createNewRoom(userId, toUserName);
					toggleActiveRooms(oldRoom,currentRoom);
				}
				socket.emit('chat message', newMsg(socket.id, socket.username, userId, message));
				$('#'+currentRoom+'_messages').append($('<li>').text(socket.username + ":" + message));
				currentRoomType = roomType.dm;
			}else{
				$('#'+currentRoom+'_messages').append($('<li>').text('Invalid user.').css('color','red'));
			}
			alignMessageToBottom();
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="name"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			var name = '';
			for(var i = 1; i < inputvalArgs.length; i++){
				name+=inputvalArgs[i]
			}	
			socket.username = name;
			socket.emit('assign name', newMsg(socket.id, socket.username, currentRoom, name));
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="debug"){
			socket.emit('debug server');
			$('#'+currentRoom+'_messages').append($('<li>').append(JSON.stringify(socket))).css('color','purple');
			alignMessageToBottom();
			console.log(socket);
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="help"){
			$('#'+currentRoom+'_messages').append($('<li>').append(getHelp()).css('color','purple'));
			alignMessageToBottom();
			$('#m').val('');
								
		}else{
			$('#'+currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red'));
			alignMessageToBottom();
		}
		
		join = function(inputAr, type){
			if(inputAr.length < 2){
				invalidCommand();
				return;
			}
			if(inputAr.length == 2){
				socket.emit('join room', inputAr[1],currentRoom);
			}else{
				var pword = '';
				for(var i = 2; i < inputAr.length; i++){
					pword+=inputAr[i];
				}
				socket.emit('join room', inputAr[1],currentRoom, pword, type);
			}
			$('#m').val('');
		}
	}
	invalidCommand = function(){
		$('#'+currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red'));
	}
	
	socket.username = name;
	socket.emit('assign name', newMsg(socket.id, socket.username, currentRoom, name));
	console.log("First name change:" + socket.id + "->" + name);
}

chooseRoom = function(aRoom){
	if(currentRoom != aRoom){
		var oldRoom = currentRoom;
		currentRoom = aRoom;
		toggleActiveRooms(oldRoom,currentRoom);
	}
}

roomExists= function(id){
	return $('#'+id+'_room').length
}

createNewRoom = function (room, roomDisplayName){
	$('#roomsList').append($('<li id="' +room+ '_room" onclick="chooseRoom(\''+room+'\')" >').text(roomDisplayName));
	$('#messages').append($('<ul id="'+room+'_messages"></ul>'));
}	

toggleActiveRooms = function (oldRoom,newRoom){
	$('#' +newRoom+ '_room').addClass('activeRoom');
	$('#' +newRoom+ '_room').removeClass('inactiveRoom');
	$('#' +newRoom+ '_messages').show();
	if(oldRoom != newRoom){
		$('#' +oldRoom+ '_room').removeClass('activeRoom');
		$('#' +oldRoom+ '_room').addClass('inactiveRoom');
		$('#' +oldRoom+ '_messages').hide();
	}
}	

appendImage = function(msg){
	//var output = formatImageOutput(msg);
	$('#'+msg.room+'_messages').append($('<li>').append($('<img src="'+msg.msg+'"/>')));
}

appendText = function(msg){
	var output = formatTextOutput(msg);
	$('#'+msg.room+'_messages').append($('<li>').text(output));
}

appendVideo = function(msg){
	//var output = formatVideoOutput(msg);
	$('#'+msg.room+'_messages')
	.append($('<li>')
		.append($('<iframe width="560" height="315" ' +
		'src="'+ msg +'" ' +
		'frameborder="0" allow="accelerometer; autoplay; '+
		'encrypted-media; gyroscope; picture-in-picture" '+
		'allowfullscreen></iframe>'))
	);
}
	
checkIfImage = function (url){
	if(url.protocol.indexOf('http:') || url.protocol.indexOf('https:')){
			var pathNameExt = url.pathname;
			if(pathNameExt){
				if(pathNameExt.indexOf('.jpg') > -1){
					return true;
				}else if(pathNameExt.indexOf('.jpeg')> -1){
					return true;
				}else if(pathNameExt.indexOf('.png')> -1){
					return true;
				}else if(pathNameExt.indexOf('.bmp')> -1){
					return true;
				}else if(pathNameExt.indexOf('.tiff')> -1){				
					return true;
				}else if(pathNameExt.indexOf('.gif')> -1){		
					return true;
				}else{
					return false;
				}
			}
	}
	return false;
}

checkIfVideo = function (url){
	if(url.protocol.indexOf('http:') || url.protocol.indexOf('https:')){
			var pathNameExt = url.pathname;
			if(pathNameExt){
				if(pathNameExt.indexOf('/embed/') > -1){
					var hostNameExt = url.hostname;
					if(hostNameExt){
						if(hostNameExt == "www.youtube.com"){
							return true;
						}else if(hostNameExt=="www.dailymotion.com"){
							return true;
						}else{
							return false;
						}
					}
				}
			}
	}
	return false;
}

updateUserList = function(users){
	$('#usersList').remove();
	$('#users').append($('<ul id="usersList" class="sideList"></ul>'));
	for(var i=0; i < users.length; i++){
		$('#usersList').append($('<li>').text(users[i].username));
	}
}

getUserIdFromName = function(name){
	for(var i=0; i < userList.length; i++){
		if(userList[i].username == name){
			return userList[i].id;
		}
	}
}

formatTextOutput = function(msg){
	var output = getName(msg);
	output += msg.msg;
	return output;
}

alignMessageToBottom = function(){
	window.scrollTo(0,document.body.scrollHeight);
}

getName = function(msg){
	var output;
	if(msg.username){
		output = msg.username + ": ";
	}else{
		output = "anon: ";
	}
	return output;
}

newMsg = function(id,username,room,message){
	var msg = new Object();
	msg.id = id;
	msg.username = username;
	msg.room = room;
	msg.msg = message;
	return msg
}

start = function(){
	name = $('#nickname').val();
	$('#nameform').hide();
	$('#main').show();
	connect(name);
}

$( "#nickname" ).keydown(function( event ) {
	if ( event.which == 13 ) {
		start();
	}
});

getHelp = function(){
	var helpHtml = document.createElement('div');
	var span = document.createElement('span');
	span.innerText = "Help commands:";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));
	span = document.createElement('span');
	span.innerText = " /help : Displays this list";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));
	span = document.createElement('span');
	span.innerText = "/joinchat : Join a chatroom by entering a room name after the command.";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));
	span = document.createElement('span');
	span.innerText = "/joingame : Join a game room by entering a room name after the command.";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));	
	span = document.createElement('span');
	span.innerText = "** Join commands can have an optional password parameter to make a private room. If a room does not exist it will be created.";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));	
	span = document.createElement('span');
	span.innerText = " /leave : Leave any room by entering the room name.";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));
	span = document.createElement('span');
	span.innerText = " /name : Change your nickname to anything you want (If an existing name is present, new nickname will have counters appended).";
	helpHtml.appendChild(span);
	return helpHtml;
}