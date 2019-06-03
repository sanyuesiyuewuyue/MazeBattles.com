var roomID;
var myp5;
var timerStarted = false;

socket.on("generated-url", createRoom);

function createRoom(id) { 
    roomID = id;
    console.log("roomID = " + roomID);

    $("#url-menu").html("share this code with your friend: <span class='code'>" + roomID +
        "</span><br><b>stay on this page</b>. you will be automatically paired once your friend joins.");
    $(".one-on-one-menu").hide();
    $("#url-menu").show();
}

socket.on("invalid", alertError); // When the user entered a room code that does not exist

function alertError() {
    alert("The code you entered is invalid.");
}

socket.on("maze", downloadMaze);
	
function downloadMaze(newMaze) {
	var mazeToCopy = newMaze[0];
	var cellSize = cellSizes[newMaze[1]];
	//console.log("cellSize = " + cellSize);;
	maze = new Maze(mazeToCopy.numRows, mazeToCopy.numColumns, cellSize);
	maze.cellGraph = mazeToCopy.cellGraph;

	path = ["0-0"];
	solved = false;
	playerPosition = maze.cellGraph[0][0];
	playerCol = 0;
	playerRow = 0;
}

socket.on("paired", initializedGame);

function initializedGame(room) {
	// rematch: whether the user is playing a rematch game

	// room: the id of the room the user has just joined
	roomID = room;

	/*if (initialized) {
		console.log("removing child in canvas2-wrapper");

	}*/

		var canvasWrapper = document.getElementById("canvas2-wrapper");
		while (canvasWrapper.firstChild) {
			canvasWrapper.removeChild(canvasWrapper.firstChild);
		}
	
		displayTab(3, 3); 

		myp5 = new p5(mazeDisplay, "canvas2-wrapper");
	
		mazeComplete = true;
		initialized = true;

		$("#time-elapsed").show();

	    timer.reset();
	    timer.start();
	    timer.addEventListener("secondsUpdated", updateTime);
}

function updateTime() {
    if (mazeComplete) {
        $("#time-elapsed").html("time elapsed: <span id=\"time-span\">" + timer.getTimeValues().toString(["minutes", "seconds"]) + "</span>");
    }
}

function drawPath(p, path) {
    if (path.length >= 1) {
        p.strokeWeight(2);
        p.stroke(98, 244, 88);

        var prev = path[0];

        var components = prev.split("-");

        var prevRow = parseInt(components[0]);
        var prevColumn = parseInt(components[1]);

        p.line(maze.cellSize / 2, maze.cellSize / 2, column * maze.cellSize + maze.cellSize / 2, row * maze.cellSize + maze.cellSize / 2);

        for (var k = 1; k < path.length; k++) {
            var pathCell = path[k];
            components = pathCell.split("-");
            var row = components[0];
            var column = components[1];

            p.line(prevColumn * maze.cellSize + maze.cellSize / 2, prevRow * maze.cellSize + maze.cellSize / 2, 
            	column * maze.cellSize + maze.cellSize / 2, row * maze.cellSize + maze.cellSize / 2);
            prev = pathCell.split("-");

            prevRow = prev[0];
            prevColumn = prev[1];
        }

        p.strokeWeight(1);
    }
}

function rematch() {
	$("#time-elapsed").html("Waiting for your opponent to accept your rematch request.");
	socket.emit("rematch", roomID);
}

socket.on("lost", handleLoss);

function handleLoss() {
	solved = true;
	timer.stop();

	$("#time-elapsed").html("Your opponent won the match. /  <button id=\"rematch\" onclick=\"rematch()\">Rematch</button> / <button id=\"quit\"  onclick=\"window.location.href='http://www.mazebattles.com'\">Quit</button>")
}

socket.on("disconnectedUser", opponentDisconnect);

function alertOpponentDisconnect() {
	alert("Your opponent disconnected from the match");
}

function redirectUser() {
	window.location.href = "http://www.mazebattles.com";
}

function opponentDisconnect() {
	// For some reason, 
	$.ajax({
		url: alertOpponentDisconnect(),
		success: function() {
			redirectUser();
		}
	})
}

function acceptRematch(accept) {
	if (accept) {
		$("#time-elapsed").html("setting up match room...");

		// Regenerate new maze
		maze = new Maze(maze.numRows, maze.numColumns, maze.cellSize);
		maze.createMaze();
		maze.generateMaze();

		path = ["0-0"];
		solved = false;
		playerPosition = maze.cellGraph[0][0];

		socket.emit("acceptRematch", maze, roomID);
	}
	if (!accept) {
		redirectUser();
	}
}

socket.on("rematchrequest", rematchRequest);

function rematchRequest() {
	alert("Your opponent has requested a rematch");
	$("#time-elapsed").html("<button onclick=\"acceptRematch(true)\">Accept</button>&nbsp;<button onclick=\"acceptRematch(false)\">Decline</button>")
}