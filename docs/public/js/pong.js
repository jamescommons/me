/* Pong game written by me. Should only be playable 
 * when not on mobile. Pong window size is fixed 800/500.
 * Game loop starts when play is clicked. There is a pause
 * with resume and end game. Game does not end, but score 
 * is recorded on the top. */

// Variables to keep track of score, default to zero
var playerScore = 0;
var aiScore = 0;

// Game constants
const FPS = 60;
const PLAYER_V = 400 / FPS;
const AI_V = 340 / FPS;
const BALL_V = 450 / FPS;


// Game variables
var ballX = 400;
var ballY = 250;
var ballSlope = 0;
var ballDirection = -1; // -1: left, 1: right
var playerY = 225;
var aiY = 225;
var running = false;
var paused = false;
var movingUp = false;
var movingDown = false;
var timer = null;

// Used to set a min number of frames before ball changes
// direction again
var frameCountdown = 0;

// Get window and graphics pen
var canvas = document.getElementById("pong-canvas");
var pen = canvas.getContext("2d");

// Get audio files
var hitSound = new Audio("../audio/hit.wav");
var missSound = new Audio("../audio/miss.wav");

var mute = false;

// Draws the start screen and stops game play
function startScreen() {
    running = false;

    // Add event listener to determine if start is clicked
    function getStartClicked(e) {
        if (e.offsetX >= 325 && e.offsetX <= 477
                && e.offsetY >= 220 && e.offsetY <= 265) {
            console.log("start");
            canvas.removeEventListener("click", getStartClicked);
            startGame();
        }
    }

    canvas.addEventListener("click", getStartClicked);

    // Clear screen
    pen.clearRect(0, 0, 800, 500);

    // Draw dotted median line
    pen.fillStyle = "#FFFFFF";
    for (let i = 2; i <= 500; i += 21) {
        pen.fillRect(395, i, 10, 10);
    }

    // Draw paddels
    pen.fillRect(20, 225, 10, 50);
    pen.fillRect(770, 225, 10, 50);

    // Draw score
    pen.font = "30px Roboto Mono";
    pen.fillText(playerScore, 185, 50, 100);
    pen.fillText(aiScore, 575, 50, 100);

    // Draw Start button
    pen.font = "50px Roboto Mono";
    pen.fillStyle = "#000000";
    pen.fillRect(340, 217, 200, 50);
    pen.strokeStyle = "#FFFFFF";
    pen.strokeRect(325, 220, 152, 45);
    pen.fillStyle = "#FFFFFF";
    pen.fillText("START", 325, 260, 200);
}

function redrawGame() {
    
    // Clear screen
    pen.clearRect(0, 0, 800, 500);

    // Draw dotted median line
    pen.fillStyle = "#FFFFFF";
    for (let i = 2; i <= 500; i += 21) {
        pen.fillRect(395, i, 10, 10);
    }

    // Draw paddels
    pen.fillRect(20, playerY, 10, 50);
    pen.fillRect(770, aiY, 10, 50);

    // Draw score
    pen.font = "30px Roboto Mono";
    pen.fillText(playerScore, 185, 50, 100);
    pen.fillText(aiScore, 575, 50, 100);

    // Draw ball
    pen.beginPath();
    pen.arc(ballX, ballY, 10, 0, 2 * Math.PI, false);
    pen.fill();
}

// Displayed when the player escapes
function pauseScreen() {
    
    // Clear screen
    pen.clearRect(0, 0, 800, 500);

    // Draw dotted median line
    pen.fillStyle = "#FFFFFF";
    for (let i = 2; i <= 500; i += 21) {
        pen.fillRect(395, i, 10, 10);
    }

    // Draw paddels
    pen.fillRect(20, playerY, 10, 50);
    pen.fillRect(770, aiY, 10, 50);

    // Draw score
    pen.font = "30px Roboto Mono";
    pen.fillText(playerScore, 185, 50, 100);
    pen.fillText(aiScore, 575, 50, 100);

    // Draw ball
    pen.beginPath();
    pen.arc(ballX, ballY, 10, 0, 2 * Math.PI, false);
    pen.fill();

    // Draw "resume"
    pen.font = "50px Roboto Mono";
    pen.fillStyle = "#000000";
    pen.fillRect(100, 217, 200, 50);
    pen.strokeStyle = "#FFFFFF";
    pen.strokeRect(100, 220, 182, 45);
    pen.fillStyle = "#FFFFFF";
    pen.fillText("RESUME", 100, 260, 200);

    // Draw "end game"
    pen.font = "50px Roboto Mono";
    pen.fillStyle = "#000000";
    pen.fillRect(500, 217, 200, 50);
    pen.strokeStyle = "#FFFFFF";
    pen.strokeRect(500, 220, 202, 45);
    pen.fillStyle = "#FFFFFF";
    pen.fillText("END GAME", 500, 260, 200);

    // Add event listener to determine if a button is clicked
    function buttonClicked(e) {
        if (e.offsetX >= 100 && e.offsetX <= 282
                && e.offsetY >= 220 && e.offsetY <= 265) {
            console.log("resume");
            canvas.removeEventListener("click", buttonClicked);
            paused = false;
            timer = setInterval(tick, 1000 / FPS);
        }
        if (e.offsetX >= 500 && e.offsetX <= 702
                && e.offsetY >= 220 && e.offsetY <= 265) {
            console.log("end");
            canvas.removeEventListener("click", buttonClicked);
            paused = false;
            document.removeEventListener("keydown", handleKeydown);
            document.removeEventListener("keyup", handleKeyup);
            startScreen();
        }
    }

    canvas.addEventListener("click", buttonClicked);
}

// Game clock
function tick() {
    
    // Stop game if not running
    if (!running) {
        clearInterval(timer);
        startScreen();
    }

    // Game logic in here
    if (!paused) {

        // If player is moving up or down
        if (movingUp) {
            if (playerY > 0) {
                playerY -= PLAYER_V;
            }
        }

        if (movingDown) {
            if (playerY < 450) {
                playerY += PLAYER_V;
            }
        }

        moveBall();
        moveAI();
        getCollisions();

        // If AI scored
        if (ballX < -10) {
            aiScore++;
            clearInterval(timer);
            initBall();
            setTimeout(function() {
                timer = setInterval(tick, 1000 / FPS);
            }, 3000);

            if (missSound.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA && !mute) {
                missSound.play();
            }
        }

        // If player scored
        if (ballX > 810) {
            playerScore++;
            clearInterval(timer);
            initBall();
            setTimeout(function() {
                timer = setInterval(tick, 1000 / FPS);
            }, 3000);

            if (missSound.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA && !mute) {
                missSound.play();
            }
        }

        if (frameCountdown > 0) {
            frameCountdown--;
        } else {
            missSound.currentTime = 0;
            hitSound.currentTime = 0;
        }

        redrawGame();
    } else {
        clearInterval(timer);
        pauseScreen();
    }
}

// Initializes the slope the ball follows and resets position
function initBall() {
    playerY = 225;
    aiY = 225;
    ballX = 400;
    ballY = 250;

    ballSlope = Math.random() * 0.5;
    if (ballSlope < 0.1) {
        ballSlope = 0.25;
    }
    
    // Make negative sometimes
    if (Math.random() > 0.5) {
        ballSlope *= -1;
    }
}

// Moves the ball
function moveBall() {
    let dx = Math.sqrt((BALL_V * BALL_V) / ((ballSlope * ballSlope) + 1));
    let dy = ballSlope * BALL_V;

    // If moving left
    if (ballDirection == -1) {
        ballX -= dx;
        ballY -= dy;
    } 

    // If moving right
    if (ballDirection == 1) {
        ballX += dx;
        ballY -= dy;
    }
}

// Moves AI
function moveAI() {

    // If ball is moving towards me
    if (ballDirection == 1) {

        // If ballY is above me
        if (ballY < aiY - 10) {
            if (aiY > 0) {
                aiY -= AI_V;
            }
        }

        // If ballY is below me
        if (ballY > aiY + 10) {
            if (aiY < 450) {
                aiY += AI_V;
            }
        }
    } else {

        // If above middle
        if (aiY < 200) {
            aiY += AI_V;
        } 

        // If below middle
        if (aiY > 300) {
            aiY -= AI_V;
        }
    }
}

// Get collision
function getCollisions() {
      
    // If ball hits top or bottom
    if (ballY < 10 || ballY > 490) {
        ballSlope *= -1;
    }

    if (frameCountdown <= 0) {

        // If ball is on player in the X
        if (ballX > 20 && ballX < 35) {

            // If ball hits in middle
            if (ballY > playerY + 15 && ballY < playerY + 35) {
                ballDirection *= -1;
                frameCountdown = 10;
                
                if (hitSound.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA && !mute) {
                    hitSound.play();
                }

                // If ball hits on edge
            } else if (ballY > playerY - 10 && ballY < playerY + 60) {
                ballDirection *= -1;
                ballSlope *= 1.2;
                frameCountdown = 10;

                if (hitSound.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA && !mute) {
                    hitSound.play();
                }
            } 
            
            frameCountdown = 10;
        }

        // If ball is on ai in the X
        if (ballX > 765 && ballX < 780) {

            // If ball hits in middle
            if (ballY > aiY + 15 && ballY < aiY + 35) {
                ballDirection *= -1;
                frameCountdown = 10;

                if (hitSound.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA && !mute) {
                    hitSound.play();
                }

                // If ball hits on edge
            } else if (ballY > aiY - 10 && ballY < aiY + 60) {
                ballDirection *= -1;
                ballSlope *= 1.2;
                frameCountdown = 10;

                if (hitSound.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA && !mute) {
                    hitSound.play();
                }
            } 

            frameCountdown = 10;
        }
    }

    // Catch extreme slopes
    if (ballSlope > 1.2 || ballSlope < -1.2) {
        ballSlope /= 2;
    }  
}

// KeyEvent handlers
function handleKeydown(e) {
    if (e.key == "w") {
        movingUp = true;
        movingDown = false;
    } 
    if (e.key == "s") {
        movingDown = true;
        movingUp = false;
    }
    if (e.key == "Escape") {
        paused = true;
    }
}

function handleKeyup(e) {
    if (e.key == "w") {
        movingUp = false;
    }
    if (e.key == "s") {
        movingDown = false;
    }
}

// Called when game is to be started
function startGame() {
    
    // Add event listeners
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyup);
    
    playerScore = 0;
    aiScore = 0;
    ballDirection = -1;
    initBall();

    running = true;
    redrawGame();
    setTimeout(function() {
        timer = setInterval(tick, 1000 / FPS);
    }, 3000);
}

// Run at loadtime
if (window.screen.availWidth / window.screen.availHeight < 1) {
    pen.font = "50px Roboto Mono";
    pen.fillStyle = "#FFFFFF";
    pen.fillText("Sorry. Mobile not supported :(", 50, 260, 400);
} else {
    if(document.readyState == "ready" || document.readyState == "complete") {
        startScreen();
    } else {
        document.addEventListener("readystatechange", function() {
            if(document.readyState == "ready" || document.readyState == "complete") {
                startScreen();
            }
        });
    }
}
