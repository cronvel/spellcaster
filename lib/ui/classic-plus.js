/*
	Spellcast
	
	Copyright (c) 2014 - 2017 Cédric Ronvel
	
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



var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var async = require( 'async-kit' ) ;
//var spellcastPackage = require( '../../package.json' ) ;

//var Ngev = require( 'nextgen-events' ) ;

var log = require( 'logfella' ).global.use( 'spellcast-classic-ui' ) ;



function UI( bus , self )
{
	if ( ! self )
	{
		self = Object.create( UI.prototype , {
			bus: { value: bus , enumerable: true } ,
			user: { value: null , writable: true , enumerable: true } ,
			users: { value: null , writable: true , enumerable: true } ,
			roles: { value: null , writable: true , enumerable: true } ,
			roleId: { value: null , writable: true , enumerable: true } ,
			config: { value: null , writable: true , enumerable: true } ,
			chatConfig: { value: null , writable: true , enumerable: true } ,
			actionConfig: { value: null , writable: true , enumerable: true } ,
			inGame: { value: false , writable: true , enumerable: true } ,
			inChat: { value: false , writable: true , enumerable: true } ,
			isBlinkingChat: { value: false , writable: true , enumerable: true } ,
			chatInput: { value: null , writable: true , enumerable: true } ,
			inputHistory: { value: [] , writable: true , enumerable: true } ,
			chatHistory: { value: [] , writable: true , enumerable: true } ,
			nexts: { value: null , writable: true , enumerable: true } ,
			afterNext: { value: false , writable: true , enumerable: true } ,
			menu: { value: false , writable: true , enumerable: true } ,
			rewritableLines: { value: 0 , writable: true , enumerable: true } ,
			redrawNextList: { value: null , writable: true , enumerable: true } ,
			clearRoleListCallback: { value: null , writable: true , enumerable: true } ,
			clearNextListCallback: { value: null , writable: true , enumerable: true } ,
		} ) ;
	}
	
	self.bus.on( 'clientConfig' , UI.clientConfig.bind( self ) ) ;
	self.bus.on( 'user' , UI.user.bind( self ) ) ;
	self.bus.on( 'userList' , UI.userList.bind( self ) ) ;
	self.bus.on( 'roleList' , UI.roleList.bind( self ) ) ;
	
	self.bus.on( 'coreMessage' , UI.coreMessage.bind( self ) ) ;
	self.bus.on( 'errorMessage' , UI.errorMessage.bind( self ) ) ;
	self.bus.on( 'extOutput' , UI.extOutput.bind( self ) ) ;
	self.bus.on( 'extErrorOutput' , UI.extErrorOutput.bind( self ) ) ;
	
	self.bus.on( 'message' , UI.message.bind( self ) , { async: true } ) ;
	self.bus.on( 'chatConfig' , UI.chatConfig.bind( self ) ) ;
	self.bus.on( 'actionConfig' , UI.actionConfig.bind( self ) ) ;
	
	/*
	self.bus.on( 'image' , UI.image.bind( self ) ) ;
	self.bus.on( 'sound' , UI.sound.bind( self ) ) ;
	self.bus.on( 'music' , UI.music.bind( self ) ) ;
	*/
	
	self.bus.on( 'enterScene' , UI.enterScene.bind( self ) ) ;
	self.bus.on( 'leaveScene' , UI.leaveScene.bind( self ) ) ;
	self.bus.on( 'nextList' , UI.nextList.bind( self ) ) ;
	self.bus.on( 'nextTriggered' , UI.nextTriggered.bind( self ) ) ;
	
	self.bus.on( 'textInput' , UI.textInput.bind( self ) ) ;
	
	//self.bus.on( 'split' , UI.split.bind( self ) ) ;
	self.bus.on( 'rejoin' , UI.rejoin.bind( self ) ) ;
	
	self.bus.on( 'wait' , UI.wait.bind( self ) ) ;
	self.bus.on( 'end' , UI.end.bind( self ) ) ;
	
	self.bus.on( 'exit' , UI.exit.bind( self ) , { async: true } ) ;
	
	term.grabInput( { mouse: 'motion' } ) ;
	
	term.on( 'key' , key => {
		switch ( key )
		{
			case 'CTRL_C' :
				if ( self.clearNextListCallback ) { self.clearNextListCallback() ; }
				term.green( '\nCTRL-C received: quit...\n' ) ;
				term.processExit( 130 ) ;
				break ;
			case 'CTRL_S' :
				term.green( '\nSave state required...\n' ) ;
				self.bus.emit( 'saveState' ) ;
				break ;
			case 'TAB' :
				if ( self.inChat ) { self.closeChat() ; }
				else { self.openChat() ; }
				break ;
		}
	} ) ;
	
	self.bus.emit( 'ready' ) ;
	
	return self ;
}

//UI.prototype = Object.create( Ngev.prototype ) ;
//UI.prototype.constructor = UI ;

module.exports = UI ;



function arrayGetById( id ) { return this.find( e => e.id === id ) ; }  // jshint ignore:line



UI.clientConfig = function clientConfig( config )
{
	//term( 'Client config received: %Y' , config ) ;
	this.config = config ;
} ;



UI.user = function user( user_ )
{
	//console.log( 'User received: ' , user_ ) ;
	this.user = user_ ;
} ;



UI.userList = function userList( users )
{
	//console.log( 'User-list received: ' , users ) ;
	
	// Add the get method to the array
	users.get = arrayGetById ;
	this.users = users ;
} ;



UI.roleList = function roleList( roles , unassignedUsers , assigned )
{
	var roleIndex , userName , str , charCount ,
		shouldRedrawLines = false ,
		max = 0x61 + roles.length - 1 ;
	
	// If we have already received one 'roleList' event, rewrite lines to replace the last block
	if ( this.roles ) { shouldRedrawLines = true ; }
	
	this.roles = roles ;
	this.afterNext = true ;
	
	if ( this.clearRoleListCallback ) { this.clearRoleListCallback() ; }
	
	// Add the get method to the array
	roles.get = arrayGetById ;
	
	// If already in-game, no more thing to do...
	if ( this.inGame )
	{
		this.roles = roles ;
		return ;
	}
	
	if ( assigned )
	{
		if ( roles.length <= 1 )
		{
			// Nothing to do and nothing to display...
			this.roles = roles ;
			this.roleId = roles[ 0 ].id ;
			return ;
		}
		else
		{
			// Find our own role ID
			roles.find( ( e , i ) => {
				if ( e.clientId === this.user.id ) { this.roleId = e.id ; return true ; }
				return false ;
			} ) ;
		}
	}
	
	var draw = ( shouldRedrawLines ) => {
		
		if ( this.inChat ) { this.blinkChat() ; }
		
		if ( shouldRedrawLines ) { this.rewriteLines() ; }
		
		term( '\n' ) ;
		
		if ( assigned ) { term.brightGreen.inverse( 'ASSIGNED ROLES:' ) ; }
		else { term.inverse( 'SELECT A ROLE:' ) ; }
		
		term( '\n\n' ) ;
		
		roles.forEach( ( e , i ) => {
			charCount = 0 ;
			
			if ( ! assigned )
			{
				term.brightBlue( '%s. ' , String.fromCharCode( 0x61 + i ) ) ;
				charCount += 3 ;
			}
			
			term.brightBlue( '%s' , e.label ) ;
			charCount += e.label.length ;
			
			if ( e.clientId !== null )
			{
				userName = this.users.get( e.clientId ).name ;
				term.italic.dim( ' %s' , userName ) ;
				charCount += 1 + userName.length ;
			}
			
			term( '\n' ) ;
			
			this.rewritableLines += Math.floor( charCount / term.width ) + 1 ;
		} ) ;
		
		term( '\n' ) ;
		this.rewritableLines += 4 ;
		
		if ( assigned )
		{
			term( '\n\n' ) ;
			this.rewritableLines = 0 ;
			return ;
		}
		
		if ( unassignedUsers.length )
		{
			charCount = 8 ;
			str = unassignedUsers.map( e => this.users.get( e ).name ).join( ', ' ) ;
			charCount += str.length ;
			this.rewritableLines += Math.floor( charCount / term.width ) + 2 ;
			term( '^-Idling: ^/%s\n\n' , str ) ;
		}
		
		term.inverse( 'PRESS KEY a-' + String.fromCharCode( max ) + ' to select a role, or ESC/DELETE/BACKSPACE to cancel' ) ;
	} ;
	
	draw( shouldRedrawLines ) ;
	
	// Nothing more to do...
	if ( assigned ) { return ; }
	
	this.redrawNextList = () => {
		draw() ;
	} ;
	
	var clear = () => {
		term.column( 1 ).eraseLine() ;
		this.clearRoleListCallback = null ;
		term.off( 'key' , onKey ) ;
	} ;
	
	var onKey = ( name , matches , data ) => {
		
		if ( this.inChat ) { return ; }
		
		if ( data.codepoint >= 0x61 && data.codepoint <= max )
		{
			roleIndex = data.codepoint - 0x61 ;
			
			if ( roles[ roleIndex ].clientId !== null ) { return ; }
			
			clear() ;
			this.bus.emit( 'selectRole' , roleIndex ) ;
		}
		else if ( name === 'ESC' || name === 'DELETE' || name === 'BACKSPACE' )
		{
			clear() ;
			this.bus.emit( 'selectRole' , null ) ;
		}
	} ;
	
	this.clearRoleListCallback = clear ;
	term.on( 'key' , onKey ) ;
} ;



// Formated message emitted by the core engine, core execution continue
UI.coreMessage = function coreMessage()
{
	if ( this.inChat ) { this.blinkChat() ; }
	term.apply( term , arguments ) ;
} ;



// Error formated message, mostly emitted by the core engine, but may be emitted from the script
UI.errorMessage = function errorMessage()
{
	if ( this.inChat ) { this.blinkChat() ; }
	term.apply( term , arguments ) ;
} ;



// Script [message], execution can be suspended if the listener is async, waiting for completion.
// E.g.: possible use: wait for a user input before continuing processing.
UI.message = function message( text , options , callback )
{
	var triggered = false ;
	
	if ( this.inChat ) { this.blinkChat() ; }
	
	if ( ! options ) { options = {} ; }
	
	var triggerCallback = () => {
		if ( triggered ) { return ; }
		triggered = true ;
		if ( options.next ) { this.messageNext( callback ) ; return ; }
		callback() ;
	} ;
	
	if ( options.slowTyping )
	{
		term.markupOnly.slowTyping( text + '\n' , triggerCallback ) ;
		return ;
	}
	
	if ( this.afterNext )
	{
		this.rewriteLines() ;
	}
	
	term.column( 1 ).eraseLine() ;
	term.markupOnly( text + '\n' ) ;
	
	if ( this.afterNext && this.redrawNextList ) { this.redrawNextList() ; }		
	
	triggerCallback() ;
} ;



UI.prototype.messageNext = function messageNext( callback )
{
	term.inverse( 'PRESS SPACE OR ENTER TO CONTINUE' ) ;
	
	var onKey = ( key ) => {
		
		if ( this.inChat ) { return ; }
		
		if ( key === ' ' || key === 'ENTER' )
		{
			term.column( 1 ).eraseLine( '\n' ) ;
			term.off( 'key' , onKey ) ;
			callback() ;
		}
	} ;
	
	term.on( 'key' , onKey ) ;
} ;



UI.chatConfig = function chatConfig( data ) { this.chatConfig = data ; } ;
UI.actionConfig = function actionConfig( data ) { this.actionConfig = data ; } ;



// 'enterScene' event
UI.enterScene = function enterScene()
{
	this.inGame = true ;
	this.afterNext = false ;
} ;



// 'leaveScene' event
UI.leaveScene = function leaveScene()
{
	//if ( ! this.afterNext ) { term( '\n' ) ; }
} ;



const menuOptions = {
	leftPadding: '  ' ,
	selectedLeftPadding: '  ' ,
	submittedLeftPadding: '  ' ,
	extraLines: 2 ,
	style: term.brightBlue ,
	selectedStyle: term.bgBlue.white ,
	submittedStyle: term.bgGray.bold.brightWhite ,
	continueOnSubmit: true ,
	keyBindings: {
		ENTER: 'submit' ,
		KP_ENTER: 'submit' ,
		UP: 'previous' ,
		DOWN: 'next' ,
		//TAB: 'cycleNext' ,
		//SHIFT_TAB: 'cyclePrevious' ,
		HOME: 'first' ,
		END: 'last' ,
		BACKSPACE: 'cancel' ,
		DELETE: 'cancel'
    }
} ;



UI.nextList = function nextList( nexts , grantedRoleIds , undecidedRoleIds , timeout , isUpdate )
{
	var nextIndex , str , charCount , selectedIndex = 0 ,
		timer = null , timeStr = '' , startTime ;
	
	startTime = Date.now() ;
	
	this.nexts = nexts ;
	this.afterNext = true ;
	this.lastNextListEvent = Array.from( arguments ) ;
	
	if ( this.clearNextListCallback ) { this.clearNextListCallback() ; }
	
	if ( isUpdate )
	{
		if ( this.roles.length === 1 ) { return ; }	// No need to update if we are alone?
		
		// Should always be true?
		if ( this.clearNextListCallback ) { this.clearNextListCallback() ; }
		if ( this.menu ) { selectedIndex = this.menu.getState().selectedIndex ; }
	}
	
	//var onSubmit = ( error , data ) => {
	var onSubmit = ( data ) => {
		this.bus.emit( 'selectNext' , data.selectedIndex ) ;
	} ;
	
	var drawTimer = () => {
		//if ( this.inChat ) { this.blinkChat() ; }
		term.saveCursor() ;
		term.styleReset.inverse() ;
		if ( timeStr.length ) { term.moveTo.eraseLineAfter( term.width - timeStr.length , term.height ) ; }
		timeStr = 'Time limit: ' + Math.round( ( timeout + startTime - Date.now() ) / 1000 ) + 's' ;
		term.moveTo( term.width - timeStr.length , term.height , timeStr ) ;
		term.restoreCursor() ;
	} ;
	
	var draw = () => {
		
		if ( this.inChat ) { this.blinkChat() ; }
		
		term( '\n' ) ;
		
		var menuItems = nexts.map( next => {
			var item = next.label || 'Next.' ;
			
			if ( this.roles.length > 1 && Array.isArray( next.roleIds ) && next.roleIds.length )
			{
				item += ' ' + term.str.dim.italic( next.roleIds.map( e => this.roles.get( e ).label ).join( ', ' ) ) ;
			}
			
			return item ;
		} ) ;
		
		this.menu = term.singleColumnMenu(
			menuItems ,
			Object.assign( { selectedIndex: selectedIndex } , menuOptions )
		) ;
		
		this.menu.on( 'submit' , onSubmit ) ;
		
		/*
		term( '\n' ) ;
		
		if ( undecidedRoleIds.length && this.roles.length > 1 )
		{
			charCount = 9 ;
			str = undecidedRoleIds.map( e => this.roles.get( e ).label ).join( ', ' ) ;
			charCount += str.length ;
			this.rewritableLines += Math.floor( charCount / term.width ) + 2 ;
			term( '^-Waiting: ^/%s\n\n' , str ) ;
		}
		
		if ( timeout !== null ) { drawTimer() ; }
		*/
	} ;
	
	draw() ;
	
	this.redrawNextList = () => {
		console.error( '\nTODO: redrawNextList\n' ) ;
		//draw() ;
	} ;
	
	if ( timeout !== null ) { timer = setInterval( drawTimer , 1000 ) ; }
	
	var clear = () => {
		this.menu.stop() ;
		term.eraseLine( '\n' ).eraseLine() ;
		this.clearNextListCallback = null ;
		if ( timer !== null ) { clearInterval( timer ) ; timer = null ; }
		//term.off( 'key' , onKey ) ;
	} ;
	
	/*
	var onKey = ( name , matches , data ) => {
		
		if ( this.inChat ) { return ; }
		
		if ( nexts.length === 1 && ( name === ' ' || name === 'ENTER' ) )
		{
			term.column( 1 ).eraseLine() ;
			clear() ;
			this.bus.emit( 'selectNext' , 0 ) ;
		}
		else if ( nexts.length > 1 && data.codepoint >= 0x61 && data.codepoint <= max )
		{
			term.column( 1 ).eraseLine() ;
			nextIndex = data.codepoint - 0x61 ;
			clear() ;
			this.bus.emit( 'selectNext' , nextIndex ) ;
		}
		else if ( name === 'ESC' || name === 'DELETE' || name === 'BACKSPACE' )
		{
			term.column( 1 ).eraseLine() ;
			clear() ;
			this.bus.emit( 'selectNext' , null ) ;
		}
	} ;
	*/
	
	this.clearNextListCallback = clear ;
	//term.on( 'key' , onKey ) ;
} ;



// 'nextTriggered' event
UI.nextTriggered = function nextTriggered( nextIndex , roleIds , special )
{
	this.afterNext = false ;
	
	//console.warn( 'nextTriggered received:' , this.nexts , "\n\n\n\n\n" ) ;
	
	if ( this.inChat ) { this.blinkChat() ; }
	
	if ( this.clearNextListCallback ) { this.clearNextListCallback() ; }
	
	if ( this.nexts.length > 1 || this.nexts[ nextIndex ].label )
	{
		term.bold.cyan( "> %s" , this.nexts[ nextIndex ].label ) ;
		
		if ( this.roles.length > 1 && Array.isArray( roleIds ) && roleIds.length )
		{
			term.dim.italic( " %s" , roleIds.map( e => this.roles.get( e ).label ).join( ', ' ) ) ;
		}
		
		switch ( special )
		{
			case 'auto' :
				term.red( ' AUTO' ) ;
				break ;
		}
		
		term( '\n\n\n' ) ;
	}
} ;



// External raw output (e.g. shell command stdout)
UI.extOutput = function extOutput( output )
{
	if ( this.inChat ) { this.blinkChat() ; }
	process.stdout.write( output ) ;
} ;



// External raw error output (e.g. shell command stderr)
UI.extErrorOutput = function extErrorOutput( output )
{
	if ( this.inChat ) { this.blinkChat() ; }
	process.stderr.write( output ) ;
} ;



// Text input field
UI.textInput = function textInput( label , grantedRoleIds )
{
	if ( this.inChat ) { this.closeChat() ; }
	if ( label ) { term( label ) ; }
	
	var options = {
		//style: term.bgBrightBlack ,
		history : this.inputHistory ,
		//autoComplete: autoComplete ,
		//autoCompleteMenu: true ,
		//maxLength: 3
	} ;
	
	if ( grantedRoleIds.indexOf( this.roleId ) === -1 )
	{
		// Not granted!
		term.inverse( "YOU CAN'T RESPOND - WAIT..." )( '\n' ) ;
		return ;
	}
	
	//term.bgGray.eraseLineAfter( '> ' ) ;
	term.bold.brightWhite( '> ' ) ;
	
	term.inputField( options , ( error , input ) => {
		this.inputHistory.push( input ) ;
		term( '\n' ) ;
		if ( error ) { this.bus.emit( error ) ; }
		else { this.bus.emit( 'textSubmit' , input ) ; }
	} ) ;
} ;



UI.prototype.openChat = function openChat()
{
	// Already in the chat
	if ( this.inChat ) { return ; }
	
	this.inChat = true ;
	term.saveCursor() ;
	
	var canChat = ! this.chatConfig || ( this.roleId && this.chatConfig && this.chatConfig[ this.roleId ].write ) ;
	var canAct = this.roleId && this.actionConfig && ! this.actionConfig.disabled ;
	
	if ( ! canChat && ! canAct )
	{
		term.moveTo( 1 , 1 ).eraseLine().red.inverse( "CAN'T CHAT OR ACT NOW!" ) ;
		
		setTimeout( () => {
			// The chat may have been closed, before the timeout...
			if ( ! this.inChat ) { return ; }
			
			term.moveTo( 1 , 1 ).eraseLine() ;
			term.restoreCursor() ;
			this.inChat = false ;
		} , 1000 ) ;
		
		return ;
	}
	
	term.moveTo( 1 , 1 ).eraseLine().bgBrightBlack( '> ' ) ;
	
	if ( this.chatInput )
	{
		this.chatInput.resume() ;
		this.chatInput.show() ;
		return ;
	}
	
	this.chatInput = term.inputField( { style: term.bgGray , history: this.chatHistory } , ( error , input ) => {
		this.chatHistory.push( input ) ;
		term.moveTo( 1 , 1 ).eraseLine() ;
		term.restoreCursor() ;
		this.chatInput = null ;
		this.inChat = false ;	// Set it to false, or openChat() will not open anything
		
		// Only send if there was actually some input
		if ( ! error && input )
		{
			// If it starts with a '/', this is an action
			if ( input[ 0 ] === '/' ) { this.bus.emit( 'action' , input ) ; }
			else { this.bus.emit( 'chat' , input ) ; }
		}
		
		this.openChat() ;
	} ) ;
} ;



UI.prototype.closeChat = function closeChat()
{
	// Already in the chat
	if ( ! this.inChat ) { return ; }
	
	//term.moveTo( 1 , 1 ).eraseLine() ;
	
	// .chatInput can be null, when the chat display the "can't open chat" message...
	if ( this.chatInput )
	{
		this.chatInput.pause() ;
		this.chatInput.hide() ;
	}
	
	term.moveTo( 1 , 1 ).eraseLine() ;
	term.restoreCursor() ;
	this.inChat = false ;
} ;



// Make sure the chat doesn't get in the way, when outputing something is needed...
UI.prototype.blinkChat = function blinkChat()
{
	// Already in the chat
	if ( ! this.inChat || this.isBlinkingChat ) { return ; }
	
	this.isBlinkingChat = true ;
	
	//term.moveTo( 1 , 1 ).eraseLine() ;
	this.chatInput.pause() ;
	this.chatInput.hide() ;
	//term.moveTo( 1 , 1 ).eraseLine() ;
	term.restoreCursor() ;
	
	process.nextTick( () => {
		term.saveCursor() ;
		term.moveTo( 1 , 1 ).eraseLine().bgBrightBlack( '> ' ) ;
		this.chatInput.resume() ;
		this.chatInput.show() ;
		this.isBlinkingChat = false ;
	} ) ;
} ;



// rejoin event
UI.rejoin = function rejoin() {} ;



UI.wait = function wait( what )
{
	//term( '\n' ) ;
	if ( this.inChat ) { this.blinkChat() ; }
	
	switch ( what )
	{
		case 'otherBranches' :
			term.cyan.inverse( 'WAITING FOR OTHER BRANCHES TO FINISH...' ) ;
			this.bus.once( 'rejoin' , () => { term.column( 1 ).eraseLine() ; } ) ;
			break ;
		default :
			term.cyan.inverse( 'WAITING FOR ' + what ) ;
	}
	
	//this.rewritableLines = 2 ;
} ;



// end event
UI.end = function end( result , data )
{
	if ( this.inChat ) { this.blinkChat() ; }
	term( '\n\t\t' ) ;
	
	switch ( result )
	{
		case 'end' :
			term.bgBrightYellow.black( '>>> THE END. <<<' ) ;
			break ;
		case 'win' :
			term.bgBrightCyan.black( '>>> YOU WIN! <<<' ) ;
			break ;
		case 'lost' :
			term.bgBrightRed.black( '>>> YOU LOSE... <<<' ) ;
			break ;
		case 'draw' :
			term.bgBrightGreen.black( '>>> DRAW. <<<' ) ;
			break ;
	}
	
	term( '\n\n' ) ;
} ;



// Exit event
UI.exit = function exit( code , timeout , callback )
{
	if ( this.inChat ) { this.closeChat() ; }
	//term.restoreCursor() ;	// Don't do that, saveCursor may have been called by the previous program
	term.styleReset() ;
	term.grabInput( false ) ;
	term.column( 1 ).eraseLine() ;
	setTimeout( callback , 100 ) ;
} ;



UI.prototype.rewriteLines = function rewriteLines()
{
	if ( this.inChat ) { this.blinkChat() ; }
	term.eraseLine() ;
	for ( ; this.rewritableLines ; this.rewritableLines -- ) { term.up( 1 ).eraseLine() ; }
	term.column( 1 ) ;
} ;
