function Inputs() {

	this.deltaTime = 0;
	this.moveLeft = false;
	this.moveRight = false;
	this.moveForward = false;
	this.moveBackward = false;
	this.rotateLeft = false;
	this.rotateRight = false;

}

Object.assign( Inputs.prototype, {

	clone: function () {

		let object = new this.constructor();

		object.deltaTime = this.deltaTime;
		object.moveLeft = this.moveLeft;
		object.moveRight = this.moveRight;
		object.moveForward = this.moveForward;
		object.moveBackward = this.moveBackward;
		object.rotateLeft = this.rotateLeft;
		object.rotateRight = this.rotateRight;

		return object;

	}

} );

if ( typeof module === 'object' ) {

	module.exports = Inputs;

}