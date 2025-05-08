Vue.component('server-row', {
	props: ['game'],
	template: '<tr class="serverRow"><td>{{game.players.length}}</td><td>{{game.name}}</td><td>{{game.gameType}}</td><td>{{game.status}}</td><td><button :id="buttonId" v-if="game.status != \'playing\'" class="tableButton">Join</button></td></tr>',
	computed: {
		buttonId: function(){
			return "joinButton_" + this.game.name;
		}
	},
	mounted: function () {
		console.log("element mounted:" + this);
		var that = this;
		$('#joinButton_'+this.game.name).click(function () {
			vm.joinGame(that.game.name, that.game.gameType);
		});
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
			return 'inactiveRoom roomlist_class';
		},
		roomName: function(){
			return this.room.name + " - (" + this.room.type + ")";
		}
	},
	created: function () {
		if(this.room.name != serverRoom){
			$('#'+this.room.name+'_messages').append($('<li class="internalMessage">').text('Joined Room:'+this.room.name)); /***MESSAGE***/
			if(this.room.name == defaultRoom){
				$('#'+this.room.name+'_messages').append($('<li class="internalMessage">').text('Welcome to the General Chat. Type "/help" for a list of commands.')); /***MESSAGE***/
			}
		}
	},
	mounted: function () {
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
});

Vue.component('message-area', {
	props: ['room'],
	template: 	'<div class="messageAreaContainer">'+
					'<div v-if="isGame && !isServer" class="gameMessageAreaContainer">' +
						'<div v-if="hasCanvas">'+
							'<canvas :id="cursorCanvasID" class="cursor_class"></canvas>'+
							'<canvas :id="roomId" :class="roomClass"></canvas>'+
						'</div>'+
						'<div v-if="hasGameDiv">'	+
							'<div :id="gameDivId" :class="gameDivClass"><div :id="ticDivId" :class="gameTypeClass"></div></div>'+
						'</div>'+
						'<ul :id="gameMessages" :class="gameClass"></ul>'+
					'</div>'+
					'<div v-else="!isGame && !isServer">' +
						'<ul :id="roomId" :class="roomClass"></ul>'+
					'</div>'+
				'</div>',
	computed: {
		roomId: function(){
			if(this.room.type==roomType.game){
				return this.room.name + '_canvas';
			}
			if(this.room.id){
				return this.room.id + '_messages';
			}
			return this.room.name + '_messages';
		},
		roomClass: function(){
			return this.room.type + '_class';
		},
		gameDivClass: function(){
			return this.room.type + '_class' + ' gameDivClass';
		},
		gameTypeClass: function(){
			return this.room.gameType;
		},
		gameMessages : function(){
			return this.room.name + '_messages';
		},
		gameDivId : function(){
			return this.room.name + '_game';
		},
		ticDivId :  function(){
			return this.room.name + '_' + this.room.gameType;
		},
		cursorCanvasID: function(){
			return this.room.name + '_cursor_canvas';
		},
		gameClass: function(){
			return this.room.type + '_message';
		},
		isGame : function(){
			return (this.room.type==roomType.game);
		},
		hasCanvas : function(){
			return (this.room.gameType==gameType.paint);
		},
		hasGameDiv : function(){
			return (this.room.gameType==gameType.tictac||this.room.gameType==gameType.imggen);
		},
		isServer : function(){
			return (this.room.type==roomType.server);
		}
	},
	mounted: function () {
		if(this.room.type==roomType.game && this.room.gameType==gameType.paint){
			canvas = document.getElementById(this.room.name+'_canvas');
			cursorCanvas = document.getElementById(this.room.name+'_cursor_canvas');
			context = canvas.getContext('2d');
			cursorContext = cursorCanvas.getContext('2d');
			addListeners();
			onResize();
			context.fillStyle = "#000000";
			context.fillRect(0, 0, canvas.width, canvas.height);
			pickPaintTool(drawType.pencil);
			drawCursor();
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
const gameStatus = {
	created: 'created',
	waiting: 'waiting',
	playing: 'playing',
	finished: 'finished'
};
const playerStatus = {
	idle: 'idle',
	ready: 'ready',
	playing: 'playing'
};			
const gameType = {
	tictac: 'tictac',
	paint: 'paint',
	imggen: 'imggen'
};					
const drawType = {
	brush: 'brush',
	pencil: 'pencil',
	eyedrop: 'eyedrop',
	star: 'star',
	line: 'line',
	polygon:'polygon'
};		
const defaultAvatar = 'images/avatar.png';
const serverAvatar = 'images/server.png';
		
var vm = new Vue({
	el: '#app',
	data: {
		nickname : '',
		userId : '',
		userList : [],
		roomList : {},
		joinedRooms : [],
		usersInRoom: [],
		allGames: [],
		cursors: {},
		currentRoom : defaultRoom, //referenced by .name which is unique
		currentRoomType : roomType.chat,
		currentGameType : '',
		formMessage : '',
		msgCursorIndex: 0,
		boardSize : 3,
		winLength : 3,
		penCursor : {
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
		}
	},
	methods: {
		getUsersInRoom :  function(roomName){
			var roomUsers = [];
			for(var room in this.roomList){
				if(this.roomList[room].name == roomName){
					for(var i=0; i < this.userList.length; i++){
						if(this.roomList[room].sockets.hasOwnProperty(this.userList[i].id)){
							if(this.userList[i].avatar == null || (typeof this.userList[i].avatar == 'undefined')){
								this.userList[i].avatar  = defaultAvatar;
							}
							roomUsers.push(this.userList[i]);
						}
					}
					return roomUsers; //new list
				}
			}
			return vm.usersInRoom; //no room change, old list
		},

		purgeOldCursors : function(){
			var cursor = {};
			for(var i=0; i < this.usersInRoom.length; i++){
				if(!this.cursors.hasOwnProperty(this.usersInRoom[i].id)){
					delete(this.cursors[this.usersInRoom[i].id]);
				}
			}
			return cursor;
		},

		chooseRoom : function(aRoom){
			var oldRoom = this.currentRoom;
			if(aRoom.id){
				if(this.currentRoom != aRoom.id){
					this.currentRoom = aRoom.id;
				}
			}else{ 
				if(this.currentRoom != aRoom.name){
					this.currentRoom = aRoom.name;
				}
			}
			this.toggleActiveRooms(oldRoom);
		},

		toggleActiveRooms : function (oldRoom){
			for(var room in this.joinedRooms){
				if(this.currentRoom == this.joinedRooms[room].name){
					this.currentRoomType = this.joinedRooms[room].type;
					this.currentGameType = this.joinedRooms[room].gameType;
				}
			}
			$('#' +this.currentRoom+ '_room').addClass('activeRoom');
			$('#' +this.currentRoom+ '_room').removeClass('inactiveRoom');
			$('#' +this.currentRoom+ '_messages').show();
			$('#' +this.currentRoom+ '_canvas').show();
			$('#' +this.currentRoom+ '_game').show();
			$('#' +this.currentRoom+ '_cursor_canvas').show();
			if(oldRoom != this.currentRoom){
				$('#' +oldRoom+ '_room').removeClass('activeRoom');
				$('#' +oldRoom+ '_room').addClass('inactiveRoom');
				$('#' +oldRoom+ '_messages').hide();
				$('#' +oldRoom+ '_canvas').hide();
				$('#' +oldRoom+ '_game').hide();
				$('#' +oldRoom+ '_cursor_canvas').hide();
			}
			if(this.currentGameType == gameType.paint){
				$('#canvasControls').show();
				$('#ticTacControls').hide();
				$('#gameControls').hide();
				$('#imgGenControls').hide();
			}else if(this.currentGameType == gameType.tictac){
				$('#ticTacControls').show();
				$('#gameControls').show();
				$('#canvasControls').hide();
				$('#imgGenControls').hide();
			}else if(this.currentGameType == gameType.imggen){
				$('#imgGenControls').show();
				$('#gameControls').show();
				$('#ticTacControls').hide();
				$('#canvasControls').hide();
			}else{
				$('#canvasControls').hide();
				$('#ticTacControls').hide();
				$('#imgGenControls').hide();
				$('#gameControls').hide();
			}
			if(this.currentRoomType == roomType.server){
				$('#msgForm').prop('disabled', true);
			}else{
				$('#msgForm').prop('disabled', false);
			}
			alignMessageToBottom();
			this.usersInRoom = this.getUsersInRoom(this.currentRoom);
		},

		start : function(){
			$('#nameform').hide();
			$('#main').show();
			connect();
		},

		joinGame : function (room, type){
			socket.emit('join_room', room, vm.currentRoom, roomType.game, null,type);
		},

		nicknameEnter : function(event){
			if ( event.which == 13) {
				this.start();
			}
		},

		sendMessage : function(){
			var inputval = vm.formMessage;
			if(inputval.charAt(0) == '/'){
				checkCommand(inputval.substring(1, inputval.length)); //trim off '/'
				return false;
			}
			socket.emit('chat_message', newMsg(socket.id, socket.username, vm.currentRoom, inputval, vm.userId));
			if(vm.currentRoomType == roomType.dm){ //dm's are only sent to the user dm'd, so we need to keep track of the messages we sent
				appendText(newMsg(vm.currentRoom, socket.username, vm.currentRoom,inputval));  /***MESSAGE***/
			}
			vm.formMessage = '';
			focusCursor('msgForm',1);
		},

		messageEnter : function(event){
			if ( event.which == 13 && !event.shiftKey) {
				event.preventDefault(); //don't let the newline on to the textarea after sending
				this.sendMessage();
			}
			vm.msgCursorIndex = $('#msgForm').prop("selectionStart") + 1;
		},

		messageSelection : function(event){
			vm.msgCursorIndex = $('#msgForm').prop("selectionStart");
		}
	},
})

var socket;
connect = function(){
	if (socket) {
		socket.destroy();
		delete socket;
		socket = null;
	}

	socket = io();
/* 	socket = io.connect('ws://192.168.1.74:3000' , { // external:  'ws://azazel.noip.me:44444'  local: 'ws://192.168.1.74:3000'
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionDelayMax : 5000,
		reconnectionAttempts: Infinity
	} ); */

	socket.on( 'connect', function () {
		console.log( 'connected to server' );
	} );

	socket.on( 'disconnect', function () {
		console.log( 'disconnected from server' );
		window.setTimeout( 'connect()', 5000 );
	} );

	socket.on('joined_room', function(room){
		var alreadyIn = false;
		for(var i=0;i< vm.joinedRooms.length; i++){
			if (vm.joinedRooms[i].name == room.name){
				alreadyIn = true;
			}
		}
		if(!alreadyIn){
			vm.joinedRooms.push(room);
		}
		vm.roomList[room.name] = room; //important
		var oldRoom = vm.currentRoom;
		vm.currentRoom = room.name;
		vm.toggleActiveRooms(oldRoom);
		vm.allGames = updateGames();
		focusCursor('msgForm',1);
	});

	socket.on('chat_message', function(msg){
		var previousRoomType = vm.currentRoomType;
		if(msg.room == null){
			msg.room = defaultRoom;
			vm.currentRoomType = roomType.chat;
		}
		if(msg.room == serverRoom){
			return;
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
		var withBrs = '';
		var msgTextRecieved = msg.msg.split('\n');
		for(var i = 0; i <msgTextRecieved.length; i++){
			withBrs += msgTextRecieved[i] + ' <br/>';
		}
		msgTextRecieved = withBrs.split(' ');
		var msgTextDisplayed = ''; //make as innerHTML later
		for(var word in msgTextRecieved){
			if(isUrlValid(msgTextRecieved[word])){
				var mediaChk = document.createElement('a');
				mediaChk.href = msgTextRecieved[word];
				mediaChk.title = msgTextRecieved[word];
				mediaChk.text = msgTextRecieved[word].slice(0,22) + "{...}" +msgTextRecieved[word].slice(msgTextRecieved[word].length-22, msgTextRecieved[word].length);
				mediaChk.target = "_blank";
				msgTextDisplayed += $(mediaChk).context.outerHTML + " ";
				urlMsgsToEmbed.push(newMsg(msg.id, msg.username, msg.room, mediaChk));
			}else{
				var match = /\r|\n/.exec(msgTextRecieved[word]);
				if (match) {
					msgTextDisplayed += "<br/>";
				}
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
		vm.currentRoomType = previousRoomType;
	});

	socket.on('left_room', function(room){
		vm.currentRoom = defaultRoom;
		vm.toggleActiveRooms(room);
		removeRoom(room);
		vm.allGames = updateGames();
		$('#' +vm.currentRoom+ '_messages').show();
		$('#'+vm.currentRoom+'_messages').append($('<li class="internalMessage">').text('Left Room:'+room));  /***MESSAGE***/
		alignMessageToBottom();
	});

	socket.on('get_canvas', function(msg){
		var cImage = new Image({});
		cImage.src = canvas.toDataURL(); 
		cImage.addEventListener('load', sendCanvas(msg,cImage.src))
		
	});

	socket.on('canvas_deliver', function(msg){
		fillCanvas(msg.msg);
	});
	
	sendCanvas = function(msg,cImage){
		socket.emit('got_canvas', newMsg(msg.id, msg.username, msg.room, cImage));
	}

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
		vm.userList = usrList;
		vm.roomList = rooms;
		vm.usersInRoom = vm.getUsersInRoom(vm.currentRoom);
		vm.allGames = updateGames();
		vm.cursors = vm.purgeOldCursors();
	});
	
	socket.on('force_name_update', function(newName){ //room name
		console.log("Name force updated:" + newName)
		socket.username = newName;
		vm.nickname = newName;
		localStorage.setItem('nickname', JSON.stringify(newName));
	});
	
	socket.on('drawing', onDrawingEvent);
	socket.on('track_cursor', onTrackCursor);
	socket.on('clear_canvas', clearCanvas);

	socket.on('start_tictac', function(msg){
		$("#ticTacControls").hide();
		startTictac(msg.room,parseInt(msg.msg.boardSize),parseInt(msg.msg.winLength));
	});

	socket.on('start_imggen', function(msg){
		$("#imgGenControls").hide();
		startImggen(msg.room);
	});

	socket.on('start_prompting', function(msg){
		displayPrompt(msg.room, msg.promptWords, msg.promptTheme);
	});

	socket.on('tac_click', function(click){
		boxClicked(click);
	});

	socket.on('countdownTickVote', function(count){
		setCountdownVote(count);
	});
	socket.on('countdownTickPrompt', function(count){
		setCountdownPrompt(count);
	});

	socket.on('roundFinished', function(msg){
		prompt = $('#promptForm')[0].value;
		displayRoundFinished(msg.room);
		socket.emit('submit_prompt',newMsg(socket.id, socket.username, vm.currentRoom,prompt));
	});

	socket.on('voteSetup', function(msg){
		displayImages(msg.room, msg.image1, msg.image2, msg.promptTheme, msg.promptWords);
	});

	socket.on('voteFinished', function(msg){
		displayRoundWinner(msg.room, msg.winner);
	});
	
	socket.on('game_won', function(msg){
		$("#ticTacControls").show();
		console.log("game won by:" + msg.msg.name);
		if(msg.msg.winLine){
			console.log("winline:" + msg.msg.winLine);
			for(var i = 0; i < msg.msg.winLine.length; i++){
				var tdid = msg.room + "_tac_" + msg.msg.winLine[i][0] + "_" + msg.msg.winLine[i][1];
				$("#"+tdid).addClass("winningLine");
			}
		}
	})

	voteA = function(){
		socket.emit('vote',newMsg(socket.id, socket.username, vm.currentRoom,0));
	}

	voteB = function(){
		socket.emit('vote',newMsg(socket.id, socket.username, vm.currentRoom,1));
	}

	submitPrompt= function(){
		prompt = $('#promptForm')[0].value;
		displayRoundFinished(vm.currentRoom);
		socket.emit('submit_prompt',newMsg(socket.id, socket.username, vm.currentRoom,prompt));
	}

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
		clearAndScroll();
	}
	
	checkCommand = function (inputval){
		var inputvalArgs = inputval.split(' ');

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
					vm.toggleActiveRooms(oldRoom);
				}else{
					vm.currentRoom = userId;
				}
				socket.emit('chat_message', newMsg(socket.id, socket.username, userId, message, vm.userId));
				$('#'+vm.currentRoom+'_messages').append($('<li class="directMessage">').text(socket.username + ":" + message));  /***MESSAGE needs styles???**/
				vm.currentRoomType = roomType.dm;
			}else{
				$('#'+vm.currentRoom+'_messages').append($('<li class="internalMessageError">').text('Invalid user.'));  /***MESSAGE***/
			}
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
			socket.emit('assign_name', newMsg(socket.id, socket.username, vm.currentRoom, name, vm.userId), avatar);

		}else if(inputvalArgs[0]=="debug"){
			socket.emit('debug server');
			console.log(socket);

		}else if(inputvalArgs[0]=="help"){
			$('#'+vm.currentRoom+'_messages').append($('#helpMessage')[0].innerHTML);  /***MESSAGE***/
			
		}else if(inputvalArgs[0]=="secret"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			socket.emit('register_secret', newMsg(socket.id, socket.username, vm.currentRoom, inputvalArgs[1]));
			
		}else if(inputvalArgs[0]=="guess"){
			if(inputvalArgs.length < 2){
				invalidCommand();
				return;
			}
			socket.emit('guess_secret', newMsg(socket.id, socket.username, vm.currentRoom, inputvalArgs[1]));

		}else if(inputvalArgs[0]=="starttic"){ //start 7 4 (start, 7x7 board, 4 to win)
			if(vm.currentRoomType != roomType.game){
				invalidCommand();
				return;
			}
			if(inputvalArgs.length < 3){
				invalidCommand();
				return;
			}
			var params = new Object();
			params.boardSize = inputvalArgs[1];
			params.winLength = inputvalArgs[2];
			socket.emit('start_tictac', newMsg(socket.id, socket.username, vm.currentRoom, params));

		}else if(inputvalArgs[0]=="status"){
			if(inputvalArgs.length == 2 ){
				socket.emit('user_status_update', newMsg(socket.id, socket.username, vm.currentRoom, inputvalArgs[1]));
			}else{
				invalidCommand();
				return;
			}				
		}else{
			$('#'+vm.currentRoom+'_messages').append($('<li class="internalMessageError">').text('Invalid command.')); /***MESSAGE***/
		}
		clearAndScroll();
	}

	invalidCommand = function(){
		$('#'+vm.currentRoom+'_messages').append($('<li class="internalMessageError">').text('Invalid command.')); /***MESSAGE***/
	}

	//init
	if(!localStorage.getItem('nickname')){
		console.log('setting nickname');
		localStorage.setItem('nickname', JSON.stringify(vm.nickname));
	}
	if(!localStorage.getItem('userId')){
		console.log('setting userId');
		vm.userId = uuidv4();
		localStorage.setItem('userId', JSON.stringify(vm.userId));
	}
	socket.username = vm.nickname;
	socket.emit('join_room', serverRoom, serverRoom, roomType.server);
	socket.emit('join_room', defaultRoom,defaultRoom, roomType.chat);
	socket.emit('assign_name', newMsg(socket.id, socket.username, vm.currentRoom, vm.nickname, vm.userId));
	console.log("First name change:" + socket.id + "->" + vm.nickname);
}


isUrlValid = function(userInput) {
	var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/
    var res = userInput.match(urlPattern);
    if(res == null)
        return false;
    else
        return true;
}

appendImage = function(msg){
	$('#'+msg.room+'_messages').append($('<li class="messageMedia">').append($('<img width="500" src="'+msg.msg+'"/>')));
}

appendText = function(msg){
	$('#'+msg.room+'_messages').append($('<li class="messageText">').append('<img class="userIcon" src="'+getAvatarFromName(msg.username)+
		'"/><div class="messageTextContainer"><span class="msgDisplayName">'+getName(msg)+
		'</span><span class="msgDisplayTime">' + getTime() + 
		'</span><div class="messageDisplayText">'+msg.msg+ '</div></div>')
		);
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
		return serverAvatar;
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

showCreateGamePopup = function(){
	$('#gameCreationPopup').toggle();
}

togglePasswordField = function(){
	$('#chooseGamePass').prop("disabled", function(i, origValue){
		return !origValue;
	  })
}

clickedRadio = function(field){
	$('#'+field).prop("checked", function(i, origValue){
		return !origValue;
	  })
}

processCreateGame = function(){
	var pg = $('#choosePaintGame').prop("checked");
	var tt = $('#chooseTicTacGame').prop("checked");
	var ig = $('#chooseImggenGame').prop("checked");
	var roomNamePre = $('#chooseGameName')[0].value;
	var roomName = roomNamePre.split(' ').join('_');
	var gamePass = $('#chooseGamePass')[0].value;
	var gType;
	console.log("processCreateGame gtype:" + gType);
	if(pg){
		gType = gameType.paint;
	}else if(tt){
		gType = gameType.tictac;
	}else if(ig){
		gType = gameType.imggen;
	}
	if(gType){
		if(gamePass == ''){
			gamePass = null;
		}
		if(roomName==''){
			roomName = generateGameRoomName();
		}
		$('#gameCreationPopup').toggle();
		socket.emit('join_room', roomName, vm.currentRoom, roomType.game, gamePass, gType);
	}
}

closeGameCreationPopup = function(){
	$('#gameCreationPopup').toggle();
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

makeLobby = function(){
	//TODO
}

readyGame = function(){
	makeLobby();
	$('#' +vm.currentRoom+ '_game').show();
}

startTictac = function(room, size, winLength){
	makeBoard(room, size, winLength);
	$('#' +room+ '_game').show();
	$('#' +room+ '_tictac').show();
}

startImggen = function(room){
	makeImgGen(room);
	$('#' +room+ '_game').show();
	$('#' +room+ '_imggen').show();
}

startSlopping = function(){
	socket.emit('slopped_round_prompt', newMsg(socket.id, socket.username, vm.currentRoom));
}

startGame = function(){
	var params = new Object();
	params.boardSize = vm.boardSize;
	params.winLength = vm.winLength;
	socket.emit('start_game', newMsg(socket.id, socket.username, vm.currentRoom, params));
}

setPlayerState = function(state){
	socket.emit('user_status_update', newMsg(socket.id, socket.username, vm.currentRoom, state));
}

pickPaintTool = function(type){
	for(var t in drawType){
		if(drawType[t] == type){
			//add class
			vm.penCursor.type = type;
			$('#' +vm.currentRoom+ '_canvas').addClass(type);
		}else{
			//remove
			$('#' +vm.currentRoom+ '_canvas').removeClass(drawType[t]);
		}
	}
}

clearCanvasPre = function(){
	clearCanvas();
	socket.emit('clear_canvas',newMsg(socket.id, socket.username, vm.currentRoom));
}

alignMessageToBottom = function(){
	if(vm.currentRoomType == roomType.game){
		var roomDiv = document.getElementById(vm.currentRoom+'_messages');
		if(roomDiv!=null){
			roomDiv.scrollTo(0,roomDiv.scrollHeight);
		}
	}else{
		var roomDiv = document.getElementById('messages');
		if(roomDiv!=null){
			roomDiv.scrollTo(0,roomDiv.scrollHeight);
		}
	}
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

getTime = function (){
	var d = new Date();
	var h = d.getHours();
	var apm = 'AM';
	if(h > 12){
		h = h-12;
		apm = 'PM';
	}
	var m = d.getMinutes();
	if(m < 10){
		d = "0" + d;
	}
	var dtime = ' - ' + h + ":" + m + " " + apm;
	return dtime;
}

newMsg = function(id,username,room,message,userId){
	var msg = new Object();
	msg.id = id;
	msg.username = username;
	msg.room = room;
	msg.msg = message;
	msg.userId = userId;
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

updateGames = function(){
	var allGames = [];
	for(var room in vm.roomList){	
		if(vm.roomList[room].type == roomType.game){
			var theseGamers = vm.getUsersInRoom(vm.roomList[room].name);
			var game = {
				players: theseGamers,
				name: vm.roomList[room].name,
				status: vm.roomList[room].roomStatus,
				gameType: vm.roomList[room].gameType
			}
			allGames.push(game);
		}
	}	
	return allGames;	
}

focusCursor = function(id, cursorIndex){
	$('#'+id).focus;
	$('#'+id).prop("selectionStart",cursorIndex);
	$('#'+id).prop("selectionEnd",cursorIndex);
	vm.msgCursorIndex = cursorIndex;
	$('#'+id).setActive;
	$('#'+id).select();
}
focusCursor('nickname',1);

clearAndScroll = function (){
	alignMessageToBottom();
	vm.formMessage = null;
	focusCursor('msgForm',1);
}

uuidv4 = function() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	)
}

$(document).ready(function() {
	createEmojis();
	var nick = JSON.parse(localStorage.getItem('nickname'));
	var userId = JSON.parse(localStorage.getItem('userId'));
	if(nick && userId){
		vm.nickname = nick; 
		vm.userId = userId;
		console.log(' Auto Re-Starting... '+vm.nickname + ' ' + vm.userId)
		vm.start();
	}
});