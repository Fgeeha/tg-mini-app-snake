if (typeof window.Telegram === 'undefined' || typeof window.Telegram.WebApp === 'undefined') {
    document.body.innerHTML = '<h1>Please open this game from within Telegram.</h1>';
} else {
    const WebApp = window.Telegram.WebApp;
    WebApp.ready();

    // Get theme parameters and adjust styling
    const theme = WebApp.themeParams;
    document.body.style.backgroundColor = theme.bg_color || '#000000';

    // Set up canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 40; // Margin
    canvas.height = window.innerHeight - 100; // Space for score
    ctx.fillStyle = theme.bg_color || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Game variables
    const gridSize = 20;
    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 0;
    let dy = 0;
    let score = 0;
    const scoreElement = document.getElementById('score');

    // Draw snake and food
    function draw() {
        ctx.fillStyle = theme.bg_color || '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = theme.button_color || '#00ff00';
        snake.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        });
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
        scoreElement.textContent = `Score: ${score}`;
    }

    // Move snake
    function move() {
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            generateFood();
        } else {
            snake.pop();
        }

        if (head.x < 0 || head.x >= canvas.width / gridSize ||
            head.y < 0 || head.y >= canvas.height / gridSize ||
            snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }

        draw();
        setTimeout(move, 100);
    }

    // Generate new food position
    function generateFood() {
        food.x = Math.floor(Math.random() * (canvas.width / gridSize));
        food.y = Math.floor(Math.random() * (canvas.height / gridSize));
    }

    // Handle game over
    function gameOver() {
        WebApp.sendData(JSON.stringify({score: score, initData: WebApp.initData}));
    }

    // Keyboard controls
    document.addEventListener('keydown', e => {
        switch (e.key) {
            case 'ArrowUp':
                if (dy !== 1) {
                    dx = 0;
                    dy = -1;
                }
                break;
            case 'ArrowDown':
                if (dy !== -1) {
                    dx = 0;
                    dy = 1;
                }
                break;
            case 'ArrowLeft':
                if (dx !== 1) {
                    dx = -1;
                    dy = 0;
                }
                break;
            case 'ArrowRight':
                if (dx !== -1) {
                    dx = 1;
                    dy = 0;
                }
                break;
        }
    });

    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!touchStartX || !touchStartY) return;
        let touchEndX = e.touches[0].clientX;
        let touchEndY = e.touches[0].clientY;
        let dxTouch = touchEndX - touchStartX;
        let dyTouch = touchEndY - touchStartY;
        if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
            if (dxTouch > 0 && dx !== -1) {
                dx = 1;
                dy = 0;
            } else if (dxTouch < 0 && dx !== 1) {
                dx = -1;
                dy = 0;
            }
        } else {
            if (dyTouch > 0 && dy !== -1) {
                dx = 0;
                dy = 1;
            } else if (dyTouch < 0 && dy !== 1) {
                dx = 0;
                dy = -1;
            }
        }
        touchStartX = 0;
        touchStartY = 0;
    });

    // Start the game
    draw();
    document.addEventListener('keydown', () => move()); // Start on first key press
}