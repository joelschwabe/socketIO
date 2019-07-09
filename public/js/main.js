Vue.component('message-item', {
	props: ['item'],
	template: '<li class="serverMessage">{{message}}</li>',
	computed: {
		message: function(item){
			return this.room.name + '_messages';
		}
	}
});
Vue.component('server-row', {
	props: ['game'],
	template: '<tr class="serverRow"><td>{{game.players.length}}</td><td>{{game.name}}</td><td>{{game.status}}</td></tr>',
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
			return this.room.type + '_class inactiveRoom roomlist_class';
		},
		roomName: function(){
			return this.room.name + " - (" + this.room.type + ")";
		}
	},
	created: function () {
		console.log("element created:" + this);
		if(this.room.name != serverRoom){
			$('#'+this.room.name+'_messages').append($('<li>').text('Joined Room:'+this.room.name).css('color','blue')); /***MESSAGE***/
			if(this.room.name == defaultRoom){
				$('#'+this.room.name+'_messages').append($('<li>').text('Welcome to the General Chat. Type "/help" for a list of commands.').css('color','blue')); /***MESSAGE***/
			}
		}else{
			buildServerTable();
			$('#'+this.room.name+'_messages').append($('<table class="serverTable"><th>Players</th>' +
				'<th>Name</th><th>Status</th>'+
				'<server-row v-for="game in allGames" v-bind:game="game"'+	  
				'v-bind:key="game.name"></server-row></table>'));
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
});

Vue.component('message-area', {
	props: ['room'],
	template: 	'<div class="messageAreaContainer">'+
					'<div v-if="hasCanvas" class="gameMessageAreaContainer">' +
						'<canvas :id="cursorCanvasID" class="cursor_class"></canvas>'+
						'<canvas :id="roomId" :class="roomClass"></canvas>'+
						'<div :id="gameDivId" :class="roomClass"></div>'+
						'<ul :id="gameMessages" :class="gameClass"></ul>'+
					'</div>'+
					'<div v-else="hasCanvas">' +
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
		gameMessages : function(){
			return this.room.name + '_messages';
		},
		gameDivId : function(){
			return this.room.name + '_game';
		},
		cursorCanvasID: function(){
			return this.room.name + '_cursor_canvas';
		},
		gameClass: function(){
			return this.room.type + '_message';
		},
		hasCanvas : function(){
			return (this.room.type==roomType.game);
		}
	},
	mounted: function () {
		if(this.room.type==roomType.game){
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
const defaultAvatar = 'images/avatar.png';
const serverAvatar = 'images/server.png';
const emojiList = [
	"1f600","1f603","1f604","1f601","1f606","1f605","1f923","1f602","1f642","1f643","1f609","1f60a","1f607","1f970","1f60d",
	"1f929","1f618","1f617","263a","1f61a","1f619","1f60b","1f61b","1f61c","1f92a","1f61d","1f911","1f917","1f92d","1f92b",
	"1f914","1f910","1f928","1f610","1f611","1f636","1f60f","1f612","1f644","1f62c","1f925","1f60c","1f614","1f62a","1f924",
	"1f634","1f637","1f912","1f915","1f922","1f92e","1f927","1f975","1f976","1f974","1f635","1f92f","1f920","1f973","1f60e","1f913",
	"1f9d0","1f615","1f61f","1f641","2639","1f62e","1f62f","1f632","1f633","1f97a","1f626","1f627","1f628","1f630","1f625","1f622",
	"1f62d","1f631","1f616","1f623","1f61e","1f613","1f629","1f62b","1f971","1f624","1f621","1f620","1f92c","1f608","1f47f","1f480",
	"2620","1f4a9","1f921","1f479","1f47a","1f47b","1f47d","1f47e","1f916","1f63a","1f638","1f639","1f63b","1f63c","1f63d","1f640",
	"1f63f","1f63e","1f648","1f649","1f64a","1f48b","1f48c","1f498","1f49d","1f496","1f497","1f493","1f49e","1f495","1f49f","2763",
	"1f494","2764","1f9e1","1f49b","1f49a","1f499","1f49c","1f90e","1f5a4","1f90d","1f4af","1f4a2","1f4a5","1f4ab","1f4a6","1f4a8",
	"1f573","1f4a3","1f4ac","1f441_fe0f_200d_1f5e8_fe0f","1f5e8","1f5ef","1f4ad","1f4a4","1f44b","1f91a","1f590","270b","1f596",
	"1f44c","1f90f","270c","1f91e","1f91f","1f918","1f919","1f448","1f449","1f446","1f595","1f447","261d","1f44d","1f44e","270a",
	"1f44a","1f91b","1f91c","1f44f","1f64c","1f450","1f932","1f91d","1f64f","270d","1f485","1f933","1f4aa","1f9be","1f9bf","1f9b5",
	"1f9b6","1f442","1f9bb","1f443","1f9e0","1f9b7","1f9b4","1f440","1f441","1f445","1f444","1f476","1f9d2","1f466","1f467","1f9d1",
	"1f471","1f468","1f9d4","1f471_200d_2642_fe0f","1f468_200d_1f9b0","1f468_200d_1f9b1","1f468_200d_1f9b3","1f468_200d_1f9b2","1f469",
	"1f471_200d_2640_fe0f","1f469_200d_1f9b0","1f469_200d_1f9b1","1f469_200d_1f9b3","1f469_200d_1f9b2","1f9d3","1f474","1f475","1f64d",
	"1f64d_200d_2642_fe0f","1f64d_200d_2640_fe0f","1f64e","1f64e_200d_2642_fe0f","1f64e_200d_2640_fe0f","1f645","1f645_200d_2642_fe0f",
	"1f645_200d_2640_fe0f","1f646","1f646_200d_2642_fe0f","1f646_200d_2640_fe0f","1f481","1f481_200d_2642_fe0f","1f481_200d_2640_fe0f",
	"1f64b","1f64b_200d_2642_fe0f","1f64b_200d_2640_fe0f","1f9cf","1f9cf_200d_2642_fe0f","1f9cf_200d_2640_fe0f","1f647","1f647_200d_2642_fe0f",
	"1f647_200d_2640_fe0f","1f926","1f926_200d_2642_fe0f","1f926_200d_2640_fe0f","1f937","1f937_200d_2642_fe0f","1f937_200d_2640_fe0f",
	"1f468_200d_2695_fe0f","1f469_200d_2695_fe0f","1f468_200d_1f393","1f469_200d_1f393","1f468_200d_1f3eb","1f469_200d_1f3eb","1f468_200d_2696_fe0f",
	"1f469_200d_2696_fe0f","1f468_200d_1f33e","1f469_200d_1f33e","1f468_200d_1f373","1f469_200d_1f373","1f468_200d_1f527","1f469_200d_1f527",
	"1f468_200d_1f3ed","1f469_200d_1f3ed","1f468_200d_1f4bc","1f469_200d_1f4bc","1f468_200d_1f52c","1f469_200d_1f52c","1f468_200d_1f4bb",
	"1f469_200d_1f4bb","1f468_200d_1f3a4","1f469_200d_1f3a4","1f468_200d_1f3a8","1f469_200d_1f3a8","1f468_200d_2708_fe0f","1f469_200d_2708_fe0f",
	"1f468_200d_1f680","1f469_200d_1f680","1f468_200d_1f692","1f469_200d_1f692","1f46e","1f46e_200d_2642_fe0f","1f46e_200d_2640_fe0f","1f575",
	"1f575_fe0f_200d_2642_fe0f","1f575_fe0f_200d_2640_fe0f","1f482","1f482_200d_2642_fe0f","1f482_200d_2640_fe0f","1f477","1f477_200d_2642_fe0f",
	"1f477_200d_2640_fe0f","1f934","1f478","1f473","1f473_200d_2642_fe0f","1f473_200d_2640_fe0f","1f472","1f9d5","1f935","1f470","1f930","1f931",
	"1f47c","1f385","1f936","1f9b8","1f9b8_200d_2642_fe0f","1f9b8_200d_2640_fe0f","1f9b9","1f9b9_200d_2642_fe0f","1f9b9_200d_2640_fe0f","1f9d9",
	"1f9d9_200d_2642_fe0f","1f9d9_200d_2640_fe0f","1f9da","1f9da_200d_2642_fe0f","1f9da_200d_2640_fe0f","1f9db","1f9db_200d_2642_fe0f",
	"1f9db_200d_2640_fe0f","1f9dc","1f9dc_200d_2642_fe0f","1f9dc_200d_2640_fe0f","1f9dd","1f9dd_200d_2642_fe0f","1f9dd_200d_2640_fe0f","1f9de",
	"1f9de_200d_2642_fe0f","1f9de_200d_2640_fe0f","1f9df","1f9df_200d_2642_fe0f","1f9df_200d_2640_fe0f","1f486","1f486_200d_2642_fe0f",
	"1f486_200d_2640_fe0f","1f487","1f487_200d_2642_fe0f","1f487_200d_2640_fe0f","1f6b6","1f6b6_200d_2642_fe0f",
	"1f6b6_200d_2640_fe0f","1f9cd","1f9cd_200d_2642_fe0f","1f9cd_200d_2640_fe0f","1f9ce",
	"1f9ce_200d_2642_fe0f","1f9ce_200d_2640_fe0f","1f468_200d_1f9af","1f469_200d_1f9af",
	"1f468_200d_1f9bc","1f469_200d_1f9bc","1f468_200d_1f9bd","1f469_200d_1f9bd","1f3c3",
	"1f3c3_200d_2642_fe0f","1f3c3_200d_2640_fe0f","1f483","1f57a","1f574","1f46f",
	"1f46f_200d_2642_fe0f","1f46f_200d_2640_fe0f","1f9d6","1f9d6_200d_2642_fe0f",
	"1f9d6_200d_2640_fe0f","1f9d7","1f9d7_200d_2642_fe0f","1f9d7_200d_2640_fe0f","1f93a",
	"1f3c7","26f7","1f3c2","1f3cc","1f3cc_fe0f_200d_2642_fe0f","1f3cc_fe0f_200d_2640_fe0f",
	"1f3c4","1f3c4_200d_2642_fe0f","1f3c4_200d_2640_fe0f","1f6a3","1f6a3_200d_2642_fe0f",
	"1f6a3_200d_2640_fe0f","1f3ca","1f3ca_200d_2642_fe0f","1f3ca_200d_2640_fe0f","26f9",
	"26f9_fe0f_200d_2642_fe0f","26f9_fe0f_200d_2640_fe0f","1f3cb","1f3cb_fe0f_200d_2642_fe0f",
	"1f3cb_fe0f_200d_2640_fe0f","1f6b4","1f6b4_200d_2642_fe0f","1f6b4_200d_2640_fe0f","1f6b5",
	"1f6b5_200d_2642_fe0f","1f6b5_200d_2640_fe0f","1f938","1f938_200d_2642_fe0f",
	"1f938_200d_2640_fe0f","1f93c","1f93c_200d_2642_fe0f","1f93c_200d_2640_fe0f","1f93d",
	"1f93d_200d_2642_fe0f","1f93d_200d_2640_fe0f","1f93e","1f93e_200d_2642_fe0f",
	"1f93e_200d_2640_fe0f","1f939","1f939_200d_2642_fe0f","1f939_200d_2640_fe0f","1f9d8",
	"1f9d8_200d_2642_fe0f","1f9d8_200d_2640_fe0f","1f6c0","1f6cc","1f9d1_200d_1f91d_200d_1f9d1",
	"1f46d","1f46b","1f46c","1f48f","1f469_200d_2764_fe0f_200d_1f48b_200d_1f468",
	"1f468_200d_2764_fe0f_200d_1f48b_200d_1f468","1f469_200d_2764_fe0f_200d_1f48b_200d_1f469",
	"1f491","1f469_200d_2764_fe0f_200d_1f468","1f468_200d_2764_fe0f_200d_1f468",
	"1f469_200d_2764_fe0f_200d_1f469","1f46a","1f468_200d_1f469_200d_1f466",
	"1f468_200d_1f469_200d_1f467","1f468_200d_1f469_200d_1f467_200d_1f466",
	"1f468_200d_1f469_200d_1f466_200d_1f466","1f468_200d_1f469_200d_1f467_200d_1f467",
	"1f468_200d_1f468_200d_1f466","1f468_200d_1f468_200d_1f467",
	"1f468_200d_1f468_200d_1f467_200d_1f466","1f468_200d_1f468_200d_1f466_200d_1f466",
	"1f468_200d_1f468_200d_1f467_200d_1f467","1f469_200d_1f469_200d_1f466",
	"1f469_200d_1f469_200d_1f467","1f469_200d_1f469_200d_1f467_200d_1f466",
	"1f469_200d_1f469_200d_1f466_200d_1f466","1f469_200d_1f469_200d_1f467_200d_1f467",
	"1f468_200d_1f466","1f468_200d_1f466_200d_1f466","1f468_200d_1f467",
	"1f468_200d_1f467_200d_1f466","1f468_200d_1f467_200d_1f467","1f469_200d_1f466",
	"1f469_200d_1f466_200d_1f466","1f469_200d_1f467","1f469_200d_1f467_200d_1f466",
	"1f469_200d_1f467_200d_1f467","1f5e3","1f464","1f465","1f463","1f9b0","1f9b1",
	"1f9b3","1f9b2","1f435","1f412","1f98d","1f9a7","1f436","1f415","1f9ae","1f415_200d_1f9ba",
	"1f429","1f43a","1f98a","1f99d","1f431","1f408","1f981","1f42f","1f405","1f406","1f434",
	"1f40e","1f984","1f993","1f98c","1f42e","1f402","1f403","1f404","1f437","1f416","1f417",
	"1f43d","1f40f","1f411","1f410","1f42a","1f42b","1f999","1f992","1f418","1f98f","1f99b",
	"1f42d","1f401","1f400","1f439","1f430","1f407","1f43f","1f994","1f987","1f43b","1f428",
	"1f43c","1f9a5","1f9a6","1f9a8","1f998","1f9a1","1f43e","1f983","1f414","1f413","1f423",
	"1f424","1f425","1f426","1f427","1f54a","1f985","1f986","1f9a2","1f989","1f9a9","1f99a",
	"1f99c","1f438","1f40a","1f422","1f98e","1f40d","1f432","1f409","1f995","1f996","1f433",
	"1f40b","1f42c","1f41f","1f420","1f421","1f988","1f419","1f41a","1f40c","1f98b","1f41b",
	"1f41c","1f41d","1f41e","1f997","1f577","1f578","1f982","1f99f","1f9a0","1f490","1f338",
	"1f4ae","1f3f5","1f339","1f940","1f33a","1f33b","1f33c","1f337","1f331","1f332","1f333",
	"1f334","1f335","1f33e","1f33f","2618","1f340","1f341","1f342","1f343","1f347","1f348",
	"1f349","1f34a","1f34b","1f34c","1f34d","1f96d","1f34e","1f34f","1f350","1f351","1f352",
	"1f353","1f95d","1f345","1f965","1f951","1f346","1f954","1f955","1f33d","1f336","1f952",
	"1f96c","1f966","1f9c4","1f9c5","1f344","1f95c","1f330","1f35e","1f950","1f956","1f968",
	"1f96f","1f95e","1f9c7","1f9c0","1f356","1f357","1f969","1f953","1f354","1f35f","1f355",
	"1f32d","1f96a","1f32e","1f32f","1f959","1f9c6","1f95a","1f373","1f958","1f372","1f963",
	"1f957","1f37f","1f9c8","1f9c2","1f96b","1f371","1f358","1f359","1f35a","1f35b","1f35c",
	"1f35d","1f360","1f362","1f363","1f364","1f365","1f96e","1f361","1f95f","1f960","1f961",
	"1f980","1f99e","1f990","1f991","1f9aa","1f366","1f367","1f368","1f369","1f36a","1f382",
	"1f370","1f9c1","1f967","1f36b","1f36c","1f36d","1f36e","1f36f","1f37c","1f95b","2615","1f375",
	"1f376","1f37e","1f377","1f378","1f379","1f37a","1f37b","1f942","1f943","1f964","1f9c3",
	"1f9c9","1f9ca","1f962","1f37d","1f374","1f944","1f52a","1f3fa","1f30d","1f30e","1f30f",
	"1f310","1f5fa","1f5fe","1f9ed","1f3d4","26f0","1f30b","1f5fb","1f3d5","1f3d6","1f3dc",
	"1f3dd","1f3de","1f3df","1f3db","1f3d7","1f9f1","1f3d8","1f3da","1f3e0","1f3e1","1f3e2",
	"1f3e3","1f3e4","1f3e5","1f3e6","1f3e8","1f3e9","1f3ea","1f3eb","1f3ec","1f3ed","1f3ef",
	"1f3f0","1f492","1f5fc","1f5fd","26ea","1f54c","1f6d5","1f54d","26e9","1f54b","26f2","26fa",
	"1f301","1f303","1f3d9","1f304","1f305","1f306","1f307","1f309","2668","1f3a0","1f3a1",
	"1f3a2","1f488","1f3aa","1f682","1f683","1f684","1f685","1f686","1f687","1f688","1f689",
	"1f68a","1f69d","1f69e","1f68b","1f68c","1f68d","1f68e","1f690","1f691","1f692","1f693",
	"1f694","1f695","1f696","1f697","1f698","1f699","1f69a","1f69b","1f69c","1f3ce","1f3cd",
	"1f6f5","1f9bd","1f9bc","1f6fa","1f6b2","1f6f4","1f6f9","1f68f","1f6e3","1f6e4","1f6e2",
	"26fd","1f6a8","1f6a5","1f6a6","1f6d1","1f6a7","2693","26f5","1f6f6","1f6a4","1f6f3","26f4",
	"1f6e5","1f6a2","2708","1f6e9","1f6eb","1f6ec","1fa82","1f4ba","1f681","1f69f","1f6a0",
	"1f6a1","1f6f0","1f680","1f6f8","1f6ce","1f9f3","231b","23f3","231a","23f0","23f1","23f2",
	"1f570","1f55b","1f567","1f550","1f55c","1f551","1f55d","1f552","1f55e","1f553","1f55f",
	"1f554","1f560","1f555","1f561","1f556","1f562","1f557","1f563","1f558","1f564","1f559",
	"1f565","1f55a","1f566","1f311","1f312","1f313","1f314","1f315","1f316","1f317","1f318",
	"1f319","1f31a","1f31b","1f31c","1f321","2600","1f31d","1f31e","1fa90","2b50","1f31f",
	"1f320","1f30c","2601","26c5","26c8","1f324","1f325","1f326","1f327","1f328","1f329","1f32a",
	"1f32b","1f32c","1f300","1f308","1f302","2602","2614","26f1","26a1","2744","2603","26c4",
	"2604","1f525","1f4a7","1f30a","1f383","1f384","1f386","1f387","1f9e8","2728","1f388","1f389",
	"1f38a","1f38b","1f38d","1f38e","1f38f","1f390","1f391","1f9e7","1f380","1f381","1f397",
	"1f39f","1f3ab","1f396","1f3c6","1f3c5","1f947","1f948","1f949","26bd","26be","1f94e","1f3c0",
	"1f3d0","1f3c8","1f3c9","1f3be","1f94f","1f3b3","1f3cf","1f3d1","1f3d2","1f94d","1f3d3",
	"1f3f8","1f94a","1f94b","1f945","26f3","26f8","1f3a3","1f93f","1f3bd","1f3bf","1f6f7",
	"1f94c","1f3af","1fa80","1fa81","1f3b1","1f52e","1f9ff","1f3ae","1f579","1f3b0","1f3b2",
	"1f9e9","1f9f8","2660","2665","2666","2663","265f","1f0cf","1f004","1f3b4","1f3ad","1f5bc",
	"1f3a8","1f9f5","1f9f6","1f453","1f576","1f97d","1f97c","1f9ba","1f454","1f455","1f456",
	"1f9e3","1f9e4","1f9e5","1f9e6","1f457","1f458","1f97b","1fa71","1fa72","1fa73","1f459",
	"1f45a","1f45b","1f45c","1f45d","1f6cd","1f392","1f45e","1f45f","1f97e","1f97f","1f460",
	"1f461","1fa70","1f462","1f451","1f452","1f3a9","1f393","1f9e2","26d1","1f4ff","1f484",
	"1f48d","1f48e","1f507","1f508","1f509","1f50a","1f4e2","1f4e3","1f4ef","1f514","1f515",
	"1f3bc","1f3b5","1f3b6","1f399","1f39a","1f39b","1f3a4","1f3a7","1f4fb","1f3b7","1f3b8",
	"1f3b9","1f3ba","1f3bb","1fa95","1f941","1f4f1","1f4f2","260e","1f4de","1f4df","1f4e0",
	"1f50b","1f50c","1f4bb","1f5a5","1f5a8","2328","1f5b1","1f5b2","1f4bd","1f4be","1f4bf",
	"1f4c0","1f9ee","1f3a5","1f39e","1f4fd","1f3ac","1f4fa","1f4f7","1f4f8","1f4f9","1f4fc",
	"1f50d","1f50e","1f56f","1f4a1","1f526","1f3ee","1fa94","1f4d4","1f4d5","1f4d6","1f4d7",
	"1f4d8","1f4d9","1f4da","1f4d3","1f4d2","1f4c3","1f4dc","1f4c4","1f4f0","1f5de","1f4d1",
	"1f516","1f3f7","1f4b0","1f4b4","1f4b5","1f4b6","1f4b7","1f4b8","1f4b3","1f9fe","1f4b9",
	"1f4b1","1f4b2","2709","1f4e7","1f4e8","1f4e9","1f4e4","1f4e5","1f4e6","1f4eb","1f4ea",
	"1f4ec","1f4ed","1f4ee","1f5f3","270f","2712","1f58b","1f58a","1f58c","1f58d","1f4dd",
	"1f4bc","1f4c1","1f4c2","1f5c2","1f4c5","1f4c6","1f5d2","1f5d3","1f4c7","1f4c8","1f4c9",
	"1f4ca","1f4cb","1f4cc","1f4cd","1f4ce","1f587","1f4cf","1f4d0","2702","1f5c3","1f5c4",
	"1f5d1","1f512","1f513","1f50f","1f510","1f511","1f5dd","1f528","1fa93","26cf","2692",
	"1f6e0","1f5e1","2694","1f52b","1f3f9","1f6e1","1f527","1f529","2699","1f5dc","2696",
	"1f9af","1f517","26d3","1f9f0","1f9f2","2697","1f9ea","1f9eb","1f9ec","1f52c","1f52d",
	"1f4e1","1f489","1fa78","1f48a","1fa79","1fa7a","1f6aa","1f6cf","1f6cb","1fa91","1f6bd",
	"1f6bf","1f6c1","1fa92","1f9f4","1f9f7","1f9f9","1f9fa","1f9fb","1f9fc","1f9fd","1f9ef",
	"1f6d2","1f6ac","26b0","26b1","1f5ff","1f3e7","1f6ae","1f6b0","267f","1f6b9","1f6ba","1f6bb",
	"1f6bc","1f6be","1f6c2","1f6c3","1f6c4","1f6c5","26a0","1f6b8","26d4","1f6ab","1f6b3","1f6ad",
	"1f6af","1f6b1","1f6b7","1f4f5","1f51e","2622","2623","2b06","2197","27a1","2198","2b07",
	"2199","2b05","2196","2195","2194","21a9","21aa","2934","2935","1f503","1f504","1f519","1f51a",
	"1f51b","1f51c","1f51d","1f6d0","269b","1f549","2721","2638","262f","271d","2626","262a",
	"262e","1f54e","1f52f","2648","2649","264a","264b","264c","264d","264e","264f","2650","2651",
	"2652","2653","26ce","1f500","1f501","1f502","25b6","23e9","23ed","23ef","25c0","23ea",
	"23ee","1f53c","23eb","1f53d","23ec","23f8","23f9","23fa","23cf","1f3a6","1f505","1f506",
	"1f4f6","1f4f3","1f4f4","2640","2642","2695","267e","267b","269c","1f531","1f4db","1f530",
	"2b55","2705","2611","2714","2716","274c","274e","2795","2796","2797","27b0","27bf","303d",
	"2733","2734","2747","203c","2049","2753","2754","2755","2757","3030","00a9","00ae","2122",
	"0023_fe0f_20e3","002a_fe0f_20e3","0030_fe0f_20e3","0031_fe0f_20e3","0032_fe0f_20e3",
	"0033_fe0f_20e3","0034_fe0f_20e3","0035_fe0f_20e3","0036_fe0f_20e3","0037_fe0f_20e3",
	"0038_fe0f_20e3","0039_fe0f_20e3","1f51f","1f520","1f521","1f522","1f523","1f524","1f170",
	"1f18e","1f171","1f191","1f192","1f193","2139","1f194","24c2","1f195","1f196","1f17e","1f197",
	"1f17f","1f198","1f199","1f19a","1f201","1f202","1f237","1f236","1f22f","1f250","1f239",
	"1f21a","1f232","1f251","1f238","1f234","1f233","3297","3299","1f23a","1f235","1f534",
	"1f7e0","1f7e1","1f7e2","1f535","1f7e3","1f7e4","26ab","26aa","1f7e5","1f7e7","1f7e8",
	"1f7e9","1f7e6","1f7ea","1f7eb","2b1b","2b1c","25fc","25fb","25fe","25fd","25aa","25ab",
	"1f536","1f537","1f538","1f539","1f53a","1f53b","1f4a0","1f518","1f533","1f532","1f3c1",
	"1f6a9","1f38c","1f3f4","1f3f3","1f3f3_fe0f_200d_1f308","1f3f4_200d_2620_fe0f","1f1e6_1f1e8",
	"1f1e6_1f1e9","1f1e6_1f1ea","1f1e6_1f1eb","1f1e6_1f1ec","1f1e6_1f1ee","1f1e6_1f1f1",
	"1f1e6_1f1f2","1f1e6_1f1f4","1f1e6_1f1f6","1f1e6_1f1f7","1f1e6_1f1f8","1f1e6_1f1f9",
	"1f1e6_1f1fa","1f1e6_1f1fc","1f1e6_1f1fd","1f1e6_1f1ff","1f1e7_1f1e6","1f1e7_1f1e7",
	"1f1e7_1f1e9","1f1e7_1f1ea","1f1e7_1f1eb","1f1e7_1f1ec","1f1e7_1f1ed","1f1e7_1f1ee",
	"1f1e7_1f1ef","1f1e7_1f1f1","1f1e7_1f1f2","1f1e7_1f1f3","1f1e7_1f1f4","1f1e7_1f1f6",
	"1f1e7_1f1f7","1f1e7_1f1f8","1f1e7_1f1f9","1f1e7_1f1fb","1f1e7_1f1fc","1f1e7_1f1fe",
	"1f1e7_1f1ff","1f1e8_1f1e6","1f1e8_1f1e8","1f1e8_1f1e9","1f1e8_1f1eb","1f1e8_1f1ec",
	"1f1e8_1f1ed","1f1e8_1f1ee","1f1e8_1f1f0","1f1e8_1f1f1","1f1e8_1f1f2","1f1e8_1f1f3",
	"1f1e8_1f1f4","1f1e8_1f1f5","1f1e8_1f1f7","1f1e8_1f1fa","1f1e8_1f1fb","1f1e8_1f1fc",
	"1f1e8_1f1fd","1f1e8_1f1fe","1f1e8_1f1ff","1f1e9_1f1ea","1f1e9_1f1ec","1f1e9_1f1ef",
	"1f1e9_1f1f0","1f1e9_1f1f2","1f1e9_1f1f4","1f1e9_1f1ff","1f1ea_1f1e6","1f1ea_1f1e8",
	"1f1ea_1f1ea","1f1ea_1f1ec","1f1ea_1f1ed","1f1ea_1f1f7","1f1ea_1f1f8","1f1ea_1f1f9",
	"1f1ea_1f1fa","1f1eb_1f1ee","1f1eb_1f1ef","1f1eb_1f1f0","1f1eb_1f1f2","1f1eb_1f1f4",
	"1f1eb_1f1f7","1f1ec_1f1e6","1f1ec_1f1e7","1f1ec_1f1e9","1f1ec_1f1ea","1f1ec_1f1eb",
	"1f1ec_1f1ec","1f1ec_1f1ed","1f1ec_1f1ee","1f1ec_1f1f1","1f1ec_1f1f2","1f1ec_1f1f3",
	"1f1ec_1f1f5","1f1ec_1f1f6","1f1ec_1f1f7","1f1ec_1f1f8","1f1ec_1f1f9","1f1ec_1f1fa",
	"1f1ec_1f1fc","1f1ec_1f1fe","1f1ed_1f1f0","1f1ed_1f1f2","1f1ed_1f1f3","1f1ed_1f1f7",
	"1f1ed_1f1f9","1f1ed_1f1fa","1f1ee_1f1e8","1f1ee_1f1e9","1f1ee_1f1ea","1f1ee_1f1f1",
	"1f1ee_1f1f2","1f1ee_1f1f3","1f1ee_1f1f4","1f1ee_1f1f6","1f1ee_1f1f7","1f1ee_1f1f8",
	"1f1ee_1f1f9","1f1ef_1f1ea","1f1ef_1f1f2","1f1ef_1f1f4","1f1ef_1f1f5","1f1f0_1f1ea",
	"1f1f0_1f1ec","1f1f0_1f1ed","1f1f0_1f1ee","1f1f0_1f1f2","1f1f0_1f1f3","1f1f0_1f1f5",
	"1f1f0_1f1f7","1f1f0_1f1fc","1f1f0_1f1fe","1f1f0_1f1ff","1f1f1_1f1e6","1f1f1_1f1e7",
	"1f1f1_1f1e8","1f1f1_1f1ee","1f1f1_1f1f0","1f1f1_1f1f7","1f1f1_1f1f8","1f1f1_1f1f9",
	"1f1f1_1f1fa","1f1f1_1f1fb","1f1f1_1f1fe","1f1f2_1f1e6","1f1f2_1f1e8","1f1f2_1f1e9",
	"1f1f2_1f1ea","1f1f2_1f1eb","1f1f2_1f1ec","1f1f2_1f1ed","1f1f2_1f1f0","1f1f2_1f1f1",
	"1f1f2_1f1f2","1f1f2_1f1f3","1f1f2_1f1f4","1f1f2_1f1f5","1f1f2_1f1f6","1f1f2_1f1f7",
	"1f1f2_1f1f8","1f1f2_1f1f9","1f1f2_1f1fa","1f1f2_1f1fb","1f1f2_1f1fc","1f1f2_1f1fd",
	"1f1f2_1f1fe","1f1f2_1f1ff","1f1f3_1f1e6","1f1f3_1f1e8","1f1f3_1f1ea","1f1f3_1f1eb",
	"1f1f3_1f1ec","1f1f3_1f1ee","1f1f3_1f1f1","1f1f3_1f1f4","1f1f3_1f1f5","1f1f3_1f1f7",
	"1f1f3_1f1fa","1f1f3_1f1ff","1f1f4_1f1f2","1f1f5_1f1e6","1f1f5_1f1ea","1f1f5_1f1eb",
	"1f1f5_1f1ec","1f1f5_1f1ed","1f1f5_1f1f0","1f1f5_1f1f1","1f1f5_1f1f2","1f1f5_1f1f3",
	"1f1f5_1f1f7","1f1f5_1f1f8","1f1f5_1f1f9","1f1f5_1f1fc","1f1f5_1f1fe","1f1f6_1f1e6",
	"1f1f7_1f1ea","1f1f7_1f1f4","1f1f7_1f1f8","1f1f7_1f1fa","1f1f7_1f1fc","1f1f8_1f1e6",
	"1f1f8_1f1e7","1f1f8_1f1e8","1f1f8_1f1e9","1f1f8_1f1ea","1f1f8_1f1ec","1f1f8_1f1ed",
	"1f1f8_1f1ee","1f1f8_1f1ef","1f1f8_1f1f0","1f1f8_1f1f1","1f1f8_1f1f2","1f1f8_1f1f3",
	"1f1f8_1f1f4","1f1f8_1f1f7","1f1f8_1f1f8","1f1f8_1f1f9","1f1f8_1f1fb","1f1f8_1f1fd",
	"1f1f8_1f1fe","1f1f8_1f1ff","1f1f9_1f1e6","1f1f9_1f1e8","1f1f9_1f1e9","1f1f9_1f1eb",
	"1f1f9_1f1ec","1f1f9_1f1ed","1f1f9_1f1ef","1f1f9_1f1f0","1f1f9_1f1f1","1f1f9_1f1f2",
	"1f1f9_1f1f3","1f1f9_1f1f4","1f1f9_1f1f7","1f1f9_1f1f9","1f1f9_1f1fb","1f1f9_1f1fc",
	"1f1f9_1f1ff","1f1fa_1f1e6","1f1fa_1f1ec","1f1fa_1f1f2","1f1fa_1f1f3","1f1fa_1f1f8",
	"1f1fa_1f1fe","1f1fa_1f1ff","1f1fb_1f1e6","1f1fb_1f1e8","1f1fb_1f1ea","1f1fb_1f1ec",
	"1f1fb_1f1ee","1f1fb_1f1f3","1f1fb_1f1fa","1f1fc_1f1eb","1f1fc_1f1f8","1f1fd_1f1f0",
	"1f1fe_1f1ea","1f1fe_1f1f9","1f1ff_1f1e6","1f1ff_1f1f2","1f1ff_1f1fc",
	"1f3f4_e0067_e0062_e0065_e006e_e0067_e007f","1f3f4_e0067_e0062_e0073_e0063_e0074_e007f",
	"1f3f4_e0067_e0062_e0077_e006c_e0073_e007f"	];
		
var vm = new Vue({
	el: '#app',
	data: {
		nickname : '',
		userList : [],
		roomList : {},
		joinedRooms : [],
		usersInRoom: [],
		serverGames: [],
		cursors: {},
		currentRoom : defaultRoom, //referenced by .name which is unique
		currentRoomType : roomType.chat,
		formMessage : '',
		msgCursorIndex: 0
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
		allGames : function(){
			var allGames = [];
			for(var room in this.roomList){	
				if(this.roomList[room].type == roomType.game){
					var theseGamers = this.getUsersInRoom(this.roomList[room]);
					var game = {
						players: theseGamers,
						name: this.roomList[room].name,
						status: this.roomList[room].status
					}
					allGames.push(game);
				}
			}
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
			if(aRoom.id){
				if(this.currentRoom != aRoom.id){
					var oldRoom = this.currentRoom;
					this.currentRoom = aRoom.id;
					this.currentRoomType = roomType[aRoom.type];
					this.toggleActiveRooms(oldRoom);
				}
			}else{ 
				if(this.currentRoom != aRoom.name){
					var oldRoom = this.currentRoom;
					this.currentRoom = aRoom.name;
					this.currentRoomType = roomType[aRoom.type];
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
			$('#' +this.currentRoom+ '_cursor_canvas').show();
			if(oldRoom != this.currentRoom){
				$('#' +oldRoom+ '_room').removeClass('activeRoom');
				$('#' +oldRoom+ '_room').addClass('inactiveRoom');
				$('#' +oldRoom+ '_messages').hide();
				$('#' +oldRoom+ '_canvas').hide();
				$('#' +oldRoom+ '_cursor_canvas').hide();
			}
			if(this.currentRoomType == roomType.game){
				$('#canvasControls').show();
			}else{
				$('#canvasControls').hide();
				alignMessageToBottom();
			}
			if(this.currentRoomType == roomType.server){
				$('#msgForm').prop('disabled', true);
			}else{
				$('#msgForm').prop('disabled', false);
			}
			this.usersInRoom = this.getUsersInRoom(this.currentRoom);
		},
		start : function(){
			$('#nameform').hide();
			$('#main').show();
			connect(this.nickname);
		},
		nicknameEnter : function(event){
			if ( event.which == 13) {
				this.start();
			}
		},
		sendMessage : function(){
			//var inputval = $('#msgForm').val();
			var inputval = vm.formMessage;
			if(inputval.charAt(0) == '/'){
				checkCommand(inputval.substring(1, inputval.length)); //trim off '/'
				return false;
			}
			socket.emit('chat_message', newMsg(socket.id, socket.username, vm.currentRoom, inputval));
			if(vm.currentRoomType == roomType.dm){ //dm's are only sent to the user dm'd, so we need to keep track of the messages we sent
				appendText(newMsg(vm.currentRoom, socket.username, vm.currentRoom,inputval));  /***MESSAGE***/
			}
			//$('#msgForm').val('');
			vm.formMessage = '';
			focusCursor('msgForm',1);
		},
		messageEnter : function(event){
			if ( event.which == 13 && !event.shiftKey) {
				this.sendMessage();
				event.preventDefault(); //don't let the newline on to the textarea after sending
			}
			vm.msgCursorIndex = $('#msgForm').prop("selectionStart") + 1;
		},
		messageSelection : function(event){
			vm.msgCursorIndex = $('#msgForm').prop("selectionStart");
		}
	},
	components: { //don't need these if they are globally registered
		'help-message' : {
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
		}
	}, 
	computed: {

	}
})

var socket;
connect = function(name){
	socket = io();
	socket.emit('join_room', serverRoom, serverRoom, roomType.server);
	socket.emit('join_room', defaultRoom,defaultRoom, roomType.chat);

	socket.on('joined_room', function(room){
		//console.log("Joined:" + room.name);
		vm.joinedRooms.push(room);
		vm.roomList[room.name] = room; //important
		var oldRoom = vm.currentRoom;
		vm.currentRoom = room.name;
		vm.currentRoomType = roomType[room.type];
		//console.log("Room type:" + vm.currentRoomType);
		//console.log(vm.$refs);
		vm.toggleActiveRooms(oldRoom);
		focusCursor('msgForm',1);
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

		var withBrs = '';
		console.log(msg.msg);
		var msgTextRecieved = msg.msg.split('\n');
		console.log(msgTextRecieved);
		for(var i = 0; i <msgTextRecieved.length; i++){
			withBrs += msgTextRecieved[i] + '<br/>';
		}
		msgTextRecieved = withBrs.split(' ');
		console.log(msgTextRecieved);
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
				//check for newlines
				var match = /\r|\n/.exec(msgTextRecieved[word]);
				if (match) {
					msgTextDisplayed += "<br/>";
				}
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
		vm.toggleActiveRooms(room);
		removeRoom(room);
		$('#' +vm.currentRoom+ '_messages').show();
		$('#'+vm.currentRoom+'_messages').append($('<li>').text('Left Room:'+room).css('color','blue'));  /***MESSAGE***/
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
		vm.userList = usrList;
		vm.roomList = rooms;
		vm.usersInRoom = vm.getUsersInRoom(vm.currentRoom);
		vm.cursors = vm.purgeOldCursors();
	});
	
	socket.on('force_name_update', function(newName){ //room name
		socket.username = newName;
	});
	
	socket.on('drawing', onDrawingEvent);
	socket.on('track_cursor', ontrackCursor);
	socket.on('clear_canvas', clearCanvas);

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
				socket.emit('chat_message', newMsg(socket.id, socket.username, userId, message));
				$('#'+vm.currentRoom+'_messages').append($('<li>').text(socket.username + ":" + message));  /***MESSAGE***/
				vm.currentRoomType = roomType.dm;
			}else{
				$('#'+vm.currentRoom+'_messages').append($('<li>').text('Invalid user.').css('color','red'));  /***MESSAGE***/
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
			socket.emit('assign_name', newMsg(socket.id, socket.username, vm.currentRoom, name), avatar);

		}else if(inputvalArgs[0]=="debug"){
			socket.emit('debug server');
			console.log(socket);

		}else if(inputvalArgs[0]=="help"){
			$('#'+vm.currentRoom+'_messages').append('<help-message></help-message>');  /***MESSAGE***/
			
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
		}else if(inputvalArgs[0]=="start"){
			if(vm.currentRoomType != roomType.game){
				invalidCommand();
				return;
			}
			socket.emit('start_game', newMsg(socket.id, socket.username, vm.currentRoom));
						
		}else{
			$('#'+vm.currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red')); /***MESSAGE***/
		}
		clearAndScroll();
	}
	invalidCommand = function(){
		$('#'+vm.currentRoom+'_messages').append($('<li>').text('Invalid command.').css('color','red')); /***MESSAGE***/
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
buildServerTable  = function(){
	console.log("build server table");
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
	$('#'+msg.room+'_messages').append($('<li class="messageMedia">').append($('<img width="500" src="'+msg.msg+'"/>')));
}

appendText = function(msg){
	$('#'+msg.room+'_messages').append($('<li class="messageText">').append('<img class="userIcon" src="'+getAvatarFromName(msg.username)+'"/><div class="messageTextContainer"><span class="msgDisplayName">'+getName(msg)+'</span>' + '<div class="messageDisplayText">'+msg.msg+ '</div></div>'));
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


pickPaintTool = function(type){
	for(var t in drawType){
		if(drawType[t] == type){
			//add class
			penCursor.type = type;
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
	var scrollm;
	if(vm.currentRoomType == roomType.game){
		scrollm = document.getElementById(vm.currentRoom+'_messages');
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

toggleEmojiPicker = function(){
	$('#emojiDiv').toggle();
}
createEmojis = function (){
	for(var i=0; i < emojiList.length; i++){
		try{
			var emo = String.fromCodePoint('0x'+emojiList[i]); 
			if(emo){
				$('#emojiLi').append($('<span onclick="insertEmo(\''+emo+'\')">'+emo+'</span>'));
			}
		}catch{
			//skip it
		}	
	}
}
insertEmo = function(emo){ 
	var newmsg = vm.formMessage.substr(0, vm.msgCursorIndex);
	var newMsg2 = vm.formMessage.substr(vm.msgCursorIndex);
	
	vm.formMessage = newmsg + emo + newMsg2;
	vm.msgCursorIndex = vm.msgCursorIndex + emo.length;
	focusCursor('msgForm',vm.msgCursorIndex);
}
$(document).ready(function() {
	createEmojis();
});