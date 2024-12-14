document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://107.172.92.109:8080/api';

    const screens = {
        start: document.getElementById('start-screen'),
        singleSettings: document.getElementById('single-settings-screen'),
        battleSettings: document.getElementById('battle-settings-screen'),
        game: document.getElementById('game-screen'),
        gameover: document.getElementById('gameover-screen')
    };

    const buttons = {
        singleMode: document.getElementById('single-mode-button'),
        battleMode: document.getElementById('battle-mode-button'),
        startSingleGame: document.getElementById('start-single-game-button'),
        startBattleGame: document.getElementById('start-battle-game-button'),
        noMorePrimes: document.getElementById('no-more-primes-btn'),
        restart: document.getElementById('restart-button'),
        clearRecords: document.getElementById('clear-records-button')
    };

    const gameElements = {
        board: document.getElementById('game-board'),
        hearts: document.getElementById('hearts-container'),
        roundInfo: document.getElementById('round-info'),
        timer: document.getElementById('timer-container'),
        score: document.getElementById('score'),
        playerAScore: document.getElementById('player-a-score'),
        playerBScore: document.getElementById('player-b-score'),
        finalScore: document.getElementById('final-score'),
        battleResult: document.getElementById('battle-result'),
        highScores: document.getElementById('high-scores-list')
    };

    // 싱글모드 설정
    const singleSettings = {
        modeSelect: document.getElementById('single-game-mode-select'),
        timeSelect: document.getElementById('single-time-limit-select'),
        heartSelect: document.getElementById('heart-count-select'),
        rangeStartSelect: document.getElementById('single-range-start-select'),
        rangeEndSelect: document.getElementById('single-range-end-select')
    };

    // 배틀모드 설정
    const battleSettings = {
        modeSelect: document.getElementById('battle-game-mode-select'),
        timeSelect: document.getElementById('battle-time-limit-select'),
        roundSelect: document.getElementById('round-count-select'),
        rangeStartSelect: document.getElementById('battle-range-start-select'),
        rangeEndSelect: document.getElementById('battle-range-end-select')
    };

    let gameState = {
        mode: 'single', // 'single' or 'battle'
        active: false,
        boardSize: 3,
        timeLimit: 40,
        hearts: 2,
        rounds: 3,
        currentRound: 1,
        currentPlayer: 'A',
        score: 0,
        playerAScore: 0,
        playerBScore: 0,
        stage: 1,
        timer: null,
        timeLeft: 40,
        numbers: [],
        primeMap: {},
        clicked: new Set()
    };

    // 이벤트 리스너 설정
    buttons.singleMode.addEventListener('click', () => {
        gameState.mode = 'single';
        showScreen('singleSettings');
    });

    buttons.battleMode.addEventListener('click', () => {
        gameState.mode = 'battle';
        showScreen('battleSettings');
    });

    buttons.startSingleGame.addEventListener('click', () => handleGameStart('single'));
    buttons.startBattleGame.addEventListener('click', () => handleGameStart('battle'));
    buttons.noMorePrimes.addEventListener('click', handleNoMorePrimes);
    buttons.restart.addEventListener('click', () => showScreen(gameState.mode === 'single' ? 'singleSettings' : 'battleSettings'));

    // 초기 화면 표시
    initRangeSelects();
    showScreen('start');

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.style.display = 'none';
        });
        screens[screenName].style.display = 'flex';

        if (screenName === 'start') {
            resetGameState();
        }
    }

    function handleGameStart(mode) {
        const settings = mode === 'single' ? singleSettings : battleSettings;
        if (!validateSettings(settings)) return;

        gameState = {
            ...gameState,
            mode: mode,
            active: true,
            boardSize: parseInt(settings.modeSelect.value),
            timeLimit: parseInt(settings.timeSelect.value),
            hearts: mode === 'single' ? parseInt(singleSettings.heartSelect.value) : null,
            rounds: mode === 'battle' ? parseInt(battleSettings.roundSelect.value) : null,
            currentRound: 1,
            currentPlayer: 'A',
            score: 0,
            playerAScore: 0,
            playerBScore: 0,
            timeLeft: parseInt(settings.timeSelect.value),
            numbers: [],
            primeMap: {},
            clicked: new Set()
        };

        initGame();
        showScreen('game');
        updateGameUI();
    }

    function updateGameUI() {
        if (gameState.mode === 'single') {
            gameElements.hearts.style.display = 'block';
            gameElements.roundInfo.style.display = 'none';
            gameElements.playerAScore.style.display = 'none';
            gameElements.playerBScore.style.display = 'none';
            gameElements.hearts.textContent = '❤️'.repeat(gameState.hearts);
        } else {
            gameElements.hearts.style.display = 'none';
            gameElements.roundInfo.style.display = 'block';
            gameElements.playerAScore.style.display = 'block';
            gameElements.playerBScore.style.display = 'block';
            gameElements.roundInfo.textContent = `Round ${gameState.currentRound}/${gameState.rounds}`;
            gameElements.playerAScore.textContent = `A: ${gameState.playerAScore}`;
            gameElements.playerBScore.textContent = `B: ${gameState.playerBScore}`;
            
            // 현재 플레이어 표시
            gameElements.board.className = `board player-${gameState.currentPlayer.toLowerCase()}-turn`;
        }

        gameElements.timer.textContent = `${gameState.timeLeft}초`;
    }

    function handleCellClick(cell, num) {
        if (!gameState.active || gameState.clicked.has(num)) return;
        
        gameState.clicked.add(num);
        
        if (gameState.primeMap[num]) {
            cell.style.backgroundColor = '#0066cc';
            if (gameState.mode === 'single') {
                gameState.score += 10;
            } else {
                if (gameState.currentPlayer === 'A') {
                    gameState.playerAScore += 10;
                } else {
                    gameState.playerBScore += 10;
                }
            }
        } else {
            cell.style.backgroundColor = '#cc0000';
            if (gameState.mode === 'single') {
                gameState.hearts--;
            } else {
                switchPlayer();
            }
        }
        
        updateGameUI();
        resetTimer();
        
        if (gameState.mode === 'single' && gameState.hearts <= 0) {
            endGame();
        }
    }

    function switchPlayer() {
        gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
        updateGameUI();
    }

    function handleNoMorePrimes() {
        if (!gameState.active) return;

        const unclickedPrimes = gameState.numbers.filter(num => 
            gameState.primeMap[num] && !gameState.clicked.has(num)
        );

        const allFoundPrimes = gameState.numbers.filter(num => 
            gameState.primeMap[num]
        ).every(num => gameState.clicked.has(num));

        if (unclickedPrimes.length === 0 && allFoundPrimes) {
            if (gameState.mode === 'single') {
                gameState.score += 30;
                nextRound();
            } else {
                if (gameState.currentPlayer === 'A') {
                    gameState.playerAScore += 30;
                } else {
                    gameState.playerBScore += 30;
                }
                
                if (gameState.currentRound < gameState.rounds) {
                    gameState.currentRound++;
                    nextRound();
                } else {
                    endGame();
                }
            }
        } else {
            if (gameState.mode === 'single') {
                gameState.hearts--;
                if (gameState.hearts <= 0) endGame();
            } else {
                switchPlayer();
            }
        }
        
        updateGameUI();
    }

    function endGame() {
        gameState.active = false;
        if (gameState.timer) clearInterval(gameState.timer);
        
        if (gameState.mode === 'single') {
            gameElements.finalScore.textContent = gameState.score;
            checkAndSaveHighScore(gameState.score);
        } else {
            const battleResult = document.getElementById('battle-result');
            if (gameState.playerAScore > gameState.playerBScore) {
                battleResult.textContent = "Player A Wins!";
                battleResult.className = 'battle-result winner';
            } else if (gameState.playerBScore > gameState.playerAScore) {
                battleResult.textContent = "Player B Wins!";
                battleResult.className = 'battle-result winner';
            } else {
                battleResult.textContent = "Draw!";
                battleResult.className = 'battle-result draw';
            }
        }
        
        showScreen('gameover');
    }

    function startTimer() {
        gameState.timeLeft = gameState.timeLimit;
        updateGameUI();
        
        gameState.timer = setInterval(() => {
            gameState.timeLeft--;
            updateGameUI();
            
            if (gameState.timeLeft <= 0) {
                if (gameState.mode === 'single') {
                    gameState.hearts--;
                    if (gameState.hearts <= 0) {
                        endGame();
                    } else {
                        resetTimer();
                    }
                } else {
                    switchPlayer();
                    resetTimer();
                }
                updateGameUI();
            }
        }, 1000);
    }

    // 나머지 유틸리티 함수들 (validateSettings, initRangeSelects, generateNumbers 등)은 
    // 기존과 동일하게 유지하되 settings 매개변수를 받도록 수정
});