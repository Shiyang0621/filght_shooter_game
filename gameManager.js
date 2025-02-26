class GameManager {
    static restart(game) {
        // 重置游戏状态
        game.score = 0;
        game.level = 1;
        game.gameOver = false;
        game.paused = false;
        game.frameCount = 0;
        
        // 重置玩家
        game.player = new Player(game.canvas);
        
        // 清空所有数组
        game.bullets = [];
        game.enemies = [];
        game.powerUps = [];
        
        // 重置按键状态
        game.keys = {};
    }

    static handleKeyPress(event, game) {
        if ((event.key === 'r' || event.key === 'R') && game.gameOver) {
            this.restart(game);
        }
    }
}

// Remove or modify this line if the element is not needed
// document.getElementById('gameOverText').textContent = 'Game Over';  