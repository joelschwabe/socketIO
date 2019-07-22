module.exports = {
    gameOver : function(matrix, i, j, winDelta){
        var winner = new Object();
        winner.icon = '';
        var bsize = matrix.length;
        var northSouth = turboLogic(i,j-winDelta,'','+', winDelta, bsize, matrix);
        var eastWest = turboLogic(i-winDelta,j,'+','', winDelta, bsize, matrix);
        var norWesSoEast = turboLogic(i-winDelta,j+winDelta,'+','-', winDelta, bsize, matrix);
        var norEaSoWest = turboLogic(i-winDelta,j-winDelta,'+','+', winDelta, bsize, matrix);

        if(northSouth.length > 0){
            winner.icon = matrix[i][j];
            winner.winLine = northSouth;
        }	
        if(eastWest.length > 0){
            winner.icon = matrix[i][j];
            winner.winLine = eastWest;
        }	
        if(norWesSoEast.length > 0){
            winner.icon = matrix[i][j];
            winner.winLine = norWesSoEast;
        }	
        if(norEaSoWest.length > 0){
            winner.icon = matrix[i][j];
            winner.winLine = norEaSoWest;
        }	
        return winner;
    }
};

turboLogic = function( i, j, op1, op2, winDelta, bsize, matrix){
    var count = 0;
    var winLine = [];
    var realWin = [];
    var won = false;
    var op1x, op1y, op2x, op2y;
    for(var k = 0; k < (winDelta * 2); k++){
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
        if(op1x >= 0 && op1y >= 0 && op2x >=0  && op2y >= 0 && op1x < bsize && op1y < bsize && op2x < bsize  && op2y < bsize ){
            if(matrix[op1x][op1y] == matrix[op2x][op2y]){
                count++;
                winLine.push([op1x,op1y]);
            }else{
                winLine = [];
                count = 0;
            }
        }
        if(count == winDelta){
            winLine.push([op2x,op2y]);
            realWin = Array.from(winLine);
            var won = true;
        }
    }
    if(won){
        return realWin; 
    }
    else{
        return []; 
    }
}