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



var kungFig = require( 'kung-fig' ) ;
var VarTag = kungFig.VarTag ;

var tree = require( 'tree-kit' ) ;

var log = require( 'logfella' ).global.use( 'spellcast' ) ;
var scriptLog = require( 'logfella' ).userland.use( 'script' ) ;



function PrependTag( tag , attributes , content , shouldParse )
{
	var self = ( this instanceof PrependTag ) ? this : Object.create( PrependTag.prototype ) ;
	
	VarTag.call( self , 'prepend' , attributes , content , shouldParse ) ;
	
	Object.defineProperties( self , {
		ref: { value: self.attributes , writable: true , enumerable: true }
	} ) ;
	
	//log.debug( "Prepend tag: %I" , self ) ;
	
	return self ;
}

module.exports = PrependTag ;
PrependTag.prototype = Object.create( VarTag.prototype ) ;
PrependTag.prototype.constructor = PrependTag ;
//PrependTag.proxyMode = 'parent' ;



PrependTag.prototype.run = function run( book , ctx , callback )
{
	var value = this.ref.get( ctx.data ) ;
	
	if ( Array.isArray( value ) )
	{
		value.unshift( this.getRecursiveFinalContent( ctx.data ) ) ;
	}
	else
	{
		// Warn, but do nothing at all
		scriptLog.warning( '[prepend] tag used on a non-array value' ) ;
	}
	
	callback() ;
} ;

