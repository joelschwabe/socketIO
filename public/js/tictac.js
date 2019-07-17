var size = 7;
var limit = size * size;
var winLength = 4;
var winTheta = winLength - 1;
var counter = 0;
var matrix = [];
var xo = true;
var winner;

clickedBox = function(obj){
	var x = obj.id;
	var y = x.split('_');
	if(matrix[y[1]][y[2]] == ''){
		var textIn = xo == true ? 'X' : 'O';
		$('#'+obj.id).text(textIn);
		matrix[y[1]][y[2]] = textIn;
		xo = !xo;
		if(gameOver()){
			console.log('winner is:'+ winner);
			window.alert('winner is:'+ winner);
			counter = 0;
			makeBoard();
		}
		if(counter == limit){
			window.alert('draw!');
			counter = 0;
			makeBoard();
		}
		counter++;
	}
}

gameOver = function(){
	var ended = false;
	//count rows
	for(var i = 0; i < matrix.length; i++){
		for(var j = 0; j < matrix[i].length; j++){
				//console.log(matrix[i]);
				if(j > winTheta){ //westeast
				console.log("east and west");
					if(turboLogic(i,j,'','-')){  
						winner = matrix[i][j];
						ended = true;
					}	
				}
				if(i > winTheta) {//north and south
					console.log("north and south");
					if(turboLogic(i,j,'-',"")){
						winner = matrix[i][j];
						ended = true;
					}	
				}
				if((i < winTheta) && (j > winTheta)){//southwest
					console.log("southwest");
					if(turboLogic(i,j,'+',"-")){
						winner = matrix[i][j];
						ended = true;
					}
				}
				if((i > winTheta) && (j < winTheta)){//northeast
					console.log("northeast");
					if(turboLogic(i,j,'-',"+")){
						winner = matrix[i][j];
						ended = true;
					} 
				}
				if((i > winTheta) && (j > winTheta)){//northwest
					console.log("northwest");
					if(turboLogic(i,j,'-',"-")){
						winner = matrix[i][j];
						ended = true;
					} 
				}
				if((i < winTheta) && (j < winTheta)){//southeast
					console.log("southeast");
					if(turboLogic(i,j,'+',"+")){
						winner = matrix[i][j];
						ended = true;
					} 
				}
		}
	}
	return ended;
}

turboLogic = function( i, j, op1, op2){
	if(matrix[i][j] == '') return false;
	var op1x, op1y, op2x, op2y;
	for(var k = 0; k < winTheta; k++){
		if(op1=="+"){
			op1x = i + k;
			op2x = i + k + 1;
		}else if(op1=="-"){
			op1x = i - k;
			op2x = i - k - 1;
		}else{
			op1x = i;
			op2x = i;
		}
		if(op2=="+"){
			op1y = j + k;
			op2y = j + k + 1;
		}else if(op2=="-"){
			op1y = j - k;
			op2y = j - k - 1;
		}else{
			op1y = j;
			op2y = j;
		}
		console.log(op1x + ":"+op1y + " -> " + op2x+":"+op2y);

		if(matrix[op1x][op1y] == matrix[op2x][op2y]){
			//nothing
		}else{
			return false;
		}
	}
	
	return true;
}

makeBoard = function(){
	$("#tic").empty();
	var tableTic = "<table id='tictac'><table>";
	$("#tic").append(tableTic);
	for(var i = 0; i < size; i++){
		var trId = "tic_" + i;
		var tabRow = "<tr id='" + trId + "'></tr>";
		$("#tictac").append(tabRow);
		matrix.push([]);
		for(var j = 0; j < size; j++){
			var tdId = "tac_" + i + "_" + j; 
			var tableData = "<td><div id='" + tdId + "' class='tacSquare'></div></td>";
			$('#tic_'+i).append(tableData);
			$('#'+tdId).on("click", function(){
				clickedBox(this);
			})
			matrix[i].push('');
		}
		
	}
}