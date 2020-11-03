const Player = require( '../shared/Player.js' );
const Inputs = require( '../shared/Inputs.js' );

const Client = require( './Client.js' );

const WebSocket = require( 'ws' );
const url = require( 'url' );

function Server() {

	const scope = this;

	this.webSocketServer = null;

	this.allowedHostnames = [ 'localhost' ];

	this.clients = [];

	this.nextClientId = 0;

	this.currentTime = null;
	this.lastTime = null;

	this.start = function ( server ) {

		if ( scope.webSocketServer !== null ) {

			// idk maybe dispose that shit?

		}

		scope.webSocketServer = new WebSocket.Server( {
			server: server,
			perMessageDeflate: false
		} );

		const shouldHandle = scope.webSocketServer.shouldHandle;

		scope.webSocketServer.shouldHandle = function ( request ) {

			const hostname = url.parse( request.headers.origin ).hostname;

			if ( scope.allowedHostnames.indexOf( hostname ) === - 1 ) {

				return false;

			}

			return shouldHandle.call( scope.webSocketServer, request );

		}

		scope.webSocketServer.on( 'connection', function ( socket ) {

			const client = new Client( socket );

			scope.onClientConnected( client );

			socket.on( 'message', function ( message ) {

				scope.onClientMessage( client, message );

			} );

			socket.on( 'close', function () {

				scope.onClientDisconnected( client );

			} );

		} );

	}

}

Object.assign( Server.prototype, {

	onClientConnected: function ( client ) {

		this.clients.push( client );

	},

	onClientMessage: function ( client, message ) {

		client.messages.push( message );

	},

	onClientDisconnected: function ( client ) {

		client.isAlive = false;

	},

	update: function () {

		this.currentTime = Date.now();

		for ( let i = this.clients.length - 1; i >= 0; i -- ) {

			const client = this.clients[ i ];

			if ( client.isAlive === false ) {

				this.clients.splice( i, 1 );

				continue;

			}

			if ( client.id === - 1 ) {

				client.id = this.nextClientId ++;

				client.player = new Player();
				client.inputs = new Inputs();

				client.time = this.currentTime;

			}

			while ( client.messages.length > 0 ) {

				const message = JSON.parse( client.messages.shift() );

				switch ( message.id ) {

					case 'inputs':

						while ( message.inputsArray.length > 0 ) {

							const inputs = message.inputsArray.shift();

							if ( client.time + inputs.deltaTime > this.currentTime ) {

								inputs.deltaTime = this.currentTime - client.time;

							}

							client.time += inputs.deltaTime;

							client.player.move( inputs );

						}

						client.sendMessage( JSON.stringify( {
							id: 'update',
							data: {
								x: client.player.x, 
								y: client.player.y,
								velX: client.player.velX, 
								velY: client.player.velY,
								rotation: client.player.rotation,
								tickNumber: message.tickNumber + 1
							}
						} ) );

						break;

				}

			}

		}

		for ( let i = 0; i < this.clients.length; i ++ ) {

			const client = this.clients[ i ];

			const worldUpdateMessage = {
				id: 'worldUpdate',
				data: []
			};

			for ( let j = 0; j < this.clients.length; j ++ ) {

				if ( i === j ) continue;

				const other = this.clients[ j ];

				worldUpdateMessage.data.push( {
					id: other.id,
					x: other.player.x,
					y: other.player.y,
					rotation: other.player.rotation
				} );

			}

			client.sendMessage( JSON.stringify( worldUpdateMessage ) );

		}

	}

} );

module.exports = Server;