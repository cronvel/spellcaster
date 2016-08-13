/*
	Spellcast
	
	Copyright (c) 2015 - 2016 Cédric Ronvel
	
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

/* global window, WebSocket */



var Ngev = require( 'nextgen-events' ) ;
var dom = require( 'dom-kit' ) ;
var url = require( 'url' ) ;



function SpellcastClient( options ) { return SpellcastClient.create( options ) ; }
module.exports = SpellcastClient ;
SpellcastClient.prototype = Object.create( Ngev.prototype ) ;
SpellcastClient.prototype.constructor = SpellcastClient ;



SpellcastClient.create = function create( options )
{
	var self = Object.create( SpellcastClient.prototype , {
		token: { value: options.token || 'null' , writable: true , enumerable: true } ,
		port: { value: options.port || 57311 , writable: true , enumerable: true } ,
		userName: { value: options.name || null , writable: true , enumerable: true } ,
		ws: { value: null , writable: true , enumerable: true } ,
		proxy: { value: null , writable: true , enumerable: true } ,
	} ) ;
	
	return self ;
} ;



var uiList = {
	classic: require( './ui/classic.js' ) ,
} ;



SpellcastClient.autoCreate = function autoCreate()
{
	var options = url.parse( window.location.href , true ).query ;
	
	window.spellcastClient = SpellcastClient.create( options ) ;
	//window.spellcastClient.init() ;
	
	if ( ! options.ui ) { options.ui = [ 'classic' ] ; }
	else if ( ! Array.isArray( options.ui ) ) { options.ui = [ options.ui ] ; }
	
	window.spellcastClient.ui = options.ui ;
	
	return window.spellcastClient ;
} ;



SpellcastClient.prototype.run = function run( callback )
{
	var self = this , isOpen = false ;
	
	this.proxy = new Ngev.Proxy() ;
	
	// Add the remote service we want to access
	this.proxy.addRemoteService( 'bus' ) ;
	
	this.ui.forEach( function( ui ) {
		if ( uiList[ ui ] ) { uiList[ ui ]( self.proxy.remoteServices.bus , self ) ; }
	} ) ;
	
	this.ws = new WebSocket( 'ws://127.0.0.1:' + this.port + '/' + this.token ) ;
	
	this.emit( 'connecting' ) ;
	
	this.ws.onerror = function onError()
	{
		if ( ! isOpen )
		{
			// The connection has never opened, we can't connect to the server.
			console.log( "Can't open Websocket (error)..." ) ;
			self.emit( 'error' , 'unreachable' ) ;
			return ;
		}
	} ;
	
	this.ws.onopen = function onOpen()
	{
		isOpen = true ;
		
		// Send 'ready' to server? 
		// No, let the UI send it.
		//self.proxy.remoteServices.bus.emit( 'ready' ) ;
		
		console.log( "Websocket opened!" ) ;
		self.emit( 'open' ) ;
		
		// Should be done after emitting 'open'
		if ( self.userName )
		{
			self.proxy.remoteServices.bus.emit( 'authenticate' , {
				name: self.userName
			} ) ;
		}
		
		if ( typeof callback === 'function' ) { callback() ; }
	} ;
	
	this.ws.onclose = function onClose()
	{
		if ( ! isOpen )
		{
			// The connection has never opened, we can't connect to the server.
			console.log( "Can't open Websocket (close)..." ) ;
			self.emit( 'error' , 'unreachable' ) ;
			return ;
		}
		
		isOpen = false ;
		self.proxy.destroy() ;
		console.log( "Websocket closed!" ) ;
		self.emit( 'close' ) ;
	} ;
	
	this.ws.onmessage = function onMessage( wsMessage )
	{
		var message ;
		
		try {
			message = JSON.parse( wsMessage.data ) ;
		}
		catch ( error ) {
			return ;
		}
		
		console.log( "Message received: " , message ) ;
		
		self.proxy.receive( message ) ;
	} ;
	
	self.proxy.send = function send( message ) {
		self.ws.send( JSON.stringify( message ) ) ;
	} ;
} ;



SpellcastClient.autoCreate() ;

dom.ready( function() {
	window.spellcastClient.run() ;
} ) ;

