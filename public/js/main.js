Vue.component('help-message', {
	template: '<li class="serverHelpMessage">'+ 
					'<div>' +
					'<span>Help commands:</span><br/>' +
					'<span> /help : Displays this list</span><br/>' +
					'<span> /joinchat : Join a chatroom by entering a room name after the command.</span><br/>' +
					'<span> /joingame : Join a game room by entering a room name after the command.</span><br/>' +
					'<span> **Join commands can have an optional password parameter to make a private room. If a room does not exist it will be created.**</span><br/>' +
					'<span> /leave : Leave any room by entering the room name.</span><br/>' +
					'<span> /dm : Start a direct message room by entering the username.</span><br/>' +
					'<span> /name : Change your nickname to anything you want (If an existing name is present, new nickname will have counters appended).</span><br/>' +
					'<span> **A nickname must have no spaces. Adding a valid image url as a second parameter will result in that image being used as your user icon.**</span><br/>' +
					'</div>' +
				'</li>'
});

Vue.component('message-item', {
	props: ['item'],
	template: '<li class="serverMessage">{{message}}</li>',
	computed: {
		message: function(item){
			return this.room.name + '_messages';
		}
	}
});

Vue.component('rooms-list-item', {
	props: ['room'],
	template: '<li :id="roomId" :class="roomClass">{{roomName}}</li>', 
	computed: {
		roomId: function(){
			if(this.room.id){
				return this.room.id + '_room';
			}
			return this.room.name + '_room';
		},
		roomClass: function(){
			return this.room.type + '_class inactiveRoom';
		},
		roomName: function(){
			return this.room.name;
		}
	},
	created: function () {
		console.log("element created:" + this);
		$('#'+this.room.name+'_messages').append($('<li>').text('Joined Room:'+this.room.name).css('color','blue')); //message line
		if(this.room.name == defaultRoom){
			$('#'+this.room.name+'_messages').append($('<li>').text('Welcome to the General Chat. Type "/help" for a list of commands.').css('color','blue'));//message line
		}
	},
	mounted: function () {
		console.log("element mounted:" + this);
		var that = this;
		if(this.room.id){
			$('#'+this.room.id + '_room').click(function () {
				vm.chooseRoom(that.room);
				
			});
		}else{
			$('#'+this.room.name + '_room').click(function () {
				vm.chooseRoom(that.room);
				
			});
		}
	}
}
);

Vue.component('message-area', {
	props: ['room'],
	template: '<ul :id="roomId" :class="roomClass"></ul>',
	computed: {
		roomId: function(){
			if(this.room.id){
				return this.room.id + '_messages';
			}
			return this.room.name + '_messages';
		},
		roomClass: function(){
			return this.room.type + '_class';
		}
	}
});


Vue.component('users-list-item', {
  props: ['user'],
  template: '<li class="userListItem">' +
			'<img class="userIcon" :src="user.avatar"/>'+
			'<div class="userListName">{{user.username}}</div>' +
			'</li>'
});

const defaultRoom = 'General';
const serverRoom = 'Servers';
const roomType = {
			game: 'game',
			chat: 'chat',
			dm: 'dm',
			server: 'server'
		};
		
var vm = new Vue({
	el: '#app',
	data: {
		nickname : '',
		userList : [],
		roomList : {},
		joinedRooms : [],
		usersInRoom: [],
		currentRoom : defaultRoom, //referenced by .name which is unique
		currentRoomType : roomType.chat,
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
					return roomUsers; //new list
				}
			}
			return vm.usersInRoom; //no room change, old list
		},
		chooseRoom : function(aRoom){
			if(aRoom.id){
				if(this.currentRoom != aRoom.id){
					var oldRoom = this.currentRoom;
					this.currentRoom = aRoom.id;
					this.toggleActiveRooms(oldRoom);
				}
			}else{ 
				if(this.currentRoom != aRoom.name){
					var oldRoom = this.currentRoom;
					this.currentRoom = aRoom.name;
					this.toggleActiveRooms(oldRoom);
				}
			}
		},
		toggleActiveRooms : function (oldRoom){
			for(var room in this.joinedRooms){
				if(this.currentRoom == this.joinedRooms[room].name){
					this.currentRoomType = this.joinedRooms[room].type;
				}
			}
			$('#' +this.currentRoom+ '_room').addClass('activeRoom');
			$('#' +this.currentRoom+ '_room').removeClass('inactiveRoom');
			$('#' +this.currentRoom+ '_messages').show();
			$('#' +this.currentRoom+ '_canvas').show();
			if(oldRoom != this.currentRoom){
				$('#' +oldRoom+ '_room').removeClass('activeRoom');
				$('#' +oldRoom+ '_room').addClass('inactiveRoom');
				$('#' +oldRoom+ '_messages').hide();
				$('#' +oldRoom+ '_canvas').hide();
			}
			this.usersInRoom = this.getUsersInRoom();
			alignMessageToBottom();
		},
		start : function(){
			$('#nameform').hide();
			$('#main').show();
			connect(this.nickname);
		},
		nicknameEnter : function(event){
			if ( event.which == 13 ) {
				this.start();
			}
		},
		createNewRoom : function (room, roomDisplayName, type){
			
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
	},
	components: { //don't need these if they are globally registered
		
	}, 
	computed: {

	}
})



$('#main').hide(); //change main to display: none ??
var socket;

connect = function(name){
	socket = io();
	socket.emit('join_room', serverRoom, serverRoom, roomType.server);
	socket.emit('join_room', defaultRoom,defaultRoom, roomType.chat);
	$('#messageform').submit(function(e){
		e.preventDefault(); // prevents page reloading
		var inputval = $('#msgForm').val();
		if(inputval.charAt(0) == '/'){
			checkCommand(inputval.substring(1, inputval.length)); //trim off '/'
			return false;
		}
		socket.emit('chat_message', newMsg(socket.id, socket.username, vm.currentRoom, inputval));
		if(vm.currentRoomType == roomType.dm){ //dm's are only sent to the user dm'd, so we need to keep track of the messages we sent
			appendText(newMsg(vm.currentRoom, socket.username, vm.currentRoom,inputval));
			//$('#'+vm.currentRoom+'_messages').append($('<li>').text(socket.username + ":" + inputval)); //message line
		}
		$('#msgForm').val('');
		focusCursor('msgForm');
		return false;
	});

	socket.on('joined_room', function(room){
		console.log("Joined:" + room.name);
		vm.joinedRooms.push(room);
		vm.roomList[room.name] = room; //important
		var oldRoom = vm.currentRoom;
		vm.currentRoom = room.name;
		vm.currentRoomType = roomType[room.type];
		console.log("Room type:" + vm.currentRoomType);
		console.log(vm.$refs);
		vm.toggleActiveRooms(oldRoom);
		$('#'+room.name+'_messages').append($('<li>').text('Joined Room:'+room.name).css('color','blue')); //message line
		if(room.name == defaultRoom){
			$('#'+room.name+'_messages').append($('<li>').text('Welcome to the General Chat. Type "/help" for a list of commands.').css('color','blue'));//message line
		}
		focusCursor('msgForm');
	});

	socket.on('chat_message', function(msg){
		
		if(msg.room == null){
			msg.room = defaultRoom;
			vm.currentRoomType = roomType.chat;
		}
		
		if(msg.room == socket.id){ //private_message, needs the id to be the room
			if(!roomExists(msg.id)){
				var oldRoom = vm.currentRoom;
				vm.currentRoom = msg.id;
				vm.joinedRooms.push(newRoom(msg.id, msg.username, roomType.dm));
				vm.toggleActiveRooms(oldRoom);
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
		vm.currentRoom = defaultRoom;
		vm.toggleActiveRooms(room,vm.currentRoom);
		removeRoom(room);
		//$('#'+room+ '_room').remove();
		//$('#'+room+ '_messages').remove();
		$('#' +vm.currentRoom+ '_messages').show();
		$('#'+vm.currentRoom+'_messages').append($('<li>').text('Left Room:'+room).css('color','blue'));
		alignMessageToBottom();
	});

	removeRoom = function(name){
		console.log("remove room: "+name);
		var remove = false;
		var removeIndex = -1;
		for(var i = 0; i < vm.joinedRooms.length; i++){
			if(vm.joinedRooms[i].name == name){
				removeIndex = i;
				remove = true;
			}
		}
		if(remove){
			vm.joinedRooms.splice(removeIndex,1);
		}
	}

	socket.on('users_rooms_list', function(usrList, rooms){ //room name
		console.log("updating rooms and userlist");
		for(var r in rooms){
			console.log(rooms[r]);
		}
		for(var u in usrList){
			console.log(usrList[u]);
		}
		vm.userList = usrList;
		vm.roomList = rooms;
		vm.usersInRoom = vm.getUsersInRoom();
	});
	
	socket.on('force_name_update', function(newName){ //room name
		socket.username = newName;
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
/* 			$('#msgForm').val('');
			focusCursor('msgForm'); */
			clearAndScroll();
		}

		if(inputvalArgs[0]=="joinchat"){
			join(inputvalArgs, roomType.chat);

		}else if(inputvalArgs[0]=="joingame"){
			join(inputvalArgs, roomType.game);

		}else if(inputvalArgs[0]=="leave"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			socket.emit('leave_room', inputvalArgs[1]);
/* 			$('#msgForm').val('');
			focusCursor('msgForm'); */
			clearAndScroll();
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
					vm.joinedRooms.push(newRoom(userId, toUserName, roomType.dm));
					vm.toggleActiveRooms(oldRoom,vm.currentRoom);
				}else{
					vm.currentRoom = userId;
				}
				socket.emit('chat_message', newMsg(socket.id, socket.username, userId, message));
				$('#'+vm.currentRoom+'_messages').append($('<li>').text(socket.username + ":" + message));
				vm.currentRoomType = roomType.dm;
			}else{
				$('#'+currentRoom+'_messages').append($('<li>').text('Invalid user.').css('color','red'));
			}
	/* 		alignMessageToBottom();
			$('#msgForm').val('');
			focusCursor('msgForm'); */
			clearAndScroll();
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
				}else{
					invalidCommand();
					return;
				}
			}
			
			socket.username = name;
			socket.avatar = avatar;
			socket.emit('assign_name', newMsg(socket.id, socket.username, vm.currentRoom, name), avatar);

		}else if(inputvalArgs[0]=="debug"){
			socket.emit('debug server');
			console.log(socket);
/* 			$('#msgForm').val('');
			focusCursor('msgForm'); */

		}else if(inputvalArgs[0]=="help"){
			$('#'+vm.currentRoom+'_messages').append('<help-message></help-message>');
			/* alignMessageToBottom();
			$('#msgForm').val('');
			focusCursor('msgForm'); */

		}else{
			$('#'+currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red'));
			//alignMessageToBottom();
		}
		clearAndScroll();
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

roomExists= function(id){
	return $('#'+id+'_room').length
}

generateGameRoomName = function(){
	var name = '';
	for(var i=0; i < 6; i++){
		name += String.fromCharCode(Math.floor((Math.random()*26)+65)); //A -> Z code
	}
	return name;
}

appendImage = function(msg){
	//var output = formatImageOutput(msg);
	$('#'+msg.room+'_messages').append($('<li class="messageMedia">').append($('<img width="500" src="'+msg.msg+'"/>')));
}

appendText = function(msg){
	//var output = formatTextOutput(msg);
	$('#'+msg.room+'_messages').append($('<li class="messageText">').append('<img class="userIcon" src="'+getAvatarFromName(msg.username)+'"/><div class="messageTextContainer"><span class="msgDisplayName">'+getName(msg)+' : </span>' + msg.msg+ '</div>'));
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

getUserIdFromName = function(name){
	for(var i=0; i < vm.userList.length; i++){
		if(vm.userList[i].username == name){
			return vm.userList[i].id;
		}
	}
}

getAvatarFromName = function(name){
	if(name == 'Server'){
		return vm.defaultAvatar;
	}
	for(var i=0; i < vm.userList.length; i++){
		if(vm.userList[i].username == name){
			return vm.userList[i].avatar;
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
	if(vm.currentRoomType == roomType.game){
		scrollm = document.getElementById(currentRoom+'_messages');
	}else{
		scrollm = document.getElementById('messages');
			
	}
	scrollm.scrollTo(0,scrollm.scrollHeight);
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

newRoom = function(id,name,type){
	var room = new Object();
	room.id = id;
	room.name = name;
	room.type = type;
	room.sockets = {};
	return room;
}

focusCursor = function(id){
	$('#'+id).focus;
	$('#'+id).setActive;
	$('#'+id).select();
}
focusCursor('nickname');

clearAndScroll = function (){
	alignMessageToBottom();
	$('#msgForm').val('');
	focusCursor('msgForm');
}
