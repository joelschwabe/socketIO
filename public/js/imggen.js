makeImgGen = function(room){
	$('#' +room+ '_imggen').empty();
	var sloppedTemplate = 
	  "<div class=\"sloppedSplashScreen\">"
    + "<img src=\"/images/slopped.png\" alt=\"Slopped\" class=\"sloppedLogo\">"
    + "<p class=\"sloppedDesc\">Welcome to SLOPPED! The name of the game is to create the best prompt fitting the theme of the prompt and utilizing ALL of the mystery words. Winner is decided by votes!</p>"
    + "<button class=\"sloppedStartButton\" onclick=\"startSlopping()\">Start Game!</button>"
    + "</div>";
	
	$('#' +room+ '_imggen').append(sloppedTemplate);
	
}

displayPrompt = function(room, promptWords, theme){
	$('#' +room+ '_imggen').empty();
	var sloppedTemplate = 
	  "<div class=\"sloppedSplashScreen\">"
    + "<p class=\"sloppedDesc\">This is your theme: ' " + theme + " ' </p>"
	+ "<p class=\"sloppedDesc\">These are your keywords: " + promptWords + " </p>"
	+ "<p class=\"sloppedDesc\" >Time Remaining: </p>"
	+ "<p class=\"sloppedDesc\" id=\"timeRemainingPrompt\"></p>"
	+ "<textarea id=\"promptForm\"></textarea><br/>"
    + "<button class=\"sloppedStartButton\" onclick=\"submitPrompt()\">Submit Prompt!</button>"
    + "</div>";
	
	$('#' +room+ '_imggen').append(sloppedTemplate);
	
}

displayRoundFinished = function(room){
	$('#' +room+ '_imggen').empty();
	var sloppedTemplate = 
	  "<div class=\"sloppedSplashScreen\">"
    + "<p class=\"sloppedDesc\">Waiting for other players....</p>"
    + "</div>";
	
	$('#' +room+ '_imggen').append(sloppedTemplate);
	
}

displayRoundWinner = function(room, winner){
	var sloppedTemplate = 
	"<div class=\"winnersAnnoucement\">"
	+ "<p class=\"sloppedDesc\">" + winner + " is the winner!</p>"
	+ "</div>";

	$('#' +room+ '_imggen').append(sloppedTemplate);
	
}

displayImages = function(room, image1, image2, theme, keywords){
	$('#' +room+ '_imggen').empty();

	var sloppedTemplate = 
	  "<div class=\"sloppedSplashScreen\">"
	  + "<p class=\"sloppedDesc\" >The image that best matches the theme:"+ theme +" - with the keywords: " + keywords + " </p>"
	  + "<table class=\"sloppedVoteTable\">"
	  + "  <tr>"
	  + "    <td>"
	  + "      <img id=\"image1\" alt=\"Slopped\" class=\"sloppedImage\">"
	  + "    </td>"
	  + "    <td>"
	  + "		<button class=\"sloppedVoteButton\" onclick=\"voteA()\">Vote for A</button>"
	  + "    </td>"
	  + "  </tr>"
	  + "  <tr>"
	  + "  <tr>"
	  + "    <td>"
	  + "      <img id=\"image2\" alt=\"Slopped2\" class=\"sloppedImage\">"
	  + "    </td>"
	  + "    <td>"
	  + "		<button class=\"sloppedVoteButton\" onclick=\"voteB()\">Vote for B</button>"
	  + "    </td>"
	  + "  </tr>"
	  + "  <tr>"
	  + "</table>"
	+ "<p class=\"sloppedDesc\" >Time Remaining: </p>"
	+ "<p class=\"sloppedDesc\" id=\"timeRemainingVote\"></p>"
    + "</div>";

	$('#' +room+ '_imggen').append(sloppedTemplate);
	$('#image1')[0].src = image1;
	$('#image2')[0].src = image2;
	
}

setCountdownVote = function(count){
	if($('#timeRemainingVote')[0]){
		$('#timeRemainingVote')[0].innerText = count;
	}
}

setCountdownPrompt = function(count){
	if($('#timeRemainingPrompt')[0]){
		$('#timeRemainingPrompt')[0].innerText = count;
	}
}