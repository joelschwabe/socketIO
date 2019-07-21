boxClicked = function(click){
	var boxId = '#' + click.room + "_tac_";
	boxId += click.y + "_" + click.x;
	$(boxId).text(click.icon);
}

clickedBox = function(obj){
	var x = obj.id;
	var y = x.split('_');
	var i = parseInt(y[2]);
	var j = parseInt(y[3]);
	var clickAction = new Object();
	clickAction.x = j;
	clickAction.y = i;
	clickAction.userId = socket.id;
	clickAction.room = vm.currentRoom;
	socket.emit('tic_click',clickAction);
}

makeBoard = function(room, size, winLength){
	$('#' +room+ '_tictac').empty();
	var tableId = room +"_tictacTable";
	var tableTic = "<p>TicTacToe : First to " +winLength + " wins!</p><table id='"+ tableId +"'><table>";
	$('#' +room+ '_tictac').append(tableTic);
	for(var i = 0; i < size; i++){
		var trId = room + "_tic_" + i;
		var tabRow = "<tr id='" + trId + "'></tr>";
		$('#'+tableId).append(tabRow);
		for(var j = 0; j < size; j++){
			var tdId = room +"_tac_" + i + "_" + j; 
			var tableData = "<td><div id='" + tdId + "' class='tacSquare'></div></td>";
			$('#'+trId).append(tableData);
			$('#'+tdId).on("click", function(){
				clickedBox(this);
			})
		}
	}
}
