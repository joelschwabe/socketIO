const defaultRoom = 'General';
var currentRoom = defaultRoom;
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
		$('#m').val('');
		return false;
	});
	
	socket.on('joined room', function(room){
		console.log("Joined:" + room);
		
		var oldRoom = currentRoom;
		currentRoom = room;
		$('#roomsList').append($('<li id="' +room+ '_room" onclick="chooseRoom(\''+room+'\')" >').text(room));
		$('#messages').append($('<ul id="'+room+'_messages"></ul>'));
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
		$('#'+room+ '_room').remove;
		$('#'+room+ '_messages').remove;
		$('#'+currentRoom+'_messages').append($('<li>').text('Left Room:'+room).css('color','blue'));
	});
	
	socket.on('user list', function(usrList){
		userList = usrList;
		console.log(userList);
		updateUserList(userList);
	});
	
	checkCommand = function (inputval){
		var inputvalArgs = inputval.split(' ');
		
		if(inputvalArgs[0]=="join"){
			socket.emit('join room', inputvalArgs[1]);
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="leave"){
			socket.emit('leave room', inputvalArgs[1]);
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="dm"){
			socket.emit('private message', inputval);
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="name"){
			socket.username = inputvalArgs[1];
			socket.emit('assign name', newMsg(socket.id, socket.username, currentRoom, inputvalArgs[1]));
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="debug"){
			socket.emit('debug server');
			console.log(socket);
			$('#m').val('');
			
		}else if(inputvalArgs[0]=="help"){
			$('#'+currentRoom+'_messages').append($('<li>').append(getHelp()).css('color','purple'));
			$('#m').val('');
								
		}else{
			$('#'+currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red'));
		}
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
	//var output = formatOutput(msg);
	$('#'+msg.room+'_messages').append($('<li>').append($('<img src="'+msg.msg+'"/>')));
}

appendText = function(msg){
	var output = formatTextOutput(msg);
	$('#'+msg.room+'_messages').append($('<li>').text(output));
}

appendVideo = function(msg){
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
	for(var i=0; i < users.length; i++){
		$('#usersList').append($('<li>').text(users[i].username));
	}
}

formatTextOutput = function(msg){
	var output = getName(msg);
	output += msg.msg;
	return output;
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
	span.innerText = "/join : Join a room by entering a room name after the command. If the room does not exist it will be created.";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));
	span = document.createElement('span');
	span.innerText = " /leave : Leave a room by entering the room name.";
	helpHtml.appendChild(span);
	helpHtml.appendChild(document.createElement('br'));
	span = document.createElement('span');
	span.innerText = " /name : Change your nickname to anything you want (If an existing name is present, new nickname will have counters appended).";
	helpHtml.appendChild(span);
	return helpHtml;
}