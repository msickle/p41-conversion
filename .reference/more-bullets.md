[7 tools called]

Based on examining your current codebase, I can see how bullets are currently implemented and suggest a clean approach for adding missiles and machine guns without significantly complicating your collision system.

## Current Bullet System

Your current system works like this:
- `Player.fire()` returns spawn data (position, velocity)
- `Game.js` creates physics sprites and adds them to `this.bullets` group
- Collision detection uses `physics.overlap(this.bullets, this.[enemyType])` for each enemy type

## Recommended Approach: Separate Projectile Groups

Instead of trying to shoehorn different projectile types into the same system, I'd recommend creating separate physics groups for each projectile type. This keeps collision logic clean and allows each projectile type to have its own behavior.

Here's how you could structure it:

### 1. Add New Projectile Groups in Game.js

```javascript
setupBullets() {
    // Keep existing bullets group
    this.bullets = this.physics.add.group({
        allowGravity: false,
        collideWorldBounds: false
    });
    
    // Add new groups for other projectile types
    this.missiles = this.physics.add.group({
        allowGravity: false,  // or true if missiles should be affected by gravity
        collideWorldBounds: false
    });
    
    this.machineGunBullets = this.physics.add.group({
        allowGravity: false,
        collideWorldBounds: false
    });
}
```

### 2. Create Projectile Classes

Create separate classes for missiles and machine gun bullets, similar to how `Bomb.js` works:

**objects/Missile.js**
```javascript
export class Missile extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'missile'); // You'll need a missile sprite
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setOrigin(0.5, 0.5);
        this.body.setSize(this.width, this.height);
        this.body.checkWorldBounds = true;
        
        // Missile-specific properties
        this.speed = 150; // faster than bullets
        this.turnRate = 0.05; // for homing
        this.target = null;
        this.damage = 50; // higher damage than bullets
    }
    
    fire(x, y, angle, target) {
        this.setPosition(x, y);
        this.target = target;
        
        // Initial velocity
        const vx = Math.cos(angle) * this.speed;
        const vy = Math.sin(angle) * this.speed;
        this.body.setVelocity(vx, vy);
        this.setRotation(angle);
    }
    
    update(time, delta) {
        if (this.target && this.target.active) {
            // Simple homing logic
            const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, 
                                                          this.target.x, this.target.y);
            const currentAngle = this.rotation;
            
            // Gradually turn towards target
            let angleDiff = Phaser.Math.Angle.ShortestBetween(currentAngle, angleToTarget);
            angleDiff = Phaser.Math.Clamp(angleDiff, -this.turnRate, this.turnRate);
            
            this.setRotation(currentAngle + angleDiff);
            
            // Update velocity based on new rotation
            const vx = Math.cos(this.rotation) * this.speed;
            const vy = Math.sin(this.rotation) * this.speed;
            this.body.setVelocity(vx, vy);
        }
        
        // Trail effects, etc.
    }
    
    onHit(target) {
        // Create explosion like Bomb.js does
        this.explode();
        this.destroy();
    }
    
    explode() {
        // Similar to Bomb.explode() but maybe larger
        const explosion = this.scene.physics.add.sprite(this.x, this.y, 'explosion');
        explosion.play('boom');
        explosion.on('animationcomplete', () => explosion.destroy());
        
        if (this.scene.sfxExplosion001) {
            this.scene.sfxExplosion001.play();
        }
    }
}
```

**objects/MachineGunBullet.js** (could be simpler, extending basic bullet behavior)
```javascript
export class MachineGunBullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bulletFriendly'); // Reuse bullet sprite
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setOrigin(0.5, 0.5);
        this.body.setSize(this.width, this.height);
        this.body.checkWorldBounds = true;
        
        // Machine gun specific - maybe smaller damage but faster
        this.damage = 5; // less than regular bullets
    }
    
    fire(vx, vy) {
        this.body.setVelocity(vx, vy);
    }
}
```

### 3. Update Player.js for Multiple Weapon Types

```javascript
// In Player.js constructor
this.weaponType = 'bullet'; // default
this.machineGunNextShot = 0;
this.machineGunFireRate = 50; // much faster than regular bullets

// Add weapon switching method
setWeapon(type) {
    this.weaponType = type;
    switch(type) {
        case 'bullet':
            this.shotDelay = GameConfig.SHOT_DELAY;
            break;
        case 'machinegun':
            this.shotDelay = this.machineGunFireRate;
            break;
        case 'missile':
            this.shotDelay = 1000; // slower firing rate
            break;
    }
}

// Modify fire method to handle different weapons
fire(time) {
    if (this.nextShotAt > time) return null;
    
    this.nextShotAt = time + this.shotDelay;
    
    // Calculate base firing data (same for all weapons)
    const gunAngle = this.gunBarrel.angle - 90;
    const gunAngleRads = Phaser.Math.DegToRad(gunAngle);
    const gunAngleSlop = Phaser.Math.FloatBetween(-0.05, 0.05);
    const finalAngle = gunAngleRads + gunAngleSlop;
    
    const angleOffsetModifier = -32;
    const gunAngleX = Math.cos(finalAngle) * angleOffsetModifier;
    const gunAngleY = Math.sin(finalAngle) * angleOffsetModifier;
    const bulletStartX = this.x + this.gunMantle.x - gunAngleX;
    const bulletStartY = this.y + this.gunMantle.y - gunAngleY;
    
    // Muzzle flash and sound effects (same for all)
    this.playMuzzleEffects(finalAngle);
    
    // Return different data based on weapon type
    return {
        type: this.weaponType,
        x: bulletStartX,
        y: bulletStartY,
        angle: finalAngle,
        vx: Math.cos(finalAngle) * GameConfig.FRIENDLY_BULLET_SPEED,
        vy: Math.sin(finalAngle) * GameConfig.FRIENDLY_BULLET_SPEED
    };
}
```

### 4. Update Game.js Firing Logic

```javascript
// In Game.js update method
if (this.fireKey.isDown) {
    const projectileData = this.player.fire(time);
    if (projectileData) {
        switch(projectileData.type) {
            case 'bullet':
                const bullet = this.physics.add.sprite(projectileData.x, projectileData.y, 'bulletFriendly');
                bullet.setOrigin(0.5, 0.5);
                bullet.body.setCollideWorldBounds(false);
                bullet.body.checkWorldBounds = true;
                this.bullets.add(bullet);
                bullet.body.setVelocity(projectileData.vx, projectileData.vy);
                break;
                
            case 'machinegun':
                const mgBullet = new MachineGunBullet(this, projectileData.x, projectileData.y);
                this.machineGunBullets.add(mgBullet);
                mgBullet.fire(projectileData.vx, projectileData.vy);
                break;
                
            case 'missile':
                const missile = new Missile(this, projectileData.x, projectileData.y);
                this.missiles.add(missile);
                
                // Find nearest enemy for homing
                const nearestEnemy = this.findNearestEnemy(projectileData.x, projectileData.y);
                missile.fire(projectileData.x, projectileData.y, projectileData.angle, nearestEnemy);
                break;
        }
    }
}
```

### 5. Add Separate Collision Checks

```javascript
checkCollisions() {
    // Existing bullet collisions
    this.checkBulletCollisions();
    
    // New projectile collisions
    this.checkMissileCollisions();
    this.checkMachineGunCollisions();
}

checkBulletCollisions() {
    // Your existing bullet collision code
    // Bullets vs helicopters, jets, etc.
}

checkMissileCollisions() {
    // Missiles vs helicopters
    this.physics.overlap(this.missiles, this.helicopters, (missile, helo) => {
        if (!missile.active || !helo.active) return;
        missile.onHit(helo);
        helo.onHitByProjectile(missile); // Need to add this method to enemies
    }, null, this);
    
    // Similar for other enemy types...
}

checkMachineGunCollisions() {
    // Similar to bullet collisions but maybe different damage
    this.physics.overlap(this.machineGunBullets, this.helicopters, (bullet, helo) => {
        if (!bullet.active || !helo.active) return;
        bullet.destroy();
        helo.onHitByProjectile(bullet); // Pass bullet for damage calculation
    }, null, this);
    
    // Similar for other enemy types...
}
```

## Benefits of This Approach

1. **Clean separation**: Each projectile type has its own group and collision logic
2. **No collision complexity**: Adding new projectile types doesn't affect existing collision code
3. **Flexible behavior**: Missiles can home, explode, have different physics, etc.
4. **Easy to extend**: Adding a new weapon type is just adding a new group and collision method
5. **Performance**: Separate groups allow for targeted collision checks

## Considerations

- **Enemy interface**: You'll need to update enemy classes to handle `onHitByProjectile(projectile)` instead of just `onHitByBullet()`
- **Asset management**: You'll need missile sprites (or reuse existing ones)
- **Weapon switching**: Add UI/keys to switch between weapons
- **Balance**: Adjust firing rates, damage, and ammo limits

This approach keeps your collision system clean while allowing dramatically different projectile behaviors. Would you like me to help implement any specific part of this system?