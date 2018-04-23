/*
	Spellcast

	Copyright (c) 2014 - 2018 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



var serverKit = require( 'server-kit' ) ;
var Ngev = require( 'nextgen-events' ) ;
var path = require( 'path' ) ;

var log = require( 'logfella' ).global.use( 'spellcast' ) ;



function Service( serviceOptions , bookOptions ) {
	Object.defineProperties( this , {
		port: { value: typeof serviceOptions.port === 'number' ? serviceOptions.port : 57311 , enumerable: true } ,
		basePath: { value: serviceOptions.basePath , enumerable: true } ,
		serverDomain: { value: serviceOptions.serverDomain , writable: true , enumerable: true } ,
		serverBasePath: { value: serviceOptions.serverBasePath , writable: true , enumerable: true } ,
		bookOptions: { value: bookOptions || {} , writable: true , enumerable: true } ,
		started: { value: false , writable: true , enumerable: true }
	} ) ;

} ;

module.exports = Service ;



Service.prototype.start = function start() {
	if ( this.started ) { return ; }
	this.createServer() ;
} ;



Service.prototype.createServer = function createServer() {
	var token , path_ ;
	console.log( this ) ;
	
	new serverKit.Server( {
		port: this.port ,
		ws: true ,
		http: true ,
		verbose: true ,
		catchErrors: false
	} , ( client ) => {
		console.log( client ) ;
		return ;

		if ( client.type === 'http' && this.hasHttp ) {
			// Auth for HTTP content

			/*
				path_ = client.url.split( '/' ).slice( 1 ) ;
				token = path_.unshift() ;

				log.info( 'HTTP client token: %s' , token ) ;

				if ( ! this.acceptTokens[ token ] )
				{
					console.log( 'HTTP client rejected: token not authorized' ) ;
					client.response.writeHeader( 403 ) ;
					client.response.end() ;
					return ;
				}
				*/

			if ( client.request.method === 'OPTIONS' ) { this.cors( client ) ; }
			else { this.httpRouter.requestHandler( client ) ; }
		}
		else if ( client.type === 'http.upgrade' && this.hasHttp ) {
			// This happens only when a http+ws server is created.
			// Accept all websocket connection, it will be filtered out in .wsClientHandler() if it needs.
			client.response.accept( true ) ;
		}
		else if ( client.type === 'ws' ) {
			this.wsClientHandler( client ) ;
		}
		else {
			client.response.writeHeader( 400 ) ;
			client.response.end( "This server does not handle " + client.type ) ;
			return ;
		}
	} ) ;
} ;



Service.prototype.createRouter = function createRouter() {
	// Root router
	this.httpRouter = serverKit.Router.create( 'mapRouter' ) ;
	this.httpRouter.setLocalRootPath( path.dirname( __dirname ) + '/browser' ) ;
	this.httpRouter.addStaticRoute( '/' , 'app.html' ) ;

	// /script sub-router, the sub-router for userland script assets
	var scriptRouter = serverKit.Router.create( 'simpleStaticRouter' ) ;
	scriptRouter.setLocalRootPath( this.httpStaticPath ) ;
	this.httpRouter.addRoute( /^\/script(?=\/)/ , scriptRouter.requestHandler ) ;

	// Create the sub-router for built-in assets
	var builtinRouter = serverKit.Router.create( 'simpleStaticRouter' ) ;
	builtinRouter.setLocalRootPath( __dirname + '/../browser/' ) ;
	builtinRouter.setIndexFile( 'app.html' ) ;
	// It works as a fallback sub-router
	this.httpRouter.addRoute( null , builtinRouter.requestHandler ) ;
} ;












// Useful?


Service.prototype.oldCreateRouter = function createRouter() {
	// Root router
	this.httpRouter = serverKit.Router.create( 'mapRouter' ) ;
	this.httpRouter.setLocalRootPath( path.dirname( __dirname ) + '/browser' ) ;
	this.httpRouter.addStaticRoute( '/' , 'app.html' ) ;

	// /script sub-router, the sub-router for userland script assets
	var scriptRouter = serverKit.Router.create( 'simpleStaticRouter' ) ;
	scriptRouter.setLocalRootPath( this.httpStaticPath ) ;
	this.httpRouter.addRoute( /^\/script(?=\/)/ , scriptRouter.requestHandler ) ;

	// Create the sub-router for built-in assets
	var builtinRouter = serverKit.Router.create( 'simpleStaticRouter' ) ;
	builtinRouter.setLocalRootPath( __dirname + '/../browser/' ) ;
	builtinRouter.setIndexFile( 'app.html' ) ;
	// It works as a fallback sub-router
	this.httpRouter.addRoute( null , builtinRouter.requestHandler ) ;
} ;



Service.prototype.createWebSocketServer = function createWebSocketServer() {
	var token , path_ ;

	new serverKit.Server( {
		port: this.port ,
		ws: true ,
		http: this.httpStaticPath ,
		verbose: true ,
		catchErrors: false
	} , ( client ) => {

		if ( client.type === 'http' && this.hasHttp ) {
			// Auth for HTTP content

			/*
				path_ = client.url.split( '/' ).slice( 1 ) ;
				token = path_.unshift() ;

				log.info( 'HTTP client token: %s' , token ) ;

				if ( ! this.acceptTokens[ token ] )
				{
					console.log( 'HTTP client rejected: token not authorized' ) ;
					client.response.writeHeader( 403 ) ;
					client.response.end() ;
					return ;
				}
				*/

			if ( client.request.method === 'OPTIONS' ) { this.cors( client ) ; }
			else { this.httpRouter.requestHandler( client ) ; }
		}
		else if ( client.type === 'http.upgrade' && this.hasHttp ) {
			// This happens only when a http+ws server is created.
			// Accept all websocket connection, it will be filtered out in .wsClientHandler() if it needs.
			client.response.accept( true ) ;
		}
		else if ( client.type === 'ws' ) {
			this.wsClientHandler( client ) ;
		}
		else {
			client.response.writeHeader( 400 ) ;
			client.response.end( "This server does not handle " + client.type ) ;
			return ;
		}
	}
	) ;
} ;



Service.prototype.wsClientHandler = function wsClientHandler( client ) {
	//log.info( 'client connected: %I' , websocket ) ;

	var appClient ;
	var token = client.request.url.slice( 1 ) ;

	log.info( 'Client connected: %s' , token ) ;

	if ( this.book.clients.getToken( token ) ) {
		log.warning( 'Client rejected: token already connected' ) ;
		client.websocket.close() ;
		return ;
	}

	if ( ! this.acceptTokens[ token ] ) {
		console.log( 'Client rejected: token not authorized' ) ;
		client.websocket.close() ;
		return ;
	}


	// Add the current websocket to the list of clients
	appClient = Client.create( {
		token: token ,
		book: this.book ,
		connection: client.websocket
	} ) ;

	if ( ! this.book.addClient( appClient ) ) {
		console.log( 'Client rejected: not enough roles' ) ;
		client.websocket.close() ;
		return ;
	}

	//log.warning( this.book.clients ) ;

	var proxy = new Ngev.Proxy() ;

	// Add the local services and grant listen rights
	proxy.addLocalService( 'bus' , appClient , {
		emit: true , listen: true , ack: true
	} ) ;

	client.websocket.on( 'message' , ( message ) => {

		//console.log('received: %s', message ) ;

		try {
			message = JSON.parse( message ) ;
		}
		catch ( error ) {
			console.error( 'Parse error (client data): ' + error ) ;
			return ;
		}

		//log.info( 'Received message: %I' , message ) ;
		proxy.receive( message ) ;
	} ) ;

	// Define the send method
	proxy.send = ( message ) => {
		//log.info( 'Sending: %I' , message ) ;

		client.websocket.send( JSON.stringify( message ) ) ;
	} ;

	var cleaned = false ;

	// Clean up after everything is done
	var cleanup = () => {
		if ( cleaned ) { return ; }
		cleaned = true ;
		log.info( 'Client %s closed' , token ) ;
		proxy.destroy() ;
		this.book.removeClient( appClient ) ;
		appClient = null ;
	} ;

	// Clean up after everything is done
	client.websocket.on( 'close' , cleanup ) ;
	client.websocket.on( 'end' , cleanup ) ;

	client.websocket.on( 'error' , ( error ) => {
		log.info( 'Client %s error: %E' , token , error ) ;
		// What should be done here?
	} ) ;
} ;



// Manage CORS on OPTIONS request
Service.prototype.cors = function cors( client ) {
	// Allowed website
	client.response.setHeader( 'Access-Control-Allow-Origin' , '*' ) ;

	// Allowed methods
	client.response.setHeader( 'Access-Control-Allow-Methods' , 'GET, POST, OPTIONS' ) ;

	// Allowed headers
	client.response.setHeader( 'Access-Control-Allow-Headers' , 'Content-Type' ) ;

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	//client.response.setHeader( 'Access-Control-Allow-Credentials' , true ) ;

	client.response.end() ;
} ;

