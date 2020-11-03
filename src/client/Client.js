function Client() {

	const scope = this;

	this.gameCanvasEl = document.querySelector( '.game-canvas' );

	this.serverStateEl = document.querySelector( '.server-state' );
	this.predictedStateEl = document.querySelector( '.predicted-state' );
	this.interpolatedStateEl = document.querySelector( '.interpolated-state' );
	this.speedHackEl = document.querySelector( '.speed-hack' );
	
	this.gameCanvasEl.width = window.innerWidth;
	this.gameCanvasEl.height = window.innerHeight;

	this.context = this.gameCanvasEl.getContext( '2d' );

	this.webSocket = null;

	this.messages = [];

	this.player = new Player();
	this.inputs = new Inputs();
	this.inputsArray = [];

	this.historySize = 1024;
	this.history = [];

	this.tickNumber = 0;

	this.currentTime = null;
	this.lastTime = null;
	this.deltaTime = null;

	this.interpolatedPlayer = new InterpolatedPlayer();
	this.serverPlayer = new Player();
	this.speedHackPlayer = new Player();

	this.otherPlayers = [];

	this.trails = [];

	this.connect = function ( url ) {

		if ( scope.webSocket !== null ) {

			// disconnect

		}

		url = url.replace( 'http', 'ws' );

		scope.webSocket = new WebSocket( url );

		scope.webSocket.addEventListener( 'open', onWebSocketOpen );
		scope.webSocket.addEventListener( 'message', onWebSocketMessage );
		scope.webSocket.addEventListener( 'close', onWebSocketClose );
		scope.webSocket.addEventListener( 'error', onWebSocketError );

	}

	function onWebSocketOpen() {

		scope.onConnected();

	}

	function onWebSocketMessage( event ) {

		scope.onMessage( event.data );

	}

	function onWebSocketClose() {

		scope.onDisconnected();

	}

	function onWebSocketError( error ) {

		console.error( 'WebSockt error! ' + error );

	}

	window.addEventListener( 'keydown', onKeyDown, false );
	window.addEventListener( 'keyup', onKeyUp, false );
	window.addEventListener( 'resize', onWindowResize, false );

	function onKeyDown( event ) {

		scope.setInputsFromKeyCode( event.keyCode, true );

	}

	function onKeyUp( event ) {

		scope.setInputsFromKeyCode( event.keyCode, false );

	}

	function onWindowResize() {

		scope.gameCanvasEl.width = window.innerWidth;
		scope.gameCanvasEl.height = window.innerHeight;

		scope.draw();

	}

}

Object.assign( Client.prototype, {

	setInputsFromKeyCode: function ( keyCode, value ) {

		switch ( keyCode ) {

			case 65:

				this.inputs.moveLeft = value;

				break;

			case 87:

				this.inputs.moveForward = value;

				break;

			case 68:

				this.inputs.moveRight = value;

				break;

			case 83:

				this.inputs.moveBackward = value;

				break;

			case 81:

				this.inputs.rotateLeft = value;

				break;

			case 69:

				this.inputs.rotateRight = value;

				break;

		}

	},

	sendMessage: function ( message ) {

		if ( this.webSocket && this.webSocket.readyState === WebSocket.OPEN ) {

			this.webSocket.send( message );

		}

	},

	onConnected: function () {

		console.log( 'connected!' );

	},

	onMessage: function ( data ) {

		this.messages.push( data );

	},

	onDisconnected: function () {

		console.log( 'disconnected.' );

	},

	update: function () {

		this.currentTime = Date.now();

		if ( this.lastTime === null ) {

			this.lastTime = this.currentTime;

			return;

		}

		this.deltaTime = this.currentTime - this.lastTime;
		this.lastTime = this.currentTime;

		if ( ! this.webSocket || this.webSocket.readyState !== WebSocket.OPEN ) {

			console.log( 'not connected, skipping' );

			return;

		}

		this.inputs.deltaTime = this.deltaTime;

		if ( this.speedHackEl.checked ) {

			this.inputs.deltaTime *= 4;

		}

		const inputsClone = this.inputs.clone();
		this.inputsArray.push( inputsClone );

		this.sendMessage( JSON.stringify( {
			id: 'inputs',
			tickNumber: this.tickNumber,
			inputsArray: this.inputsArray
		} ) );

		this.inputsArray.length = 0;

		this.history[ this.tickNumber % this.historySize ] = {
			x: this.player.x, 
			y: this.player.y,
			velX: this.player.velX, 
			velY: this.player.velY, 
			rotation: this.player.rotation, 
			inputs: inputsClone
		};

		this.player.move( this.inputs );

		this.speedHackPlayer.move( this.inputs );

		while ( this.messages.length > 0 ) {

			const message = JSON.parse( this.messages.shift() );

			switch ( message.id ) {

				case 'update':

					const serverState = message.data;

					this.interpolatedPlayer.setNewState( serverState.x, serverState.y, serverState.rotation, this.currentTime );

					this.serverPlayer.x = serverState.x;
					this.serverPlayer.y = serverState.y;
					this.serverPlayer.rotation = serverState.rotation;

					let history = this.history[ message.data.tickNumber % this.historySize ];

					const error = Math.hypot( serverState.x - history.x, serverState.y - history.y ) + Math.abs( serverState.rotation - history.rotation );

					if ( error > 0.00001 ) {

						console.log( 'correcting' );

						this.player.x = serverState.x;
						this.player.y = serverState.y;
						this.player.velX = serverState.velX;
						this.player.velY = serverState.velY;
						this.player.rotation = serverState.rotation;

						let rewindTickNumber = serverState.tickNumber;

						while ( rewindTickNumber <= this.tickNumber ) {

							history = this.history[ rewindTickNumber % this.historySize ];

							history.x = this.player.x;
							history.y = this.player.y;
							history.velX = this.player.velX;
							history.velY = this.player.velY;
							history.rotation = this.player.rotation;

							this.player.move( history.inputs );

							rewindTickNumber ++;

						}

					}

					break;

				case 'worldUpdate':

					const players = [];

					while ( message.data.length > 0 ) {

						const data = message.data.shift();

						let player = this.otherPlayers.find( function ( player ) {
							return player.id === data.id;
						} );

						if ( player ) {

							player.setNewState( data.x, data.y, data.rotation, this.currentTime );

						} else {

							player = new InterpolatedPlayer();
							player.id = data.id;
							player.setNewState( data.x, data.y, data.rotation, 0 );
						
						}

						players.push( player );

					}

					this.otherPlayers = players;

					break;

			}

		}

		this.tickNumber ++;

		this.interpolatedPlayer.update( this.currentTime, 200 );

		for ( let i = 0; i < this.otherPlayers.length; i ++ ) {

			this.otherPlayers[ i ].update( this.currentTime, 200 );

		}

		const lastTrail = this.trails[ this.trails.length - 1 ];

		this.trails.push( {
			x: this.player.x,
			y: this.player.y
		} );

		if ( this.trails.length > 10 ) {

			this.trails.shift();

		}

	},

	drawPlayer: function ( player, hue, arrowColor ) {

		this.context.fillStyle = 'hsl(' + hue + ', 100%, 60%)';
		this.context.strokeStyle = 'hsl(' + hue + ', 100%, 40%)';

		this.context.lineWidth = 6;
		this.context.lineCap = 'round';
		this.context.lineJoin = 'round';

		this.context.beginPath();
		this.context.arc( player.x, player.y, player.radius, 0, Math.PI * 2 );
		this.context.closePath();

		this.context.fill();

		this.context.beginPath();
		this.context.arc( player.x, player.y, player.radius + this.context.lineWidth / 2, 0, Math.PI * 2 );
		this.context.closePath();

		this.context.stroke();

		this.context.strokeStyle = arrowColor;
		this.context.lineWidth = 8;

		const arrowSize = ( Math.sin( Date.now() / 100 ) * 0.5 + 0.5 ) * 10 + 50;
		
		this.context.save();

		this.context.translate( player.x, player.y );
		this.context.rotate( player.rotation );

		this.context.translate( player.radius + 15, 0 );

		this.context.beginPath();

		this.context.moveTo( 0, 0 );
		this.context.lineTo( arrowSize, 0 );
		this.context.moveTo( arrowSize * 0.80, - 10 );
		this.context.lineTo( arrowSize, 0 );
		this.context.lineTo( arrowSize * 0.80, 10 );

		this.context.stroke();

		this.context.restore();

	},

	draw: function () {

		this.context.globalAlpha = 1;

		this.context.fillStyle = '#d4d4d4';

		this.context.fillRect( 0, 0, this.gameCanvasEl.width, this.gameCanvasEl.height );

		this.context.save();

		this.context.translate( this.gameCanvasEl.width / 2, this.gameCanvasEl.height / 2 );

		if ( ! this.webSocket || this.webSocket.readyState !== WebSocket.OPEN ) {

			this.context.font = 'bolder 50px arial';
			this.context.textBaseline = 'middle';
			this.context.textAlign = 'center';

			this.context.fillStyle = '#fff';
			this.context.strokeStyle = '#222';

			this.context.lineJoin = 'round';
			this.context.lineCap = 'round';

			this.context.lineWidth = 6;

			if ( this.webSocket.readyState < WebSocket.OPEN ) {

				text = 'Connecting...';

			} else {

				text = 'Disconnected!';

			}

			this.context.strokeText( text, 0, 0 );
			this.context.fillText( text, 0, 0 );

			this.context.restore();

			return;

		}

		this.context.lineWidth = 6;
		this.context.strokeStyle = '#aaa';

		this.context.strokeRect( 
			- this.player.areaSizeX / 2 - this.context.lineWidth / 2, 
			- this.player.areaSizeY / 2 - this.context.lineWidth / 2, 
			this.player.areaSizeX + this.context.lineWidth, 
			this.player.areaSizeY + this.context.lineWidth 
		);

		for ( let i = 0; i < this.otherPlayers.length; i ++ ) {

			this.drawPlayer( this.otherPlayers[ i ], 150, '#999' );

		}

		this.context.globalAlpha = 0.5;

		if ( this.interpolatedStateEl.checked ) {

			this.drawPlayer( this.interpolatedPlayer, 0, '#333' );

		}

		if ( this.serverStateEl.checked ) {

			this.drawPlayer( this.serverPlayer, 200, '#333' );

		}

		if ( this.speedHackEl.checked ) {

			this.drawPlayer( this.speedHackPlayer, 30, '#333' );

		}

		if ( this.predictedStateEl.checked ) {

			this.context.globalAlpha = 0.5;

			this.context.strokeStyle = 'white';
			this.context.lineWidth = this.player.radius * 2;

			this.context.beginPath();

			for ( let i = 0; i < this.trails.length; i ++ ) {

				this.context.lineTo( this.trails[ i ].x, this.trails[ i ].y );

			}

			this.context.stroke();

			this.context.closePath();

			this.context.globalAlpha = 1;

			this.drawPlayer( this.player, 80, '#333' );

		}

		this.context.restore();

	}

} );