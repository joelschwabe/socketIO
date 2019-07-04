
Vue.component('users-list', {
  template: '<ul id="usersList" class="sideList"></ul>'
})
Vue.component('users-list-item', {
  props: ['user'],
  template: '<li class="userListItem">' +
			'<img class="userIcon" :src="user.avatar"/>'+
			'<div class="userListName">{{user.username}}</div>' +
			'</li>'
})

var vm = new Vue({
	el: '#app',
	data: {
		defaultRoom : 'General',
		serverRoom : 'Servers',
		userList : [{}],
		roomList : [{}],
		usersInRoom: [{}],
		currentRoom : '',
		currentRoomType : '',
		roomType : {
			game: 'game',
			chat: 'chat',
			dm: 'dm',
			server: 'server'
		},
		user :{
			id: '',
			username: '',
			avatar: ''
		},	
		defaultAvatar :  'http://www.newdesignfile.com/postpic/2009/09/generic-user-profile_354184.png'
	},
	methods: {
		getUsersInRoom :  function(){
			var roomUsers = [];
			for(var room in this.roomList){
				if(this.roomList[room].name == this.currentRoom){
					for(var i=0; i < this.userList.length; i++){
						if(this.roomList[room].sockets.hasOwnProperty(this.userList[i].id)){
							if(this.userList[i].avatar == null || (typeof this.userList[i].avatar == 'undefined')){
								this.userList[i].avatar  = this.defaultAvatar;
							}
							roomUsers.push(this.userList[i]);
						}
					}
				}
			}
			return roomUsers;
		}
		
	},
/* 	components: {
		'users-list': usersList,
		'users-list-item' : usersListItem
	}, */
	computed: {

	}
})







$('#main').hide(); //change main to display: none ??
var name = '';
var socket;

connect = function(name){
	socket = io();
	socket.emit('join_room', vm.serverRoom, vm.serverRoom, vm.roomType.server);
	socket.emit('join_room', vm.defaultRoom,vm.currentRoom, vm.roomType.chat);
	$('#messageform').submit(function(e){
		e.preventDefault(); // prevents page reloading
		var inputval = $('#m').val();
		if(inputval.charAt(0) == '/'){
			checkCommand(inputval.substring(1, inputval.length)); //trim off '/'
			return false;
		}
		socket.emit('chat_message', newMsg(socket.id, socket.username, vm.currentRoom, inputval));
		if(vm.currentRoomType == vm.roomType.dm){ //dm's are only sent to the user dm'd, so we need to keep track of the messages we sent
			$('#'+currentRoom+'_messages').append($('<li>').text(socket.username + ":" + inputval));
		}
		$('#m').val('');
		focusCursor('m');
		return false;
	});

	socket.on('joined_room', function(room){
		console.log("Joined:" + room.name);
		var oldRoom = vm.currentRoom;
		vm.currentRoom = room.name;
		createNewRoom(room.name, room.name, room.type);
		vm.curretRoomType = vm.roomType[room.type];
		vm.currentRoomType = vm.roomType[room.type];
		console.log("Room type:" + vm.currentRoomType);
		toggleActiveRooms(oldRoom,vm.currentRoom);
		$('#'+room.name+'_messages').append($('<li>').text('Joined Room:'+room.name).css('color','blue'))
		if(room.name == vm.defaultRoom){
			$('#'+room.name+'_messages').append($('<li>').text('Welcome to the General Chat. Type "/help" for a list of commands.').css('color','blue'))
		}
		focusCursor('m');
	});

	socket.on('chat_message', function(msg){
		
		if(msg.room == null){
			msg.room = vm.defaultRoom;
			vm.currentRoomType = vm.roomType.chat;
		}
		
		if(msg.room == socket.id){ //private_message, needs the id to be the room
			if(!roomExists(msg.id)){
				var oldRoom = vm.currentRoom;
				vm.currentRoom = msg.id;
				createNewRoom(msg.id, msg.username, roomType.dm);
				toggleActiveRooms(oldRoom,vm.currentRoom);
			}
			msg.room = msg.id;
			vm.currentRoomType = roomType.dm;
		}
		
		var urlMsgsToEmbed = [];

		var msgTextRecieved = msg.msg.split(' ');
		var msgTextDisplayed = ''; //make as innerHTML later
		for(var word in msgTextRecieved){
			if(isUrlValid(msgTextRecieved[word])){
				//make embed
				//add as 'a' element to list
				var mediaChk = document.createElement('a');
				mediaChk.href = msgTextRecieved[word];
				mediaChk.text = msgTextRecieved[word]; //maybe trim this?
				mediaChk.target = "_blank";
				msgTextDisplayed += $(mediaChk).context.outerHTML + " ";
				//add embed to list in order of appearance
				urlMsgsToEmbed.push(newMsg(msg.id, msg.username, msg.room, mediaChk));
			}else{
				//add as text
				msgTextDisplayed += msgTextRecieved[word] + " ";
			}
			
		}
		appendText(newMsg(msg.id, msg.username, msg.room,msgTextDisplayed));
		
		for(var msg in urlMsgsToEmbed){
			var imgChkValid = checkIfImage(urlMsgsToEmbed[msg].msg);
			var checkVideoValid = checkIfVideo(urlMsgsToEmbed[msg].msg);
			var checkAudioValid = checkIfAudio(urlMsgsToEmbed[msg].msg);
			if(imgChkValid){
				appendImage(urlMsgsToEmbed[msg])
			}else if(checkVideoValid){
				appendVideo(urlMsgsToEmbed[msg]);
			}else if(checkAudioValid){
				appendAudio(urlMsgsToEmbed[msg]);
			}else{
				//nothing
			} 
		}
		

		alignMessageToBottom();
	});

	socket.on('left_room', function(room){
		vm.currentRoom = vm.defaultRoom;
		toggleActiveRooms(room,vm.currentRoom);
		removeRoom(room);
		$('#'+room+ '_room').remove();
		$('#'+room+ '_messages').remove();
		$('#' +vm.currentRoom+ '_messages').show();
		$('#'+vm.currentRoom+'_messages').append($('<li>').text('Left Room:'+room).css('color','blue'));
		alignMessageToBottom();
	});

	removeRoom = function(name){
		console.log("remove room: "+name);
		var remove = false;
		var removeIndex = -1;
		for(var i = 0; i < vm.roomList.length; i++){
			if(vm.roomList[i].name == name){
				removeIndex = i;
				remove = true;
			}
		}
		if(remove){
			vm.roomList.splice(i,1);
		}
	}

/* 	socket.on('user_list', function(usrList, rooms){ //room name
		console.log("updating userlist:" + usrList);
		userList = usrList;
		roomList = rooms;
		updateUserList(userList, currentRoom);
	}); */
	socket.on('user_list', function(usrList, rooms){ //room name
		console.log("updating userlist:" + usrList);
		console.log("updating roomlist:" + rooms);
		vm.userList = usrList;
		vm.roomList = rooms;
		vm.usersInRoom = vm.getUsersInRoom();
	});
	
	socket.on('drawing', onDrawingEvent);

	checkCommand = function (inputval){
		var inputvalArgs = inputval.split(' ');
		join = function(inputAr, type){
			if(inputAr.length < 2){
				invalidCommand();
				return;
			}
			if(inputAr.length == 2){
				socket.emit('join_room', inputAr[1],vm.currentRoom, type);
			}else{
				var pword = '';
				for(var i = 2; i < inputAr.length; i++){
					pword+=inputAr[i];
				}
				socket.emit('join_room', inputAr[1],vm.currentRoom, type, pword);
			}
			$('#m').val('');
			focusCursor('m');
		}

		if(inputvalArgs[0]=="joinchat"){
			join(inputvalArgs, vm.roomType.chat);

		}else if(inputvalArgs[0]=="joingame"){
			join(inputvalArgs, vm.roomType.game);

		}else if(inputvalArgs[0]=="leave"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			socket.emit('leave_room', inputvalArgs[1]);
			$('#m').val('');
			focusCursor('m');

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
					var oldRoom = vm.currentRoom;
					vm.currentRoom = userId;
					createNewRoom(userId, toUserName, vm.roomType.dm);
					toggleActiveRooms(oldRoom,vm.currentRoom);
				}
				socket.emit('chat_message', newMsg(socket.id, socket.username, userId, message));
				$('#'+vm.currentRoom+'_messages').append($('<li>').text(socket.username + ":" + message));
				vm.currentRoomType = vm.roomType.dm;
			}else{
				$('#'+currentRoom+'_messages').append($('<li>').text('Invalid user.').css('color','red'));
			}
			alignMessageToBottom();
			$('#m').val('');
			focusCursor('m');

		}else if(inputvalArgs[0]=="name"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			var name =inputvalArgs[1];
			var mediaChk = document.createElement('a');
			var avatar = null;
			if(inputvalArgs.length == 3){
				mediaChk.href = inputvalArgs[2];
				if(checkIfImage(mediaChk)){
					avatar = mediaChk.href;
				}
			}
			
			socket.username = name;
			socket.avatar = avatar;
			socket.emit('assign_name', newMsg(socket.id, socket.username, vm.currentRoom, name), avatar);
			$('#m').val('');
			focusCursor('m');

		}else if(inputvalArgs[0]=="debug"){
			socket.emit('debug server');
			console.log(socket);
			$('#m').val('');
			focusCursor('m');

		}else if(inputvalArgs[0]=="help"){
			$('#'+currentRoom+'_messages').append($('<li>').append(getHelp()).css('color','purple'));
			alignMessageToBottom();
			$('#m').val('');
			focusCursor('m');

		}else{
			$('#'+currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red'));
			alignMessageToBottom();
		}

	}
	invalidCommand = function(){
		$('#'+vm.currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red'));
	}

	socket.username = name;
	socket.emit('assign_name', newMsg(socket.id, socket.username, vm.currentRoom, name));
	console.log("First name change:" + socket.id + "->" + name);
}


function isUrlValid(userInput) {
	var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/
    var res = userInput.match(urlPattern);
    if(res == null)
        return false;
    else
        return true;
}

chooseRoom = function(aRoom){
	if(vm.currentRoom != aRoom){
		var oldRoom = vm.currentRoom;
		vm.currentRoom = aRoom;
		vm.currentRoom = aRoom;//
		toggleActiveRooms(oldRoom,vm.currentRoom);
	}
}

roomExists= function(id){
	return $('#'+id+'_room').length
}

createNewRoom = function (room, roomDisplayName, type){
	$('#roomsList').append($('<li id="' +room+ '_room" class="'+type+'_class" onclick="chooseRoom(\''+room+'\')" >').text(roomDisplayName));
	
	if(type==vm.roomType.game){
		$('#messages').append($('<canvas class="'+type+'_class" id="'+room+'_canvas"></canvas>'));
		$('#messages').append($('<ul id="'+room+'_messages" class="'+type+'_message"></ul>'));
		canvas = document.getElementById(room+'_canvas');
		context = canvas.getContext('2d');
		canvas.addEventListener('mousedown', onMouseDown, false);
		canvas.addEventListener('mouseup', onMouseUp, false);
		canvas.addEventListener('mouseout', onMouseUp, false);
		canvas.addEventListener('mousemove', throttle(onMouseMove, 5), false);

		//Touch support for mobile devices
		canvas.addEventListener('touchstart', onMouseDown, false);
		canvas.addEventListener('touchend', onMouseUp, false);
		canvas.addEventListener('touchcancel', onMouseUp, false);
		canvas.addEventListener('touchmove', throttle(onMouseMove, 5), false);
		onResize();

		context.fillStyle = "#FF0000";
		context.fillRect(0, 0, canvas.width, canvas.height);

	}else{
		$('#messages').append($('<ul id="'+room+'_messages" class="'+type+'_class"></ul>'));
	}
}


generateGameRoomName = function(){
	var name = '';
	for(var i=0; i < 6; i++){
		name += String.fromCharCode(Math.floor((Math.random()*26)+65)); //A -> Z code
	}
	return name;
}

toggleActiveRooms = function (oldRoom,newRoom){
	for(var i = 0; i < vm.roomList.length; i++){
		if(newRoom == vm.roomList[i].name){
			vm.currentRoomType = vm.roomList[i].type;
		}
	}
	$('#' +newRoom+ '_room').addClass('activeRoom');
	$('#' +newRoom+ '_room').removeClass('inactiveRoom');
	$('#' +newRoom+ '_messages').show();
	$('#' +newRoom+ '_canvas').show();
	if(oldRoom != newRoom){
		$('#' +oldRoom+ '_room').removeClass('activeRoom');
		$('#' +oldRoom+ '_room').addClass('inactiveRoom');
		$('#' +oldRoom+ '_messages').hide();
		$('#' +oldRoom+ '_canvas').hide();
	}
	//updateUserList(userList, currentRoom);
	vm.usersInRoom = vm.getUsersInRoom();
	alignMessageToBottom();
}

appendImage = function(msg){
	//var output = formatImageOutput(msg);
	$('#'+msg.room+'_messages').append($('<li class="messageMedia">').append($('<img width="500" src="'+msg.msg+'"/>')));
}

appendText = function(msg){
	//var output = formatTextOutput(msg);
	$('#'+msg.room+'_messages').append($('<li class="messageText">').append('<span class="msgDisplayName">'+getName(msg)+' : </span>' + msg.msg));
}

appendVideo = function(msg){
	var output = formatVideoOutput(msg.msg);
	$('#'+msg.room+'_messages')
	.append($('<li class="messageMedia">')
		.append($('<iframe width="560" height="315" ' +
		'src="'+ output +'" ' +
		'frameborder="0" allow="accelerometer; autoplay; '+
		'encrypted-media; gyroscope; picture-in-picture" '+
		'allowfullscreen></iframe>'))
	);
}

appendAudio = function (msg){
	//todo

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

checkIfAudio = function (url){
/* 	if(url.protocol.indexOf('http:') || url.protocol.indexOf('https:')){
		var hostNameExt = url.hostname;
		if(hostNameExt){
			if(hostNameExt == "bandcamp.com"){

			}else{
				return false;
			}
		}
	} */
	return false;
}

checkIfVideo = function (url){
	if(url.protocol.indexOf('http:') || url.protocol.indexOf('https:')){
		var hostNameExt = url.hostname;
		if(hostNameExt){
			if(hostNameExt == "www.youtube.com"){
				return true;
			}else if(hostNameExt=="www.dailymotion.com"){
				return true;
			}else if(hostNameExt=="www.twitch.tv"){
				return true;
			}else if(hostNameExt=="vimeo.com"){
				return true;
			}else if(hostNameExt=="www.bitchute.com"){
				return true;	
			}else{
				return false;
			}
		}
	}
	return false;
}
/* 
updateUserList = function(users, thisRoom){
	$('#usersList').remove();
	$('#users').append($('<ul id="usersList" class="sideList"></ul>'));//recreate after destroying
	var usersInRoom = [];
	
	for(var room in roomList){
		if(roomList[room].name == thisRoom){
			for(var i=0; i < users.length; i++){
				if(roomList[room].sockets.hasOwnProperty(users[i].id)){
					var avatar = users[i].avatar;
					if(users[i].avatar == null || (typeof users[i].avatar == 'undefined')){
						avatar = defaultAvatar;
					}
					var userAvatar = '<img class="userIcon" src="'+avatar+'"width="40" height="40"/>';
					$('#usersList').append($('<li>').append(userAvatar).append('<div class="userListName">'+users[i].username+'</div>'));
				}
			}
		}
	}
} */

getUserIdFromName = function(name){
	for(var i=0; i < vm.userList.length; i++){
		if(vm.userList[i].username == name){
			return vm.userList[i].id;
		}
	}
}

formatTextOutput = function(msg){
	var output = getName(msg);
	output += msg.msg;
	return output;
}

formatVideoOutput = function(mediaChk){
	var output = '';
	var msg = mediaChk.href;
	var hostNameExt = mediaChk.hostname;
		if(hostNameExt){
			if(hostNameExt == "www.youtube.com"){
				var w = "/watch?v=";
				var vId = msg.substr(msg.indexOf(w)+w.length, msg.length);
				output = mediaChk.protocol + mediaChk.hostname + "/embed/" + vId;
			}else if(hostNameExt=="www.dailymotion.com"){
				var w = "/video/";
				var vId = msg.substr(msg.indexOf(w)+w.length, msg.length);
				output = mediaChk.protocol + mediaChk.hostname + "/embed/video/" + vId;
			}else if(hostNameExt=="vimeo.com"){
				var w = ".com/";
				var vId = msg.substr(msg.indexOf(w)+w.length, msg.length);
				var extraSlash = vId.indexOf('/');
				if(extraSlash){
					vId = vId.substr(0,vId.indexOf(extraSlash)+2);
				}
				output = mediaChk.protocol + "//player.vimeo.com/" + "video/" + vId;
			}else if(hostNameExt=="www.twitch.tv"){
				var w = ".tv/";
				var vId = msg.substr(msg.indexOf(w)+w.length, msg.length);
				output = mediaChk.protocol + "//player.twitch" + w + "?channel=" + vId;
			}else if(hostNameExt=="www.bitchute.com"){
				var w = "/video/";
				var vId = msg.substr(msg.indexOf(w)+w.length, msg.length);
				output = mediaChk.protocol + mediaChk.hostname + "/embed/" + vId;				
			}else{
				return msg;
			}
		}
	return output;
}

alignMessageToBottom = function(){
	var scrollm;
	if(vm.currentRoomType == vm.roomType.game){
		scrollm = document.getElementById(currentRoom+'_messages');
	}else{
		scrollm = document.getElementById('messages');
			
	}
	scrollm.scrollTo(0,scrollm.scrollHeight)
}

getName = function(msg){
	var output;
	if(msg.username){
		output = msg.username;
	}else{
		output = "anon";
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
	span = document.createElement('span');
	span.innerText = " A nickname must have no spaces. Adding a valid image url as a second parameter will result in that image being used as your user icon.";
	helpHtml.appendChild(span);
	return helpHtml;
}

focusCursor = function(id){
	$('#'+id).focus;
	$('#'+id).setActive;
	$('#'+id).select();
}
focusCursor('nickname');

start = function(){
	name = $('#nickname').val();
	$('#nameform').hide();
	$('#main').show();
	connect(name);
}
