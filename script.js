const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls i");
const gameMessage = document.querySelector(".game-message");
const startBtn = document.querySelector(".start-btn");

let gameOver = false;
let gameStarted = false;
let foodX, foodY;
let snakeX = 5, snakeY = 5;
let velocityX = 0, velocityY = 0;
let snakeBody = [];
let setIntervalId;
let score = 0;
let touchStartX = 0;
let touchStartY = 0;

// Getting high score from the local storage
let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `High Score: ${highScore}`;

const updateFoodPosition = () => {
    // Passing a random 1 - 30 value as food position
    foodX = Math.floor(Math.random() * 30) + 1;
    foodY = Math.floor(Math.random() * 30) + 1;
}

const handleGameOver = () => {
    // Clearing the timer and reloading the page on game over
    clearInterval(setIntervalId);
    gameMessage.style.display = "flex";
    gameMessage.innerHTML = `
        <p>Game Over! Your score: ${score}</p>
        <button class="start-btn">Play Again</button>
    `;
    document.querySelector(".start-btn").addEventListener("click", startGame);
    gameStarted = false;
}

const changeDirection = e => {
    // Changing velocity value based on key press
    if((e.key === "ArrowUp" || e.key === "w") && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
    } else if((e.key === "ArrowDown" || e.key === "s") && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
    } else if((e.key === "ArrowLeft" || e.key === "a") && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
    } else if((e.key === "ArrowRight" || e.key === "d") && velocityX != -1) {
        velocityX = 1;
        velocityY = 0;
    }
}

const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

const handleTouchEnd = (e) => {
    if (!touchStartX || !touchStartY || !gameStarted) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Determine swipe direction
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && velocityX != 1) {
            // Left swipe
            velocityX = -1;
            velocityY = 0;
        } else if (diffX < 0 && velocityX != -1) {
            // Right swipe
            velocityX = 1;
            velocityY = 0;
        }
    } else {
        // Vertical swipe
        if (diffY > 0 && velocityY != 1) {
            // Up swipe
            velocityX = 0;
            velocityY = -1;
        } else if (diffY < 0 && velocityY != -1) {
            // Down swipe
            velocityX = 0;
            velocityY = 1;
        }
    }
}

// Calling changeDirection on each key click and passing key dataset value as an object
controls.forEach(button => button.addEventListener("click", () => {
    if (gameStarted) {
        changeDirection({ key: button.dataset.key });
    }
}));

const initGame = () => {
    if(gameOver) return handleGameOver();
    let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

    // Checking if the snake hit the food
    if(snakeX === foodX && snakeY === foodY) {
        updateFoodPosition();
        snakeBody.push([foodY, foodX]); // Pushing food position to snake body array
        score++; // increment score by 1
        highScore = score >= highScore ? score : highScore;
        localStorage.setItem("high-score", highScore);
        scoreElement.innerText = `Score: ${score}`;
        highScoreElement.innerText = `High Score: ${highScore}`;
    }
    // Updating the snake's head position based on the current velocity
    snakeX += velocityX;
    snakeY += velocityY;
    
    // Shifting forward the values of the elements in the snake body by one
    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    snakeBody[0] = [snakeX, snakeY]; // Setting first element of snake body to current snake position

    // Checking if the snake's head is out of wall, if so setting gameOver to true
    if(snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
        return gameOver = true;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        // Adding a div for each part of the snake's body
        const partClass = i === 0 ? "head" : "body";
        html += `<div class="${partClass}" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        // Checking if the snake head hit the body, if so set gameOver to true
        if (i !== 0 && snakeBody[0][1] === snakeBody[i][1] && snakeBody[0][0] === snakeBody[i][0]) {
            gameOver = true;
        }
    }
    playBoard.innerHTML = html;
}

const startGame = () => {
    gameStarted = true;
    gameOver = false;
    gameMessage.style.display = "none";
    score = 0;
    scoreElement.innerText = `Score: ${score}`;
    snakeX = 5;
    snakeY = 5;
    snakeBody = [];
    velocityX = 0;
    velocityY = 0;
    updateFoodPosition();
    if (setIntervalId) clearInterval(setIntervalId);
    setIntervalId = setInterval(initGame, 100);
}

// Event listeners
startBtn.addEventListener("click", startGame);
document.addEventListener("keyup", changeDirection);
document.addEventListener("touchstart", handleTouchStart, { passive: true });
document.addEventListener("touchend", handleTouchEnd, { passive: true });

// Prevent scrolling on touch controls
document.addEventListener("touchmove", (e) => {
    if (gameStarted) e.preventDefault();
}, { passive: false });
