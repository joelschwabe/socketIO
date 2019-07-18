module.exports = {
    
    gameOver : function(matrix, winDelta){
        var winner = '';
        for(var i = 0; i < matrix.length; i++){
            for(var j = 0; j < matrix[i].length; j++){
                if(j > winDelta){ //west
                    if(turboLogic(i,j,'','-')){  
                        winner = matrix[i][j];
                    }	
                }
                if(j < winDelta){ //east
                    if(turboLogic(i,j,'','+')){  
                        winner = matrix[i][j];
                    }	
                }
                if(i > winDelta) {//north
                    if(turboLogic(i,j,'-',"")){
                        winner = matrix[i][j];
                    }	
                }
                if(i < winDelta) {// south
                    if(turboLogic(i,j,'+',"")){
                        winner = matrix[i][j];
                    }	
                }				
                if((i < winDelta) && (j > winDelta)){//southwest
                    if(turboLogic(i,j,'+',"-")){
                        winner = matrix[i][j];
                    }
                }
                if((i > winDelta) && (j < winDelta)){//northeast
                    if(turboLogic(i,j,'-',"+")){
                        winner = matrix[i][j];
                    } 
                }
                if((i > winDelta) && (j > winDelta)){//northwest
                    if(turboLogic(i,j,'-',"-")){
                        winner = matrix[i][j];
                    } 
                }
                if((i < winDelta) && (j < winDelta)){//southeast
                    if(turboLogic(i,j,'+',"+")){
                        winner = matrix[i][j];
                    } 
                }
            }
        }
        return winner;
    },

};

turboLogic = function( i, j, op1, op2){
    if(matrix[i][j] == '') return false;
    var op1x, op1y, op2x, op2y;
    for(var k = 0; k < winDelta; k++){
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