module.exports = {
    gameOver : function(matrix, i, j, winDelta){
        var winner = '';
        var bsize = matrix.length;
        if(turboLogic(i,j-winDelta,'','+', winDelta, bsize, matrix)){ 
            winner = matrix[i][j];
        }	
        if(turboLogic(i-winDelta,j,'+','', winDelta, bsize, matrix)){ 
            winner = matrix[i][j];
        }	
        if(turboLogic(i-winDelta,j+winDelta,'+','-', winDelta, bsize, matrix)){ 
            winner = matrix[i][j];
        }
        if(turboLogic(i-winDelta,j-winDelta,'+','+', winDelta, bsize, matrix)){ 
            winner = matrix[i][j];
        } 
        return winner;
    }
};

turboLogic = function( i, j, op1, op2, winDelta, bsize, matrix){
    var count = 0;
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
/*          console.log(op1x + " " + op1y + " " +op2x+ " " +op2y+ " ")
            console.log(matrix[op1x][op1y]);
            console.log(matrix[op2x][op2y]); */
            if(matrix[op1x][op1y] == matrix[op2x][op2y]){
                count++;
            }else{
                count = 0;
            }
        }
        if(count == winDelta){
            return true;
        }
    }
    return false;
}