function Player() {

	this.x = 0;
	this.y = 0;
	this.velX = 0;
	this.velY = 0;
	this.rotation = 0;
	this.radius = 34;
	this.angularVelocity = 0;
	this.areaSizeX = 700;
	this.areaSizeY = 500;

}

Object.assign( Player.prototype, {

	move: function ( inputs ) {

		const deltaTime = inputs.deltaTime / 1000;

		const maxAngularVelocity = 6;
		const theta = Math.PI * 2 * deltaTime;


		if ( inputs.rotateLeft ) {

			this.angularVelocity -= theta;

		} else if ( inputs.rotateRight ) {

			this.angularVelocity += theta;

		}

		const angularFriction = Math.PI / 180 * 180;

		const currentAngularSpeed = Math.abs( this.angularVelocity );

		this.angularVelocity = Math.sign( this.angularVelocity ) * Math.max( 0, currentAngularSpeed - angularFriction * deltaTime );

		this.rotation += this.angularVelocity * deltaTime;

		let dirX = 0;
		let dirY = 0;

		const sin = Math.sin( this.rotation );
		const cos = Math.cos( this.rotation );

		if ( inputs.moveForward ) {

			dirX += cos;
			dirY += sin;

		} else if ( inputs.moveBackward ) {

			dirX -= cos;
			dirY -= sin;

		}

		if ( inputs.moveRight ) {

			dirX += - sin;
			dirY += cos;

		} else if ( inputs.moveLeft ) {

			dirX -= - sin;
			dirY -= cos;

		}

		const acceleration = 400;
		const maxSpeed = 500;
		const friction = 50;

		const currentSpeed = Math.hypot( this.velX, this.velY );

		if ( currentSpeed > 0 ) {

			let amount = currentSpeed - friction * deltaTime;

			if ( amount < 0 ) {

				amount = 0;

			}

			const factor = amount / currentSpeed;

			this.velX *= factor;
			this.velY *= factor;

		}

		let amount = acceleration * deltaTime;

		if ( currentSpeed + amount > maxSpeed ) {

			amount = maxSpeed - currentSpeed;

		}

		this.velX += amount * dirX;
		this.velY += amount * dirY;

		this.x += this.velX * deltaTime;
		this.y += this.velY * deltaTime;

		const sx = this.areaSizeX / 2 - this.radius;
		const sy = this.areaSizeY / 2 - this.radius;

		if ( this.x < - sx ) {

			this.velX *= - 0.75;
			this.x = - sx;

		} else if ( this.x > sx ) {

			this.velX *= - 0.75;
			this.x = sx;

		}

		if ( this.y < - sy ) {

			this.velY *= - 0.75;
			this.y = - sy;

		} else if ( this.y > sy ) {

			this.velY *= - 0.75;
			this.y = sy;

		}

	}

} );

if ( typeof module === 'object' ) {

	module.exports = Player;

}