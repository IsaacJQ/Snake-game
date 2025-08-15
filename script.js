document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playBoard = document.querySelector(".play-board");
    const scoreElement = document.querySelector(".score");
    const highScoreElement = document.querySelector(".high-score");
    const controls = document.querySelectorAll(".controls i");
    const gameMessage = document.getElementById("gameMessage");
    const startBtn = document.querySelector(".start-btn");
    const pauseBtn = document.getElementById("pauseBtn");
    const restartBtn = document.getElementById("restartBtn");
    const countdownEl = document.getElementById("countdown");
    const pauseOverlay = document.getElementById("pauseOverlay");
    const resumeBtn = document.getElementById("resumeBtn");
    const difficultyButtons = document.querySelectorAll(".difficulty-btn");
    const powerUpStatusEl = document.getElementById("powerUpStatus");

    // Game state variables
    let gameOver = false;
    let gameStarted = false;
    let gamePaused = false;
    let foodX, foodY;
    let snakeX = 12, snakeY = 12;
    let velocityX = 0, velocityY = 0;
    let snakeBody = [];
    let setIntervalId;
    let score = 0;
    let highScore = localStorage.getItem("snake-pro-high-score") || 0;
    let currentDifficulty = 'easy';
    let mines = [];
    let powerUp = null;
    let currentMap = 'classic';
    let currentFood = { type: 'apple', points: 1, color: 'red', effect: null };
    const foodTypes = [
        { type: 'apple',  points: 1, color: 'red',    effect: null },
        { type: 'banana', points: 2, color: 'yellow', effect: null },
        { type: 'chili',  points: 3, color: 'orange', effect: 'speedBoost' },
        { type: 'star',   points: 5, color: 'gold',   effect: 'temporary', duration: 3000 }
    ];
    const maps = {
        classic: { name: "Clássico", obstacles: [], bgColor: "var(--board-bg)" },
        forest:  { name: "Floresta", obstacles: [ {x:5,y:5},{x:5,y:6},{x:5,y:7},{x:20,y:20},{x:20,y:19},{x:20,y:18},{x:12,y:12}], bgColor: "linear-gradient(135deg,#1a2e1a,#0f4d0f)" },
        desert:  { name: "Deserto",  obstacles: [ {x:10,y:3},{x:10,y:4},{x:10,y:5},{x:15,y:20},{x:16,y:20},{x:17,y:20},{x:3,y:15},{x:4,y:15}], bgColor: "linear-gradient(135deg,#d2b48c,#f5deb3)" },
        space:   { name: "Espaço",   obstacles: [ {x:1,y:1},{x:25,y:1},{x:1,y:25},{x:25,y:25},{x:13,y:1},{x:13,y:25}], bgColor: "linear-gradient(135deg,#0f0c29,#302b63)" }
    };
    
    let activePowerUp = { type: null, timer: 0, intervalId: null };

    // Audio context for sound effects
    let audioContext;
    const sounds = {};

    // Translation Dictionary
    const translations = {
        en: {
            score: "Score: {score}", 
            highScore: "High Score: {highScore}",
            instructions: "Use arrow keys or swipe to move. Avoid walls and mines!",
            difficulty: "Select Difficulty:", 
            easy: "Easy", 
            medium: "Medium", 
            hard: "Hard",
            startGame: "Start Game", 
            paused: "GAME PAUSED",
            resumeInstructions: "Press SPACE or click to resume", 
            resume: "Resume",
            gameOver: "GAME OVER", 
            yourScore: "Your score: {score}", 
            playAgain: "Play Again",
            shieldActive: "Shield Active!", 
            scissorsActive: "Snake Shortened!"
        },
        pt: {
            score: "Pontos: {score}", 
            highScore: "Recorde: {highScore}",
            instructions: "Use as setas ou deslize para mover. Evite as paredes e as minas!",
            difficulty: "Escolha a Dificuldade:", 
            easy: "Fácil", 
            medium: "Médio", 
            hard: "Difícil",
            startGame: "Iniciar Jogo", 
            paused: "JOGO PAUSADO",
            resumeInstructions: "Pressione ESPAÇO ou clique para continuar", 
            resume: "Continuar",
            gameOver: "FIM DE JOGO", 
            yourScore: "Sua pontuação: {score}", 
            playAgain: "Jogar Novamente",
            shieldActive: "Escudo Ativo!", 
            scissorsActive: "Cauda Cortada!"
        }
    };
    let currentLang = (navigator.language.startsWith('pt')) ? 'pt' : 'en';

    // Difficulty settings
    const difficultySettings = {
        easy: { speed: 150, mineCount: 3 },
        medium: { speed: 100, mineCount: 5 },
        hard: { speed: 75, mineCount: 8 }
    };

    // --- TRANSLATION FUNCTIONS ---
    const translate = (key, params = {}) => {
        let text = translations[currentLang][key] || key;
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        return text;
    };

    const updateTranslations = () => {
        document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : 'en';
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (key === 'score') {
                element.textContent = translate(key, { score });
            } else if (key === 'highScore') {
                element.textContent = translate(key, { highScore });
            } else {
                element.textContent = translate(key);
            }
        });
    };

    // --- AUDIO FUNCTIONS ---
    const initAudio = () => {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create sound effects
            sounds.eat = createBeep(800, 0.1);
            sounds.gameOver = createBeep(200, 0.5);
            sounds.powerUp = createBeep(1000, 0.2);
            sounds.mine = createBeep(150, 0.3);
            sounds.start = createBeep(600, 0.15);
        } catch (e) {
            console.log('Audio not supported');
        }
    };

    const createBeep = (frequency, duration) => {
        return () => {
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    };

    const playSound = (soundName) => {
        if (sounds[soundName]) {
            sounds[soundName]();
        }
    };

    // --- CORE FUNCTIONS ---
    const initGame = () => {
        if (gameOver) return handleGameOver();
        if (gamePaused) return;

        // Só atualiza posição se a cobra estiver se movendo
        if (velocityX !== 0 || velocityY !== 0) {
            updateSnakePosition();
            handleCollisions();
        }
        renderBoard();
    };

    const startGame = async () => {
        if (!audioContext) initAudio();
        
        resetGameState();
        gameMessage.style.display = "none";
        
        await showCountdown();
        
        if (gameStarted && !gameOver) {
            playSound('start');
            updateFoodPosition();
            generateMines();
            setIntervalId = setInterval(initGame, difficultySettings[currentDifficulty].speed);
        }
    };

    const resetGameState = () => {
        gameStarted = true;
        gameOver = false;
        gamePaused = false;
        score = 0;
        snakeX = 12; snakeY = 12;
        snakeBody = [[snakeX, snakeY]];
        velocityX = 0; velocityY = 0;
        mines = [];
        powerUp = null;
        clearActivePowerUp();
        
        updateScoreDisplay();
        if (playBoard) playBoard.style.background = maps[currentMap].bgColor;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (setIntervalId) clearInterval(setIntervalId);
    };

    const showCountdown = () => {
        return new Promise((resolve) => {
            let count = 3;
            countdownEl.style.display = "flex";
            
            const countdownInterval = setInterval(() => {
                countdownEl.querySelector('.countdown-number').textContent = count;
                count--;
                
                if (count < 0) {
                    clearInterval(countdownInterval);
                    countdownEl.style.display = "none";
                    resolve();
                }
            }, 1000);
        });
    };

    // --- RENDERING ---
    const renderBoard = () => {
        let html = `<div class="food ${currentFood.type} item-spawn" style="grid-area: ${foodY} / ${foodX}"></div>`;
        (maps[currentMap].obstacles||[]).forEach(obs => {
            html += `<div class="obstacle" style="grid-area: ${obs.y} / ${obs.x}"></div>`;
        });
        mines.forEach(mine => {
            html += `<div class="mine item-spawn" style="grid-area: ${mine.y} / ${mine.x}"></div>`;
        });
        if (powerUp) {
            html += `<div class="power-up ${powerUp.type} item-spawn" style="grid-area: ${powerUp.y} / ${powerUp.x};"><i class="fas fa-${powerUp.icon}"></i></div>`;
        }
        const snakeClass = activePowerUp.type === 'shield' ? 'snake shielded' : 'snake';
        snakeBody.forEach((segment, i) => {
            const partClass = i === 0 ? "head" : "body";
            html += `<div class="${partClass} ${snakeClass}" style="grid-area: ${segment[1]} / ${segment[0]}"></div>`;
        });
        playBoard.innerHTML = html;
    };

    // --- SNAKE LOGIC ---
    const updateSnakePosition = () => {
        snakeX += velocityX;
        snakeY += velocityY;

        snakeBody.unshift([snakeX, snakeY]);
        
        // Remove o último segmento se não comeu comida
        if (snakeX !== foodX || snakeY !== foodY) {
            snakeBody.pop();
        }
    };

    const handleCollisions = () => {
        // Food collision
        if (snakeX === foodX && snakeY === foodY) {
            playSound('eat');
            // Não remove o último segmento quando come comida
            score += (currentFood?.points || 1);
            // Apply food effects
            if (currentFood?.effect === 'speedBoost') {
                // Temporarily increase speed
                const currentSpeed = difficultySettings[currentDifficulty].speed;
                if (setIntervalId) clearInterval(setIntervalId);
                setIntervalId = setInterval(initGame, Math.max(40, currentSpeed * 0.6));
                setTimeout(() => {
                    if (!gameOver) { if (setIntervalId) clearInterval(setIntervalId); setIntervalId = setInterval(initGame, difficultySettings[currentDifficulty].speed); }
                }, 3000);
            }
            updateScoreDisplay();
        if (playBoard) playBoard.style.background = maps[currentMap].bgColor;
            updateFoodPosition();
            if (score % 5 === 0 && !powerUp) generatePowerUp();
        }
        // Obstacle collision
        if ((maps[currentMap].obstacles||[]).some(o => o.x === snakeX && o.y === snakeY)) {
            if (activePowerUp.type !== 'shield') { 
                gameOver = true;
                return;
            }
        }

        // Wall collision
        if (snakeX <= 0 || snakeX > 25 || snakeY <= 0 || snakeY > 25) {
            if (activePowerUp.type === 'shield') {
                // Wall-through logic
                if (snakeX <= 0) snakeX = 25; 
                else if (snakeX > 25) snakeX = 1;
                if (snakeY <= 0) snakeY = 25; 
                else if (snakeY > 25) snakeY = 1;
                snakeBody[0] = [snakeX, snakeY];
            } else {
                gameOver = true;
                return;
            }
        }

        // Self collision
        for (let i = 1; i < snakeBody.length; i++) {
            if (snakeX === snakeBody[i][0] && snakeY === snakeBody[i][1]) {
                gameOver = true;
                return;
            }
        }

        // Mine collision
        if (mines.some(mine => mine.x === snakeX && mine.y === snakeY)) {
            if (activePowerUp.type !== 'shield') {
                playSound('mine');
                gameOver = true;
                return;
            }
        }

        // Power-up collision
        if (powerUp && snakeX === powerUp.x && snakeY === powerUp.y) {
            activatePowerUp(powerUp.type);
            powerUp = null;
        }
    };

    // --- GAME ELEMENTS ---
    const isPositionOccupied = (x, y) => {
        if (foodX === x && foodY === y) return true;
        if (snakeBody.some(seg => seg[0] === x && seg[1] === y)) return true;
        if (mines.some(mine => mine.x === x && mine.y === y)) return true;
        if ((maps[currentMap]?.obstacles||[]).some(o=>o.x===x && o.y===y)) return true;
        if (powerUp && powerUp.x === x && powerUp.y === y) return true;
        return false;
    };

    const getRandomPosition = () => {
        let x, y;
        do {
            x = Math.floor(Math.random() * 25) + 1;
            y = Math.floor(Math.random() * 25) + 1;
        } while (isPositionOccupied(x, y));
        return { x, y };
    };

    const updateFoodPosition = () => {
        let safePos = null;
        while (!safePos) {
            const pos = getRandomPosition();
            if (!snakeBody.some(seg => seg[0] === pos.x && seg[1] === pos.y) &&
                !mines.some(m => m.x === pos.x && m.y === pos.y) &&
                !(maps[currentMap].obstacles||[]).some(o => o.x === pos.x && o.y === pos.y)) {
                safePos = pos;
            }
        }
        foodX = safePos.x; foodY = safePos.y;
        currentFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        if (currentFood.effect === 'temporary') {
            const thisFoodX = foodX, thisFoodY = foodY;
            setTimeout(() => {
                if (foodX === thisFoodX && foodY === thisFoodY && currentFood.type === 'star') {
                    updateFoodPosition();
                }
            }, currentFood.duration || 3000);
        }
    };

    const generateMines = () => {
        mines = [];
        const mineCount = difficultySettings[currentDifficulty].mineCount;
        
        for (let i = 0; i < mineCount; i++) {
            const pos = getRandomPosition();
            mines.push(pos);
        }
    };

    const generatePowerUp = () => {
        if (powerUp) return;
        
        const types = [
            { type: 'shield', icon: 'shield-alt' },
            { type: 'scissors', icon: 'cut' }
        ];
        
        const selectedType = types[Math.floor(Math.random() * types.length)];
        const pos = getRandomPosition();
        
        powerUp = {
            ...selectedType,
            x: pos.x,
            y: pos.y
        };
        
        // Remove power-up after 10 seconds if not collected
        setTimeout(() => {
            if (powerUp && powerUp.x === pos.x && powerUp.y === pos.y) {
                powerUp = null;
            }
        }, 10000);
    };

    // --- POWER-UP SYSTEM ---
    const activatePowerUp = (type) => {
        playSound('powerUp');
        clearActivePowerUp();
        
        activePowerUp.type = type;
        activePowerUp.timer = 100; // 10 seconds at 100ms intervals
        
        if (type === 'shield') {
            showPowerUpStatus(translate('shieldActive'));
        } else if (type === 'scissors') {
            // Cut snake in half
            const halfLength = Math.ceil(snakeBody.length / 2);
            snakeBody = snakeBody.slice(0, halfLength);
            showPowerUpStatus(translate('scissorsActive'));
        }
        
        if (type === 'shield') {
            activePowerUp.intervalId = setInterval(() => {
                activePowerUp.timer--;
                updatePowerUpTimer();
                
                if (activePowerUp.timer <= 0) {
                    clearActivePowerUp();
                }
            }, 100);
        } else {
            // Scissors is instant effect
            setTimeout(() => clearActivePowerUp(), 2000);
        }
    };

    const clearActivePowerUp = () => {
        if (activePowerUp.intervalId) {
            clearInterval(activePowerUp.intervalId);
        }
        activePowerUp = { type: null, timer: 0, intervalId: null };
        powerUpStatusEl.innerHTML = '';
    };

    const showPowerUpStatus = (message) => {
        powerUpStatusEl.innerHTML = `
            <span>${message}</span>
            ${activePowerUp.type === 'shield' ? '<div class="power-up-timer"><div class="timer-bar" style="width: 100%"></div></div>' : ''}
        `;
    };

    const updatePowerUpTimer = () => {
        const timerBar = powerUpStatusEl.querySelector('.timer-bar');
        if (timerBar) {
            const percentage = (activePowerUp.timer / 100) * 100;
            timerBar.style.width = `${percentage}%`;
        }
    };

    // --- GAME OVER ---
    const handleGameOver = () => {
        playSound('gameOver');
        clearInterval(setIntervalId);
        clearActivePowerUp();
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snake-pro-high-score", highScore);
            updateScoreDisplay();
        if (playBoard) playBoard.style.background = maps[currentMap].bgColor;
        }
        
        gameMessage.querySelector('.message-title').textContent = translate('gameOver');
        gameMessage.querySelector('.message-text').textContent = translate('yourScore', { score });
        gameMessage.querySelector('.start-btn span').textContent = translate('playAgain');
        gameMessage.style.display = "flex";
        
        gameStarted = false;
        gameOver = false;
    };

    // --- UI UPDATES ---
    const updateScoreDisplay = () => {
        scoreElement.textContent = translate('score', { score });
        highScoreElement.textContent = translate('highScore', { highScore });
    };

    // --- CONTROLS ---
    const changeDirection = (e) => {
        if (!gameStarted || gamePaused) return;

        const key = e.key || e.target.dataset.key;

        // If snake hasn't started moving, allow any initial direction
        if (velocityX === 0 && velocityY === 0) {
            if (key === "ArrowUp" || key === "w" || key === "W") {
                velocityX = 0; velocityY = -1;
                return;
            } else if (key === "ArrowDown" || key === "s" || key === "S") {
                velocityX = 0; velocityY = 1;
                return;
            } else if (key === "ArrowLeft" || key === "a" || key === "A") {
                velocityX = -1; velocityY = 0;
                return;
            } else if (key === "ArrowRight" || key === "d" || key === "D") {
                velocityX = 1; velocityY = 0;
                return;
            }
        }

        // Prevent moving in opposite direction
        if ((key === "ArrowUp" || key === "w" || key === "W") && velocityY !== 1) {
            velocityX = 0; velocityY = -1;
        } else if ((key === "ArrowDown" || key === "s" || key === "S") && velocityY !== -1) {
            velocityX = 0; velocityY = 1;
        } else if ((key === "ArrowLeft" || key === "a" || key === "A") && velocityX !== 1) {
            velocityX = -1; velocityY = 0;
        } else if ((key === "ArrowRight" || key === "d" || key === "D") && velocityX !== -1) {
            velocityX = 1; velocityY = 0;
        }
    };

    const togglePause = () => {
        if (!gameStarted) return;
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            clearInterval(setIntervalId);
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            pauseOverlay.style.display = "flex";
        } else {
            setIntervalId = setInterval(initGame, difficultySettings[currentDifficulty].speed);
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            pauseOverlay.style.display = "none";
        }
    };

    // --- TOUCH CONTROLS ---
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (!gameStarted || gamePaused) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && velocityX !== -1) {
                    velocityX = 1; velocityY = 0;
                } else if (deltaX < 0 && velocityX !== 1) {
                    velocityX = -1; velocityY = 0;
                }
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && velocityY !== -1) {
                    velocityX = 0; velocityY = 1;
                } else if (deltaY < 0 && velocityY !== 1) {
                    velocityX = 0; velocityY = -1;
                }
            }
        }
    };

    // --- EVENT LISTENERS ---
  const mapButtons = document.querySelectorAll('.map-btn');
  if (mapButtons && mapButtons.length) {
    mapButtons.forEach(btn => btn.addEventListener('click', () => {
      mapButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentMap = btn.dataset.map;
      if (playBoard) playBoard.style.background = maps[currentMap].bgColor;
    }));
  }
    document.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Escape") {
            e.preventDefault();
            if (gameStarted) togglePause();
        } else {
            changeDirection(e);
        }
    });

    controls.forEach(control => {
        control.addEventListener("click", () => changeDirection({ target: control }));
    });

    startBtn.addEventListener("click", startGame);
    pauseBtn.addEventListener("click", togglePause);
    resumeBtn.addEventListener("click", togglePause);
    restartBtn.addEventListener("click", () => {
        clearInterval(setIntervalId);
        clearActivePowerUp();
        gameStarted = false;
        gameMessage.style.display = "flex";
        pauseOverlay.style.display = "none";
    });

    difficultyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            difficultyButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentDifficulty = btn.dataset.difficulty;
        });
    });

    // Touch events
    playBoard.addEventListener("touchstart", handleTouchStart, { passive: true });
    playBoard.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Prevent context menu on long press
    playBoard.addEventListener("contextmenu", (e) => e.preventDefault());

    // --- INITIALIZATION ---
    updateScoreDisplay();
        if (playBoard) playBoard.style.background = maps[currentMap].bgColor;
    updateTranslations();
    
    // Show initial game message
    gameMessage.style.display = "flex";
    pauseOverlay.style.display = "none";
    countdownEl.style.display = "none";
});

