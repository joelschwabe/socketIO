const express = require('express'),
	path = require('path'),
	app = express();
	
app.use(express.static('public', {dotfiles:'allow'}));
//app.use(express.static( __dirname+'/static', {dotfiles:'allow'} ));
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const comfyUIClient = require('comfy-ui-client');
const util = require('util');
const tictac = require('./tictac');

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
		battleship: 'battleship',
		paint: 'paint',
		tictac: 'tictac',
		imggen: 'imggen'
	};		
const playerStatus = {
		idle: 'idle',
		ready: 'ready',
		playing: 'playing'
	};

var workflow = {
	'3': {
		class_type: 'KSampler',
		inputs: {
			cfg: 3,
			denoise: 1,
			latent_image: ['5', 0],
			model: ['4', 0],
			negative: ['7', 0],
			positive: ['6', 0],
			sampler_name: 'euler',
			scheduler: 'normal',
			seed: 1,
			steps: 8,
		},
	},
	'4': {
		class_type: 'CheckpointLoaderSimple',
		inputs: {
			ckpt_name: 'sdXLL_pony_cabbalio_v2_4S.safetensors',
		},
	},
	'5': {
		class_type: 'EmptyLatentImage',
		inputs: {
			batch_size: 1,
			height: 1024,
			width: 1024,
		},
	},
	'6': {
		class_type: 'CLIPTextEncode',
		inputs: {
			clip: ['4', 1],
			text: 'masterpiece best quality',
		},
	},
	'7': {
		class_type: 'CLIPTextEncode',
		inputs: {
			clip: ['4', 1],
			text: '',
		},
	},
	'8': {
		class_type: 'VAEDecode',
		inputs: {
			samples: ['3', 0],
			vae: ['4', 2],
		},
	},
	'9': {
		class_type: 'SaveImage',
		inputs: {
			filename_prefix: 'ComfyUI',
			images: ['8', 0],
		},
	},
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
var activeGamesData = {};

io.on('connection', function(socket){
	console.log('a user connected to default with socket:'+socket.id);

	socket.on('reconnect', function(socket){
		console.log("reconnected:");
		debugPrint(socket);
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
		if(socket.adapter.rooms[msg.room].type == roomType.game){ //status updates only apply to games
			if(msg.msg in playerStatus){
				socket.adapter.rooms[msg.room].playerStatus[msg.id] = msg.msg;
				var statusN = '';
				if(Object.keys(socket.adapter.rooms[msg.room].playerStatus).length >= minUsersPerGameRoom){
					var playersReady = true;
					for(var player in socket.adapter.rooms[msg.room].playerStatus){
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
					io.emit('users_rooms_list', userList, socket.adapter.rooms); 
				}else{
					console.log("Game waiting");
					statusN = gameStatus.waiting;
					socket.adapter.rooms[msg.room].roomStatus = statusN;
					io.emit('users_rooms_list', userList, socket.adapter.rooms); //will send updated room statuses
				}
				var message = msg.username + " is now " + msg.msg + "!";
				io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
			}
		}
	});

	socket.on('start_game', function(msg){
		var message = '';
		if(socket.adapter.rooms[msg.room].roomStatus == gameStatus.ready){
			message = "Starting Game...";
			socket.adapter.rooms[msg.room].roomStatus = gameStatus.playing;
			io.emit('users_rooms_list', userList, socket.adapter.rooms); 
			io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
			if(socket.adapter.rooms[msg.room].gameType == gameType.tictac){
				setupTicTac(msg);
			}else if(socket.adapter.rooms[msg.room].gameType == gameType.battleship){
				setupBattleship(msg);
			}else if(socket.adapter.rooms[msg.room].gameType == gameType.imggen){
				setupImggen(msg);
			}else{
				//io.to(msg.room).emit('start_game', msg); 
			}
			socket.adapter.rooms[msg.room].roomStatus = gameStatus.playing;
			io.emit('users_rooms_list', userList, socket.adapter.rooms);
		}else{
			message = "Unable to start game. Game not in ready state!";
			io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
		}
	});

	setupTicTac = function(msg){
		var iconArray = ['X','O','Z','H','B','S'];
		var gameData = new Object();
		gameData.matrix = [];
		gameData.winLength = parseInt(msg.msg.winLength);
		gameData.boardSize = parseInt(msg.msg.boardSize);
		gameData.ticCount = 0;
		for(var i =0; i < gameData.boardSize; i++){
			gameData.matrix.push([]);
			for(var j =0; j < gameData.boardSize; j++){
				gameData.matrix[i].push('');
			}
		}
		var usersArray = Object.keys(socket.adapter.rooms[msg.room].sockets);
		var usersObj = new Object();
		for(var i=0;i < usersArray.length; i++){
			usersObj[usersArray[i]] = new Object();
			usersObj[usersArray[i]].score = 0;
			usersObj[usersArray[i]].icon = iconArray[i];
			usersObj[usersArray[i]].turn = i;
			for(var k =0; k < userList.length; k++){
				console.log(userList[k].id + " | " + usersArray[i] );
				if(userList[k].id==usersArray[i]){
					usersObj[usersArray[i]].name = userList[k].username;
				}
			}
		}
		gameData.turn = 0;
		gameData.turnMax = usersArray.length-1; //zero index
		var ticTacGame = newGame(msg.room,socket.adapter.rooms[msg.room].gameType, usersObj, gameData );
		activeGamesData[msg.room] = ticTacGame;
		debugPrint(activeGamesData);
		io.to(msg.room).emit('start_tictac', msg); 
		message = "The game has started!";
		io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
		message2 = "It is " + usersObj[usersArray[0]].name + "'s turn ( " + usersObj[usersArray[0]].icon + " )";
		io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message2));
	}
	
	setupBattleship = function(msg){
		console.log("TODO: setup battleship");
	};

	socket.on('tic_click', function(msg){
		var ticTacGame = activeGamesData[msg.room];
		debugPrint(ticTacGame);
		if(ticTacGame.game.turn == ticTacGame.users[msg.userId].turn){ //has to be your turn
			if(ticTacGame.game.matrix[msg.y][msg.x] == ''){ //has to be empty square
				ticTacGame.game.matrix[msg.y][msg.x] = ticTacGame.users[msg.userId].icon; //fill square
				var winner = tictac.gameOver(ticTacGame.game.matrix,msg.y,msg.x,ticTacGame.game.winLength-1); //check results
				console.log("Winner:" + winner.icon);
				var clickAction = new Object();
				clickAction.icon = ticTacGame.users[msg.userId].icon;
				clickAction.x = msg.x;
				clickAction.y = msg.y;
				clickAction.room = msg.room;
				if(winner.icon == ''){
					io.to(msg.room).emit('tac_click', clickAction);
					ticTacGame.game.turn++;
					if(ticTacGame.game.turn > ticTacGame.game.turnMax){
						ticTacGame.game.turn = 0;
					}
					var usersTurnName = '';
					var clickIcon = '';
					for(var user in ticTacGame.users){
						if(ticTacGame.users[user].turn ==ticTacGame.game.turn){
							usersTurnName = ticTacGame.users[user].name;
							clickIcon = ticTacGame.users[user].icon;
						}
					}
					ticTacGame.game.ticCount++;
					if(ticTacGame.game.ticCount == (ticTacGame.game.boardSize * ticTacGame.game.boardSize)){
						ticTacGame.game.turn = -1;
						winner.name = null; 
						gameComplete(msg, winner);
					}else{
						message = "It is " + usersTurnName + "'s turn ( " + clickIcon + " )";
						io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
					}
				}else{
					io.to(msg.room).emit('tac_click', clickAction);
					winner.name =  ticTacGame.users[msg.userId].name;
					ticTacGame.game.turn = -1;
					gameComplete(msg,winner);
				}
			}
		}
	});

	gameComplete = function(msg, winner){
		var message;
		if(!winner.name){
			winner.name = serverName;
			message = "Tie Game!"
		}else{
			message = winner.name + " has won the game!";
		}
		for(var player in socket.adapter.rooms[msg.room].playerStatus){
			socket.adapter.rooms[msg.room].playerStatus[player] == playerStatus.idle;
		}
		socket.adapter.rooms[msg.room].roomStatus = gameStatus.finished;
		io.emit('users_rooms_list', userList, socket.adapter.rooms);
		io.to(msg.room).emit('game_won', newMsg(serverName, serverName,msg.room,winner));
		io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
	}

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
		debugPrint(socket.adapter.rooms);
		debugPrint(userList);
		debugPrint(gamelist);
		debugPrint(roomSecret);
		debugPrint(activeGamesData);
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
		if(msg.room != serverRoom){
			io.to(msg.room).emit('chat_message', msg);
		}
	});
	
	socket.on('got_canvas', function(msg){
		io.to(msg.id).emit('canvas_deliver', newMsg(serverName, serverName,null,msg.msg)); //canvas image
	});
	
	socket.on('join_room', function(room, fromRoom, type, pword,gType){
		console.log("called join_room");
		if(!room){
			var message = "Must have a room name.";
			io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,fromRoom,message));
			console.log('No room name...');
			return
		};
		var maxUsersPerRoom;
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
						if(socket.adapter.rooms[room].type == roomType.game && 
							socket.adapter.rooms[room].gameType == gameType.tictac && 
							socket.adapter.rooms[room].roomStatus == gameStatus.playing ){ //it's currently active
								var message = "Cannot join room while game is in session."
								io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,room,message));
						}else{
							socket.join(room);
							console.log("public " +type+ " room joined");
							var message = getName(socket) + " joined " + room;
							io.to(room).emit('chat_message', newMsg(serverName, serverName,room,message));
							io.to(socket.id).emit('joined_room', thisRoom);
							if(socket.adapter.rooms[room].type == roomType.game && socket.adapter.rooms[room].gameType == gameType.paint ){
								socket.to(room).emit('get_canvas', newMsg(socket.id, socket.username,room))
							}
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
		debugPrint(socket.adapter.rooms);
	});

	socket.on('leave_room', function(room){
		if(room == defaultRoom || room == serverRoom){
			var message = 'Cannot leave ' + room;
			io.to(socket.id).emit('chat_message', newMsg(serverName, serverName,room,message));
		}else{
			io.to(socket.id).emit('left_room', room);
			socket.leave(room);
			console.log('a user left_room:'+ room);
			var message = getName(socket) + " left " + room;
			io.to(room).emit('chat_message', newMsg(serverName, serverName,room,message));
			debugPrint(socket.adapter.rooms);
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

	class User {
		constructor(id, name, score, votes,prompt,image) {
		  this.id = id;
		  this.name = name;
		  this.score = score;
		  this.votes = votes;
		  this.prompt = prompt;
		  this.image = image;
		}
	}

	class Round {
		constructor(roundid, roundtime, roundcomplete) {
			this.roundid = roundid;
			this.roundtime = roundtime;
			this.roundcomplete = roundcomplete;
		  }
	}
	class SloppedRound extends Round{
		constructor(roundid, roundtime, roundcomplete, userpair, roundTheme, mysteryWords) {
			super(roundid, roundtime, roundcomplete);
			this.roundTheme = roundTheme;
			this.mysteryWords = mysteryWords;  //three words comma separated?
			this.userpair = userpair;
		  }
	}

	setupImggen = function(msg){
		var gameData = new Object();
		var usersArr = [];
		var usersArray = Object.keys(socket.adapter.rooms[msg.room].sockets);
		for(var i=0;i < usersArray.length; i++){
			for(var k =0; k < userList.length; k++){
				console.log(userList[k].id + " | " + usersArray[i] );
				if(userList[k].id==usersArray[i]){
					usersArr.push(new User(userList[k].id,userList[k].username,0,0))
				}
			}
		}
		//Do setup here first
		var userPairsArr = generateUserPairs(usersArr);
		var sloppedRounds = [];
		for(var i=0;i < userPairsArr.length; i++){
			var theme = getTheme();
			var mysteryWords = getMysteryWords();
			sloppedRounds.push(new SloppedRound (i,60,false,userPairsArr[i], theme, mysteryWords));
		}
		gameData.roundTime = 60;
		gameData.roundList = sloppedRounds;
		gameData.roundIndex = 0;
		var imggenGame = newGame(msg.room,socket.adapter.rooms[msg.room].gameType, usersArr, gameData );
		activeGamesData[msg.room] = imggenGame;
		debugPrint(activeGamesData);
		io.to(msg.room).emit('start_imggen', msg); 
		message = "The game has started!";
		io.to(msg.room).emit('chat_message', newMsg(serverName, serverName,msg.room,message));
	};

	//Take in a list of users, create pairings of them, return an array of UserPairs
	generateUserPairs = function (users) {
		var pairsArray = [];
	  
		for (let i = 0; i < users.length; i++) {
		  for (let j = i + 1; j < users.length; j++) {
			pairsArray.push([users[i],users[j]]);
		  }
		}
	    debugPrint(pairsArray);
		return pairsArray;
	  }






	socket.on('slopped_round_prompt', function(msg){
		//start timer, force update on tick
		//tell client to update to new screen
		//end round when  timer expires (or both prompts are in tbd)
		var sloppedGame = activeGamesData[msg.room];
		debugPrint(sloppedGame);
		msg.promptWords = sloppedGame.game.roundList[sloppedGame.game.roundIndex].mysteryWords;
		msg.promptTheme = sloppedGame.game.roundList[sloppedGame.game.roundIndex].roundTheme;
		io.to(msg.room).emit('start_prompting', msg);
		var countdown = sloppedGame.game.roundTime;

		const interval = setInterval(() => {
			countdown--;
			io.to(msg.room).emit('countdownTickPrompt', countdown);
	  
			if (countdown <= 0) {
			  clearInterval(interval);
			  io.to(msg.room).emit('roundFinished', msg);

			}
		}, 1000);
	});

	socket.on('submit_prompt' , async function(msg){

		var sloppedGame = activeGamesData[msg.room];
		debugPrint(sloppedGame);

		var prompt = msg.msg;
		console.log("submit_prompt:");
		console.log(prompt);

		var competitors = sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair
		var userIndex = null;

		for(var i=0;i < competitors.length; i++){
			if(competitors[i].name == msg.username){
				userIndex = i;
			}
		}
		sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[userIndex].prompt = prompt;

		const serverAddress = '192.168.1.88:8188';
		const clientId = msg.id;
		const client = new comfyUIClient.ComfyUIClient(serverAddress, clientId);

		// Connect to server
		await client.connect();
		workflow['6'].inputs.text = prompt;
		// Generate images
		var images = await client.getImages(workflow);
		//var images = await client.queuePrompt(workflow);
		const outputDir = './public/images/gens/';

		await client.saveImages(images, outputDir);
		debugPrint(images);

		var uri = '/images/gens/' + images[9][0].image.filename;
		sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[userIndex].image = uri;
		debugPrint(sloppedGame);

		if(sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[0].image!=null
			&& sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[1].image!=null
		){
			triggerVotingState(msg);
		}
		await client.disconnect();
	});

	triggerVotingState = function(msg){
		var sloppedGame = activeGamesData[msg.room];
		debugPrint(sloppedGame);
		msg.image1 = sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[0].image;
		msg.image2 = sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[1].image; 
		msg.promptWords = sloppedGame.game.roundList[sloppedGame.game.roundIndex].mysteryWords;
		msg.promptTheme = sloppedGame.game.roundList[sloppedGame.game.roundIndex].roundTheme;
		io.to(msg.room).emit('voteSetup', msg);
		var countdown2 = 15;

		const interval2 = setInterval(() => {
			countdown2--;
			io.to(msg.room).emit('countdownTickVote', countdown2);
	  
			if (countdown2 <= 0) {
			  clearInterval(interval2);

			  if(sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[0].votes >sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[1].votes){
				sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[0].score += 1;
				msg.winner = sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[0].name;
			  }else{
				sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[1].score += 1;
				msg.winner = sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[1].name;
			  }
			  io.to(msg.room).emit('voteFinished', msg);

			}
		}, 1000);
	}

	socket.on('vote' , function(msg){
		var sloppedGame = activeGamesData[msg.room];
		var vote = msg.msg;
		sloppedGame.game.roundList[sloppedGame.game.roundIndex].userpair[0].votes++;
		console.log("voted for:" + msg.msg);

	});

});


getTheme = function(){
	//TODO
	return "Outer Space";
}

getMysteryWords = function (){
	//TODO
	return "pineapple,screwdriver,balloon";
}

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
	debugPrint(newUsr);
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

debugPrint = function (obj, label = '') {
	console.log(label, util.inspect(obj, { depth: null, colors: true }));
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

newGame = function(room, type, usersData, gameData){
	var game = new Object();
	game.room = room;
	game.type = type;
	game.users = usersData;
	game.game = gameData;
	return game;
}

getName = function(socket){
	if(socket.username){
		return socket.username;
	}else{
		return defaultName;
	}
}

//init
http.listen(port, function(){
	console.log('listening on *:'+port);
});
