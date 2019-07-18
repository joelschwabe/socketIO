var bsize = 7;
var limit = bsize * bsize;
var winLength = 4;
var winDelta = winLength - 1;
var counter = 0;
var matrix = [];
var xo = true;


clickedBox = function(obj){
	var size = bsize;
	var x = obj.id;
	var y = x.split('_');
	var i = parseInt(y[2]);
	var j = parseInt(y[3]);
	if(matrix[i][j] == ''){
		var textIn = xo == true ? 'X' : 'O';
		$('#'+obj.id).text(textIn);
		matrix[i][j] = textIn;
		xo = !xo;
		var winner = gameOver(i,j);
		if(winner !== '') {
			console.log('winner is:'+ winner);
			window.alert('winner is:'+ winner);
			counter = 0;
			makeBoard(vm.currentRoom, size);
		}
		if(counter == limit){
			window.alert('draw!');
			counter = 0;
			makeBoard(vm.currentRoom, size);
		}
		counter++;
	}
}

gameOver = function(i,j){
	var winner = '';
	if(j >= winDelta){ //west
	console.log("west");
		if(turboLogic(i,j,'','-')){  
			winner = matrix[i][j];
		}	
	}
	if(j <= winDelta){ //east
		console.log("east");
			if(turboLogic(i,j,'','+')){  
				winner = matrix[i][j];
			}	
		}
	if(i >= winDelta) {//north
		console.log("north");
		if(turboLogic(i,j,'-','')){
			winner = matrix[i][j];
		}	
	}
	if(i <= winDelta) {// south
		console.log("south");
		if(turboLogic(i,j,'+','')){
			winner = matrix[i][j];
		}	
	}				
	if((i <= winDelta) && (j >= winDelta)){//southwest
		console.log("southwest");
		if(turboLogic(i,j,'+','-')){
			winner = matrix[i][j];
		}
	}
	if((i >= winDelta) && (j <= winDelta)){//northeast
		console.log("northeast");
		if(turboLogic(i,j,'-','+')){
			winner = matrix[i][j];
		} 
	}
	if((i >= winDelta) && (j >= winDelta)){//northwest
		console.log("northwest");
		if(turboLogic(i,j,'-','-')){
			winner = matrix[i][j];
		} 
	}
	if((i <= winDelta) && (j <= winDelta)){//southeast
		console.log("southeast");
		if(turboLogic(i,j,'+','+')){
			winner = matrix[i][j];
		} 
	}
	return winner;
}

turboLogic = function( i, j, op1, op2){
	if(matrix[i][j] == '') return false;
	var op1x, op1y, op2x, op2y;
	for(var k = 0; k < winDelta; k++){
		if(op1=='+'){
			op1x = i + k;
			op2x = i + k + 1;
		}else if(op1=='-'){
			op1x = i - k;
			op2x = i - k - 1;
		}else{
			op1x = i;
			op2x = i;
		}
		if(op2=='+'){
			op1y = j + k;
			op2y = j + k + 1;
		}else if(op2=='-'){
			op1y = j - k;
			op2y = j - k - 1;
		}else{
			op1y = j;
			op2y = j;
		}
		//console.log(op1x + ":"+op1y + " -> " + op2x+":"+op2y);
		if(matrix[op1x][op1y] == matrix[op2x][op2y]){
			//nothing
		}else{
			return false;
		}
	}
	return true;
}

makeBoard = function(room, size){
	$('#' +room+ '_tictac').empty();
	matrix = [];
	var tableId = room +"_tictacTable";
	var tableTic = "<table id='"+ tableId +"'><table>";
	$('#' +room+ '_tictac').append(tableTic);
	for(var i = 0; i < size; i++){
		var trId = room + "_tic_" + i;
		var tabRow = "<tr id='" + trId + "'></tr>";
		$('#'+tableId).append(tabRow);
		matrix.push([]);
		for(var j = 0; j < size; j++){
			var tdId = room +"_tac_" + i + "_" + j; 
			var tableData = "<td><div id='" + tdId + "' class='tacSquare'></div></td>";
			$('#'+trId).append(tableData);
			$('#'+tdId).on("click", function(){
				clickedBox(this);
			})
			matrix[i].push('');
		}
	}
}