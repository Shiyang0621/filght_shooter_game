class GameObject {
    constructor(x, y, width, height, speed = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.isAlive = true;
    }

    draw(ctx) {
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isColliding(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Player extends GameObject {
    constructor(canvas) {
        super(canvas.width / 2 - 25, canvas.height - 60, 50, 40, 5);
        this.canvas = canvas;
        this.health = 100;
        this.maxHealth = 100;
        this.shootCooldown = 0;
        this.powerLevel = 1;
        this.isInvincible = false;
        this.invincibleTime = 0;

        this.image = new Image();
        this.image.src = '751637-200.svg';
    }

    update(keys) {
        if (keys['ArrowLeft']) this.x -= this.speed;
        if (keys['ArrowRight']) this.x += this.speed;
        if (keys['ArrowUp']) this.y -= this.speed;
        if (keys['ArrowDown']) this.y += this.speed;

        // 边界检查
        this.x = Math.max(0, Math.min(this.canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas.height - this.height, this.y));

        // 射击冷却
        if (this.shootCooldown > 0) this.shootCooldown--;

        // 无敌时间
        if (this.isInvincible) {
            this.invincibleTime--;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
            }
        }
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.isInvincible ? '#7fb3ff' : '#3498db';
            super.draw(ctx);
        }

        
        // 绘制生命条
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(10, 10, (this.health / this.maxHealth) * 200, 20);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(10, 10, 200, 20);

        // Update health bar
        const healthBarFill = document.getElementById('health-bar-fill');
        healthBarFill.style.width = `${(this.health / this.maxHealth) * 100}%`;
    }

    shoot() {
        if (this.shootCooldown <= 0) {
            let bullets = [];
            switch(this.powerLevel) {
                case 1:
                    bullets.push(new Bullet(this.x + this.width/2, this.y, 0, 1));
                    break;
                case 2:
                    bullets.push(new Bullet(this.x + 10, this.y, -0.5, 2));
                    bullets.push(new Bullet(this.x + this.width - 10, this.y, 0.5, 2));
                    break;
                case 3:
                    bullets.push(new Bullet(this.x + this.width/2, this.y, 0, 3));
                    bullets.push(new Bullet(this.x + 10, this.y, -1, 3));
                    bullets.push(new Bullet(this.x + this.width - 10, this.y, 1, 3));
                    break;
            }
            this.shootCooldown = 10;
            return bullets;
        }
        return [];
    }

    damage(amount) {
        if (!this.isInvincible) {
            this.health -= amount;
            this.isInvincible = true;
            this.invincibleTime = 60; // 1秒无敌时间
            return this.health <= 0;
        }
        return false;
    }
}

class Bullet extends GameObject {
    constructor(x, y, angle = 0, powerLevel = 1) {
        // 根据能量等级调整子弹大小
        const width = powerLevel === 3 ? 8 : powerLevel === 2 ? 6 : 4;
        const height = powerLevel === 3 ? 15 : powerLevel === 2 ? 12 : 10;
        super(x - width/2, y, width, height, 10);
        this.angle = angle;
        this.powerLevel = powerLevel;
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        // 保存子弹轨迹
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.y -= this.speed;
        this.x += this.angle;
        return this.y < -this.height;
    }

    draw(ctx) {
        // 绘制子弹轨迹
        ctx.save();
        this.trail.forEach((pos, index) => {
            const alpha = index / this.trail.length;
            ctx.fillStyle = `rgba(255, ${this.powerLevel * 80}, 0, ${alpha * 0.5})`;
            ctx.fillRect(pos.x, pos.y, this.width, this.height);
        });

        // 根据能量等级设置子弹颜色和发光效果
        ctx.shadowBlur = 10;
        switch(this.powerLevel) {
            case 1:
                ctx.fillStyle = '#000';
                ctx.shadowColor = '#000';
                break;
            case 2:
                ctx.fillStyle = '#ff4400';
                ctx.shadowColor = '#ff4400';
                break;
            case 3:
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                // 添加额外的发光效果
                ctx.shadowBlur = 20;
                break;
        }

        // 绘制子弹主体
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    // 添加碰撞效果
    createExplosion(ctx) {
        const particles = [];
        const particleCount = this.powerLevel * 5;
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                radius: Math.random() * 3 + 2,
                dx: (Math.random() - 0.5) * 4,
                dy: (Math.random() - 0.5) * 4,
                alpha: 1
            });
        }

        return particles;
    }
}

class Enemy extends GameObject {
    constructor(x, type = 'normal') {
        super(x, -30, 30, 30, 2);
        this.type = type;
        this.health = type === 'boss' ? 100 : 1;

        if (type === 'tank') {
            this.image = new Image();
            this.image.src = 'assets/tank.svg';

            // Add event listeners for image loading
            this.image.onload = () => {
                this.imageLoaded = true;
            };
            this.image.onerror = () => {
                console.error('Failed to load image: assets/tank.svg');
                this.imageLoaded = false;
            };
        }

        switch(type) {
            case 'fast':
                this.speed = 4;
                this.width = 20;
                this.height = 20;
                break;
            case 'tank':
                this.speed = 1;
                this.health = 3;
                this.width = 40;
                this.height = 40;
                break;
            case 'boss':
                this.speed = 1;
                this.width = 80;
                this.height = 80;
                break;
        }
    }

    update() {
        this.y += this.speed;
        return this.y > 600;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();

        switch(this.type) {
            case 'normal':
                // Design as a fighter jet
                ctx.fillStyle = '#2c3e50';
                ctx.shadowColor = '#34495e';
                ctx.shadowBlur = 10;
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width, this.y + this.height / 2);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height);
                ctx.lineTo(this.x, this.y + this.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            case 'fast':
                // Design as a stealth bomber
                ctx.fillStyle = '#7f8c8d';
                ctx.shadowColor = '#95a5a6';
                ctx.shadowBlur = 15;
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width, this.y + this.height / 3);
                ctx.lineTo(this.x + this.width * 3 / 4, this.y + this.height);
                ctx.lineTo(this.x + this.width / 4, this.y + this.height);
                ctx.lineTo(this.x, this.y + this.height / 3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            case 'tank':
                // Use the SVG image for the tank
                if (this.imageLoaded) {
                    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
                } else {
                    // Fallback if the image is not yet loaded or failed to load
                    ctx.fillStyle = '#27ae60';
                    ctx.fillRect(this.x, this.y + this.height / 4, this.width, this.height / 2);
                    ctx.fillRect(this.x + this.width / 4, this.y, this.width / 2, this.height / 4);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(this.x, this.y + this.height / 4, this.width, this.height / 2);
                    ctx.strokeRect(this.x + this.width / 4, this.y, this.width / 2, this.height / 4);
                }
                break;
            case 'boss':
                // Design as a large military aircraft
                ctx.fillStyle = '#c0392b';
                ctx.shadowColor = '#e74c3c';
                ctx.shadowBlur = 20;
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width, this.y + this.height / 3);
                ctx.lineTo(this.x + this.width * 3 / 4, this.y + this.height);
                ctx.lineTo(this.x + this.width / 4, this.y + this.height);
                ctx.lineTo(this.x, this.y + this.height / 3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 5;
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    damage() {
        this.health--;
        return this.health <= 0;
    }
}

class PowerUp extends GameObject {
    constructor(x, y, type) {
        super(x, y, 20, 20, 2);
        this.type = type;
    }

    update() {
        this.y += this.speed;
        return this.y > 600;
    }

    draw(ctx) {
        ctx.fillStyle = this.type === 'health' ? '#2ecc71' : '#f1c40f';
        super.draw(ctx);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;

        this.player = new Player(this.canvas);
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.keys = {};
        this.frameCount = 0;
        this.particles = [];
        this.spawnInterval = 100; // Initial spawn interval
        this.lastSpawnTime = 0; // Track the last spawn time

        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                const newBullets = this.player.shoot();
                this.bullets.push(...newBullets);
            }
            if (e.key === 'p') {
                this.paused = !this.paused;
            }
            // 使用 GameManager 处理重启
            GameManager.handleKeyPress(e, this);
        });
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    spawnEnemy() {
        const random = Math.random();
        let type = 'normal';
        
        if (this.score > 5000 && random < 0.1) {
            type = 'boss';
        } else if (random < 0.2) {
            type = 'fast';
        } else if (random < 0.3) {
            type = 'tank';
        }

        const x = Math.random() * (this.canvas.width - 30);
        this.enemies.push(new Enemy(x, type));
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.3) {
            const type = Math.random() < 0.5 ? 'health' : 'power';
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    update() {
        if (this.gameOver || this.paused) return;

        this.frameCount++;

        // 更新玩家
        this.player.update(this.keys);

        // 更新子弹
        this.bullets = this.bullets.filter(bullet => !bullet.update());

        // 生成敌人
        if (this.frameCount - this.lastSpawnTime > this.spawnInterval) {
            this.spawnEnemy();
            this.lastSpawnTime = this.frameCount;
        }

        // 更新敌人
        this.enemies = this.enemies.filter(enemy => !enemy.update());

        // 更新道具
        this.powerUps = this.powerUps.filter(powerUp => !powerUp.update());

        // 检测碰撞
        this.checkCollisions();

        // 更新等级
        this.level = Math.floor(this.score / 1000) + 1;

        // Adjust spawn interval based on level
        this.spawnInterval = Math.max(10, 100 - this.level * 5);

        // 更新粒子效果
        this.particles = this.particles.filter(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.alpha -= 0.02;
            return particle.alpha > 0;
        });
    }

    checkCollisions() {
        // 子弹与敌人碰撞
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (bullet.isColliding(enemy)) {
                    // 创建爆炸效果
                    this.particles.push(...bullet.createExplosion(this.ctx));
                    
                    if (enemy.damage()) {
                        this.score += enemy.type === 'boss' ? 500 : 100;
                        this.spawnPowerUp(enemy.x, enemy.y);
                        this.enemies.splice(enemyIndex, 1);
                    }
                    this.bullets.splice(bulletIndex, 1);
                }
            });
        });

        // 玩家与敌人碰撞
        this.enemies.forEach((enemy, index) => {
            if (this.player.isColliding(enemy)) {
                if (this.player.damage(20)) {
                    this.gameOver = true;
                }
                this.enemies.splice(index, 1);
            }
        });

        // 玩家与道具碰撞
        this.powerUps.forEach((powerUp, index) => {
            if (this.player.isColliding(powerUp)) {
                if (powerUp.type === 'health') {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                } else {
                    this.player.powerLevel = Math.min(3, this.player.powerLevel + 1);
                }
                this.powerUps.splice(index, 1);
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制游戏对象
        this.player.draw(this.ctx);
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

        // 绘制粒子效果
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = '#ff4400';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // 更新UI
        document.getElementById('score').textContent = `分数: ${this.score}`;
        document.getElementById('level').textContent = `等级: ${this.level}`;

        // 游戏结束画面
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束', this.canvas.width/2, this.canvas.height/2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`最终分数: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 40);
            this.ctx.fillText('按R键重新开始', this.canvas.width/2, this.canvas.height/2 + 80);
        }

        // 暂停画面
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width/2, this.canvas.height/2);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
new Game(); 