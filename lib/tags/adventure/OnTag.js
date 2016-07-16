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



// Cover [on] *AND* [once] tags

var kungFig = require( 'kung-fig' ) ;
var LabelTag = kungFig.LabelTag ;
var TagContainer = kungFig.TagContainer ;

var log = require( 'logfella' ).global.use( 'spellcast' ) ;



function OnTag( tag , attributes , content , proxy , shouldParse )
{
	var self = ( this instanceof OnTag ) ? this : Object.create( OnTag.prototype ) ;
	
	LabelTag.call( self , tag === 'once' ? 'once' : 'on' , attributes , content , proxy , shouldParse ) ;
	
	if ( ! ( content instanceof TagContainer ) )
	{
		throw new SyntaxError( "The 'on' tag's content should be a TagContainer." ) ;
	}
		
	Object.defineProperties( self , {
		event: { value: self.attributes , enumerable: true } ,
		once: { value: tag === 'once' , enumerable: true } ,
	} ) ;
	
	return self ;
}

module.exports = OnTag ;
OnTag.prototype = Object.create( LabelTag.prototype ) ;
OnTag.prototype.constructor = OnTag ;
OnTag.proxyMode = 'inherit+links' ;



OnTag.prototype.run = function run( book , execContext , callback )
{
	book.apiOn( this.event , this , execContext , { once: this.once } ) ;
	callback() ;
} ;



OnTag.prototype.exec = function exec( book , options , execContext , callback )
{
	var self = this ;
	
	this.proxy.data.this = {
		event: this.event ,
		data: options.data
	} ;
	
	book.run( this.content , execContext , callback ) ;
} ;
