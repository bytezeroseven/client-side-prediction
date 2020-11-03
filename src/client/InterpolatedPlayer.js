function InterpolatedPlayer() {

	Player.call( this );

	this.oldX = this.newX = this.x;
	this.oldY = this.newY = this.y;
	this.oldRotation = this.newRotation = this.rotation;
	this.updateTime = 0;

}

Object.assign( InterpolatedPlayer.prototype, {

	setNewState: function ( x, y, rotation, time ) {

		this.newX = x;
		this.newY = y;
		this.newRotation = rotation;

		this.oldX = this.x;
		this.oldY = this.y;
		this.oldRotation = this.rotation;

		this.updateTime = time;

	},

	update: function ( currentTime, period ) {

		const t = Math.min( ( currentTime - this.updateTime ) / period, 1 );

		this.x = this.oldX + ( this.newX - this.oldX ) * t;
		this.y = this.oldY + ( this.newY - this.oldY ) * t;
		this.rotation = this.oldRotation + ( this.newRotation - this.oldRotation ) * t;

	}

} );