/*
	Spellcast
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var async = require( 'async-kit' ) ;
var ClassicTag = require( 'kung-fig' ).ClassicTag ;



function MessageTag( tag , attributes , content , proxy , shouldParse )
{
	var self = ( this instanceof MessageTag ) ? this : Object.create( MessageTag.prototype ) ;
	ClassicTag.call( self , 'message' , attributes , content , proxy , shouldParse , ':' ) ;
	return self ;
}

module.exports = MessageTag ;
MessageTag.prototype = Object.create( ClassicTag.prototype ) ;
MessageTag.prototype.constructor = MessageTag ;
MessageTag.proxyMode = 'parent' ;



MessageTag.prototype.run = function run( book , execContext , callback )
{
	var self = this ;
	
	//book.emit( 'message' , this.content ) ;
	//return ;
	
	if ( ! Array.isArray( this.content ) )
	{
		this.sendMessage( book , this.content , callback ) ;
		return ;
	}
	
	async.foreach( this.content , function( message , foreachCallback ) {
		self.sendMessage( book , message , foreachCallback ) ;
	} )
	.exec( callback ) ;
} ;



MessageTag.prototype.sendMessage = function sendMessage( book , message , callback )
{
	var text , options ;
	
	if ( message && typeof message === 'object' && message.__isDynamic__ ) { message = message.getFinalValue() ; }
	
	if ( message && typeof message === 'object' )
	{
		options = message ;
		text = message.text ;
	}
	else
	{
		text = message ;
	}
	
	if ( text && typeof text === 'object' && text.__isDynamic__ ) { text = text.getFinalValue() ; }
	
	if ( typeof text !== 'string' ) { callback( new TypeError( '[message] tag text should be a string' ) ) ; return ; }
	
	book.emit( 'message' , text , options , callback ) ;
} ;

