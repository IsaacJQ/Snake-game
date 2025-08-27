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
    const soundBtn = document.getElementById("soundBtn");
    const langPtBtn = document.getElementById("langPtBtn");
    const langEnBtn = document.getElementById("langEnBtn");
    const countdownEl = document.getElementById("countdown");
    const pauseOverlay = document.getElementById("pauseOverlay");
    const resumeBtn = document.getElementById("resumeBtn");
    const difficultyButtons = document.querySelectorAll(".difficulty-btn");
    const mapButtons = document.querySelectorAll(".map-btn");
    const colorButtons = document.querySelectorAll(".color-btn");
    const powerUpStatusEl = document.getElementById("powerUpStatus");

    // Game state variables
    let gameOver = false;
    let gameStarted = false;
    let gamePaused = false;
    let soundEnabled = true;
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
    let activePowerUp = { type: null, timer: 0, intervalId: null };
    let gameSpeed = 150;

    // Food types configuration
    const foodTypes = [
        { type: 'apple', points: 1, color: 'red', effect: null, weight: 50 },
        { type: 'banana', points: 2, color: 'yellow', effect: null, weight: 30 },
        { type: 'chili', points: 3, color: 'orange', effect: 'speedBoost', weight: 15 },
        { type: 'star', points: 5, color: 'gold', effect: 'temporary', duration: 5000, weight: 5 }
    ];

    // Maps configuration
    const maps = {
        classic: { 
            name: "Clássico", 
            obstacles: [], 
            bgColor: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)" 
        },
        forest: { 
            name: "Floresta", 
            obstacles: [
                {x:5,y:5},{x:5,y:6},{x:5,y:7},
                {x:20,y:20},{x:20,y:19},{x:20,y:18},
                {x:12,y:12},{x:13,y:12},{x:14,y:12}
            ], 
            bgColor: "linear-gradient(135deg, #1a2e1a 0%, #0f4d0f 100%)" 
        },
        desert: { 
            name: "Deserto", 
            obstacles: [
                {x:10,y:3},{x:10,y:4},{x:10,y:5},{x:10,y:6},
                {x:15,y:20},{x:16,y:20},{x:17,y:20},
                {x:3,y:15},{x:4,y:15},{x:5,y:15}
            ], 
            bgColor: "linear-gradient(135deg, #d2b48c 0%, #f5deb3 100%)" 
        },
        space: { 
            name: "Espaço", 
            obstacles: [
                {x:1,y:1},{x:25,y:1},{x:1,y:25},{x:25,y:25},
                {x:13,y:1},{x:13,y:25},{x:1,y:13},{x:25,y:13}
            ], 
            bgColor: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)" 
        }
    };

    // Snake colors configuration
    const snakeColors = {
        blue: {
            head: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
            body: "linear-gradient(135deg, #00b8e6 0%, #0088bb 100%)",
            glow: "rgba(0, 212, 255, 0.5)"
        },
        green: {
            head: "linear-gradient(135deg, #32ff7e 0%, #21a656 100%)",
            body: "linear-gradient(135deg, #2ed573 0%, #1e8449 100%)",
            glow: "rgba(50, 255, 126, 0.5)"
        },
        red: {
            head: "linear-gradient(135deg, #ff4757 0%, #ff3742 100%)",
            body: "linear-gradient(135deg, #ff3838 0%, #c44569 100%)",
            glow: "rgba(255, 71, 87, 0.5)"
        },
        purple: {
            head: "linear-gradient(135deg, #a55eea 0%, #8b46ff 100%)",
            body: "linear-gradient(135deg, #9c88ff 0%, #7158e2 100%)",
            glow: "rgba(165, 94, 234, 0.5)"
        },
        orange: {
            head: "linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)",
            body: "linear-gradient(135deg, #ff7675 0%, #e17055 100%)",
            glow: "rgba(255, 140, 0, 0.5)"
        },
        pink: {
            head: "linear-gradient(135deg, #ff6b9d 0%, #ff3867 100%)",
            body: "linear-gradient(135deg, #ff5e8a 0%, #fd79a8 100%)",
            glow: "rgba(255, 107, 157, 0.5)"
        },
        yellow: {
            head: "linear-gradient(135deg, #feca57 0%, #ff9f43 100%)",
            body: "linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)",
            glow: "rgba(254, 202, 87, 0.5)"
        },
        cyan: {
            head: "linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)",
            body: "linear-gradient(135deg, #00cec9 0%, #0984e3 100%)",
            glow: "rgba(0, 210, 211, 0.5)"
        }
    };

    let currentSnakeColor = 'blue';

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
            scissorsActive: "Snake Shortened!",
            chooseMap: "Choose Map:",
            chooseColor: "Choose Snake Color:"
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
            scissorsActive: "Cauda Cortada!",
            chooseMap: "Escolha o Mapa:",
            chooseColor: "Escolha a Cor da Cobra:"
        }
    };
    let currentLang = (navigator.language.startsWith('pt')) ? 'pt' : 'en';

    // Difficulty settings
    const difficultySettings = {
        easy: { speed: 150, mineCount: 3 },
        medium: { speed: 100, mineCount: 5 },
        hard: { speed: 75, mineCount: 8 }
    };

    // Audio context for sound effects
    let audioContext;
    const sounds = {};

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

    const setLanguage = (lang) => {
        currentLang = lang;
        localStorage.setItem('snake-pro-language', lang);
        updateTranslations();
    };

    // Event Listeners for language buttons
    langPtBtn.addEventListener('click', () => setLanguage('pt'));
    langEnBtn.addEventListener('click', () => setLanguage('en'));

    // Load saved language on startup
    const savedLang = localStorage.getItem('snake-pro-language');
    if (savedLang) {
        currentLang = savedLang;
    }
    updateTranslations();

    // --- AUDIO FUNCTIONS ---
    const initAudio = () => {
        if (!soundEnabled) return;
        
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create sound effects
            sounds.eat = createBeep(800, 0.1);
            sounds.gameOver = createBeep(200, 0.5);
            sounds.powerUp = createBeep(1000, 0.2);
            sounds.mine = createBeep(150, 0.3);
            sounds.start = createBeep(600, 0.15);
            sounds.turn = createBeep(500, 0.05);
        } catch (e) {
            console.log('Audio not supported');
        }
    };

    const createBeep = (frequency, duration) => {
        return () => {
            if (!audioContext || !soundEnabled) return;
            
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
        if (sounds[soundName] && soundEnabled) {
            sounds[soundName]();
        }
    };

    const toggleSound = () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            soundBtn.classList.remove('muted');
            if (!audioContext) initAudio();
        } else {
            soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            soundBtn.classList.add('muted');
        }
    };

    // --- SNAKE COLOR FUNCTIONS ---
    const updateSnakeColors = (colorName) => {
        const colors = snakeColors[colorName];
        if (!colors) return;
        
        const root = document.documentElement;
        root.style.setProperty('--snake-head', colors.head);
        root.style.setProperty('--snake-body', colors.body);
        root.style.setProperty('--snake-head-glow', colors.glow);
        
        currentSnakeColor = colorName;
        localStorage.setItem('snake-pro-color', colorName);
    };

    const loadSavedColor = () => {
        const savedColor = localStorage.getItem('snake-pro-color') || 'blue';
        updateSnakeColors(savedColor);
        return savedColor;
    };

    // --- CORE FUNCTIONS ---
    const initGame = () => {
        if (gameOver) return handleGameOver();
        if (gamePaused) return;

        // Update snake position
        updateSnakePosition();
        
        // Check collisions
        handleCollisions();
        
        // Render the board
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
            gameSpeed = difficultySettings[currentDifficulty].speed;
            setIntervalId = setInterval(initGame, gameSpeed);
        }
    };

    const resetGameState = () => {
        gameStarted = true;
        gameOver = false;
        gamePaused = false;
        score = 0;
        snakeX = 1; 
        snakeY = 1;
        snakeBody = [[snakeX, snakeY]];
        velocityX = 0; 
        velocityY = 0;
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
            countdownEl.querySelector('.countdown-number').textContent = count;
            
            const countdownInterval = setInterval(() => {
                count--;
                
                if (count > 0) {
                    countdownEl.querySelector('.countdown-number').textContent = count;
                    countdownEl.querySelector('.countdown-number').style.animation = 'none';
                    setTimeout(() => {
                        countdownEl.querySelector('.countdown-number').style.animation = 'countdownPulse 1s ease-in-out';
                    }, 10);
                } else {
                    clearInterval(countdownInterval);
                    countdownEl.style.display = "none";
                    resolve();
                }
            }, 1000);
        });
    };

    // --- RENDERING ---
    const renderBoard = () => {
        let html = '';
        
        // Render food
        html += `<div class="food ${currentFood.type} item-spawn" style="grid-area: ${foodY} / ${foodX}"></div>`;
        
        // Render obstacles
        if (maps[currentMap].obstacles) {
            maps[currentMap].obstacles.forEach(obs => {
                html += `<div class="obstacle" style="grid-area: ${obs.y} / ${obs.x}"></div>`;
            });
        }
        
        // Render mines
        mines.forEach(mine => {
            html += `<div class="mine item-spawn" style="grid-area: ${mine.y} / ${mine.x}"></div>`;
        });
        
        // Render power-up
        if (powerUp) {
            html += `<div class="power-up ${powerUp.type} item-spawn" style="grid-area: ${powerUp.y} / ${powerUp.x}">
                        <i class="fas fa-${powerUp.icon}"></i>
                     </div>`;
        }
        
        // Render snake
        const snakeClass = activePowerUp.type === 'shield' ? 'snake shielded' : 'snake';
        snakeBody.forEach((segment, i) => {
            const partClass = i === 0 ? "head" : "body";
            html += `<div class="${partClass} ${snakeClass}" style="grid-area: ${segment[1]} / ${segment[0]}"></div>`;
        });
        
        playBoard.innerHTML = html;
    };

    // --- SNAKE LOGIC ---
    const updateSnakePosition = () => {
        // Only update if snake is moving
        if (velocityX === 0 && velocityY === 0) return;
        
        // Calculate new head position
        snakeX += velocityX;
        snakeY += velocityY;
        
        // Add new head to beginning of snake
        snakeBody.unshift([snakeX, snakeY]);
        
        // Check if food was eaten
        if (snakeX === foodX && snakeY === foodY) {
            // Food eaten - don't remove tail
            handleFoodEaten();
        } else {
            // No food eaten - remove tail
            snakeBody.pop();
        }
    };

    const handleFoodEaten = () => {
        playSound('eat');
        score += currentFood.points;
        updateScoreDisplay();
        
        // Apply food effects
        if (currentFood.effect === 'speedBoost') {
            // Temporarily increase speed
            if (setIntervalId) clearInterval(setIntervalId);
            const boostSpeed = Math.max(40, gameSpeed * 0.7);
            setIntervalId = setInterval(initGame, boostSpeed);
            
            setTimeout(() => {
                if (!gameOver && gameStarted && !gamePaused) {
                    if (setIntervalId) clearInterval(setIntervalId);
                    setIntervalId = setInterval(initGame, gameSpeed);
                }
            }, 3000);
        }
        
        updateFoodPosition();
        
        // Generate power-up every 5 points
        if (score % 5 === 0 && !powerUp) {
            generatePowerUp();
        }
    };

    const handleCollisions = () => {
        // Wall collision
        if (snakeX <= 0 || snakeX > 25 || snakeY <= 0 || snakeY > 25) {
            if (activePowerUp.type === 'shield') {
                // Wrap around walls with shield
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
        
        // Self collision (skip head)
        for (let i = 1; i < snakeBody.length; i++) {
            if (snakeX === snakeBody[i][0] && snakeY === snakeBody[i][1]) {
                gameOver = true;
                return;
            }
        }
        
        // Obstacle collision
        if (maps[currentMap].obstacles) {
            for (let obs of maps[currentMap].obstacles) {
                if (obs.x === snakeX && obs.y === snakeY) {
                    if (activePowerUp.type !== 'shield') {
                        gameOver = true;
                        return;
                    }
                }
            }
        }
        
        // Mine collision
        for (let mine of mines) {
            if (mine.x === snakeX && mine.y === snakeY) {
                if (activePowerUp.type !== 'shield') {
                    playSound('mine');
                    gameOver = true;
                    return;
                }
                // Remove mine if shielded
                mines = mines.filter(m => m.x !== mine.x || m.y !== mine.y);
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
        // Check food
        if (foodX === x && foodY === y) return true;
        
        // Check snake body
        if (snakeBody.some(seg => seg[0] === x && seg[1] === y)) return true;
        
        // Check mines
        if (mines.some(mine => mine.x === x && mine.y === y)) return true;
        
        // Check obstacles
        if (maps[currentMap].obstacles) {
            if (maps[currentMap].obstacles.some(obs => obs.x === x && obs.y === y)) return true;
        }
        
        // Check power-up
        if (powerUp && powerUp.x === x && powerUp.y === y) return true;
        
        return false;
    };

    const getRandomPosition = () => {
        let x, y;
        let attempts = 0;
        const maxAttempts = 625; // 25x25 grid
        
        do {
            x = Math.floor(Math.random() * 25) + 1;
            y = Math.floor(Math.random() * 25) + 1;
            attempts++;
            
            if (attempts >= maxAttempts) {
                console.warn('Could not find free position');
                break;
            }
        } while (isPositionOccupied(x, y));
        
        return { x, y };
    };

    const getWeightedRandomFood = () => {
        const totalWeight = foodTypes.reduce((sum, food) => sum + food.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let food of foodTypes) {
            random -= food.weight;
            if (random <= 0) {
                return food;
            }
        }
        
        return foodTypes[0]; // Default to apple
    };

    const updateFoodPosition = () => {
        const pos = getRandomPosition();
        foodX = pos.x;
        foodY = pos.y;
        currentFood = getWeightedRandomFood();
        
        // Set timer for star food
        if (currentFood.type === 'star' && currentFood.duration) {
            setTimeout(() => {
                if (foodX === pos.x && foodY === pos.y && currentFood.type === 'star') {
                    updateFoodPosition();
                }
            }, currentFood.duration);
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
        
        if (type === 'shield') {
            activePowerUp.timer = 100; // 10 seconds at 100ms intervals
            showPowerUpStatus(translate('shieldActive'));
            
            activePowerUp.intervalId = setInterval(() => {
                activePowerUp.timer--;
                updatePowerUpTimer();
                
                if (activePowerUp.timer <= 0) {
                    clearActivePowerUp();
                }
            }, 100);
        } else if (type === 'scissors') {
            // Cut snake in half
            if (snakeBody.length > 3) {
                const halfLength = Math.ceil(snakeBody.length / 2);
                snakeBody = snakeBody.slice(0, halfLength);
            }
            showPowerUpStatus(translate('scissorsActive'));
            
            // Clear message after 2 seconds
            setTimeout(() => {
                clearActivePowerUp();
            }, 2000);
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
        
        // Add shake animation to board
        playBoard.classList.add('game-over-animation');
        setTimeout(() => {
            playBoard.classList.remove('game-over-animation');
        }, 500);
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snake-pro-high-score", highScore);
            updateScoreDisplay();
        }
        
        // Show game over message
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
        
        // Play turn sound
        playSound('turn');

        // Prevent 180-degree turns
        if ((key === "ArrowUp" || key === "w" || key === "W") && velocityY === 0) {
            velocityX = 0; 
            velocityY = -1;
        } else if ((key === "ArrowDown" || key === "s" || key === "S") && velocityY === 0) {
            velocityX = 0; 
            velocityY = 1;
        } else if ((key === "ArrowLeft" || key === "a" || key === "A") && velocityX === 0) {
            velocityX = -1; 
            velocityY = 0;
        } else if ((key === "ArrowRight" || key === "d" || key === "D") && velocityX === 0) {
            velocityX = 1; 
            velocityY = 0;
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
            setIntervalId = setInterval(initGame, gameSpeed);
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
                if (deltaX > 0 && velocityX === 0) {
                    velocityX = 1; 
                    velocityY = 0;
                    playSound('turn');
                } else if (deltaX < 0 && velocityX === 0) {
                    velocityX = -1; 
                    velocityY = 0;
                    playSound('turn');
                }
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && velocityY === 0) {
                    velocityX = 0; 
                    velocityY = 1;
                    playSound('turn');
                } else if (deltaY < 0 && velocityY === 0) {
                    velocityX = 0; 
                    velocityY = -1;
                    playSound('turn');
                }
            }
        }
    };

    // --- EVENT LISTENERS ---
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Escape") {
            e.preventDefault();
            if (gameStarted) togglePause();
        } else {
            changeDirection(e);
        }
    });

    // Control buttons
    controls.forEach(control => {
        control.addEventListener("click", () => changeDirection({ target: control }));
    });

    // Game buttons
    startBtn.addEventListener("click", startGame);
    pauseBtn.addEventListener("click", togglePause);
    resumeBtn.addEventListener("click", togglePause);
    soundBtn.addEventListener("click", toggleSound);
    
    restartBtn.addEventListener("click", () => {
        clearInterval(setIntervalId);
        clearActivePowerUp();
        gameStarted = false;
        gameMessage.style.display = "flex";
        pauseOverlay.style.display = "none";
    });

    // Difficulty selection
    difficultyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            difficultyButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentDifficulty = btn.dataset.difficulty;
        });
    });

    // Map selection
    mapButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            mapButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentMap = btn.dataset.map;
            if (playBoard) {
                playBoard.style.background = maps[currentMap].bgColor;
            }
        });
    });

    // Color selection
    colorButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            colorButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const selectedColor = btn.dataset.color;
            updateSnakeColors(selectedColor);
        });
    });

    // Touch events
    playBoard.addEventListener("touchstart", handleTouchStart, { passive: true });
    playBoard.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Prevent context menu on long press
    playBoard.addEventListener("contextmenu", (e) => e.preventDefault());

    // --- INITIALIZATION ---
    updateScoreDisplay();
    updateTranslations();
    
    // Load saved color and update UI
    const savedColor = loadSavedColor();
    colorButtons.forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.color === savedColor) {
            btn.classList.add("active");
        }
    });
    
    if (playBoard) {
        playBoard.style.background = maps[currentMap].bgColor;
    }
    
    // Show initial game message
    gameMessage.style.display = "flex";
    pauseOverlay.style.display = "none";
    countdownEl.style.display = "none";
});
