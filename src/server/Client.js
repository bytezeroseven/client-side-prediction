function Client( socket ) {

	this.socket = socket;

	this.id = - 1;

	this.isAlive = true;

	this.messages = [];

}

Object.assign( Client.prototype, {

	sendMessage: function ( message ) {

		if ( this.socket && this.socket.readyState === this.socket.OPEN ) {

			this.socket.send( message );

		}

	}

} );

module.exports = Client;