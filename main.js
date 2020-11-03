const WebSocket = require( 'ws' );
const url = require( 'url' );

const express = require( 'express' );
const Server = require( './src/server/Server.js' );

const app = express();

app.use( express.static( __dirname ) );

const port = process.env.PORT || 80;

const httpServer = app.listen( port, function () {

	console.log( 'Server listening on port ' + port + '...' );

} );

const server = new Server();

server.start( httpServer );

setInterval( function () {

	server.update();

}, 1000 / 10 );