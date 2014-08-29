/*
	The Cedric's Swiss Knife (CSK) - CSK Spellcast test suite
	
	The MIT License (MIT)
	
	Copyright (c) 2014 Cédric Ronvel 
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

/* jshint unused:false */
/* global describe, it, before, after */


var spellcast = require( '../lib/spellcast.js' ) ;
var async = require( 'async-kit' ) ;
var expect = require( 'expect.js' ) ;
var fs = require( 'fs' ) ;
var glob = require( 'glob' ) ;

// Change directory if necessary: sample files should be loaded accordingly
if ( process.cwd() !== __dirname ) { process.chdir( __dirname ) ; }





			/* Helper functions */



function cleanup( callback )
{
	var files = glob.sync( './spellcast/*/*' ) ;
	
	async.foreach( files , function( file , foreachCallback ) {
		fs.unlink( file , foreachCallback ) ;
	} )
	.parallel()
	.exec( callback ) ;
}



function getCastedLog( spell )
{
	return fs.readFileSync( '.spellcast/casted/' + spell , { encoding: 'utf8' } ) ;
}



function getFizzledLog( spell )
{
	return fs.readFileSync( '.spellcast/fizzled/' + spell , { encoding: 'utf8' } ) ;
}





			/* Tests */



describe( "Formula" , function() {
	
	it( "should be parsed into list of string, with an additionnal property 'index' equals to 0" , function() {
		var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
		
		var expected = [ 'bob' ] ;
		expected.index = 0 ;
		expect( book.formula.alert ).to.be.eql( expected ) ;
		
		var expected = [ 'one' , 'two' , 'three' ] ;
		expected.index = 0 ;
		expect( book.formula.list ).to.be.eql( expected ) ;
	} ) ;
} ) ;



describe( "'sh' block" , function() {
	
	it( "should echoing echo" , function( done ) {
		
		cleanup( function() {
			
			var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
			
			book.cast( 'echo' , function( error )
			{
				expect( error ).not.ok() ;
				expect( getCastedLog( 'echo' ) ).to.be( 'echo\n' ) ;
				done() ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "should echoing delayed-echo after one second" , function( done ) {
		
		cleanup( function() {
			
			var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
			
			book.cast( 'delayed-echo' , function( error )
			{
				expect( error ).not.ok() ;
				expect( getCastedLog( 'delayed-echo' ) ).to.be( 'delayed-echo\n' ) ;
				done() ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "should substitute variable (aka formula) accordingly" , function( done ) {
		
		cleanup( function() {
			
			var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
			
			book.cast( 'kawarimi' , function( error )
			{
				expect( error ).not.ok() ;
				expect( getCastedLog( 'kawarimi' ) ).to.be( 'bob blihblih one\n' ) ;
				done() ;
			} ) ;
		} ) ;
	} ) ;
	
	/*
	it( "should launch editor" , function( done ) {
		
		this.timeout( 100000 ) ;
		
		cleanup( function() {
			
			var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
			
			book.cast( 'editor' , function( error )
			{
				expect( error ).not.ok() ;
				//expect( getCastedLog( 'echo' ) ).to.be( 'echo\n' ) ;
				done() ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "should launch node" , function( done ) {
		
		this.timeout( 100000 ) ;
		
		cleanup( function() {
			
			var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
			
			book.cast( 'node' , function( error )
			{
				expect( error ).not.ok() ;
				//expect( getCastedLog( 'echo' ) ).to.be( 'echo\n' ) ;
				done() ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "should launch stdinout" , function( done ) {
		
		this.timeout( 100000 ) ;
		
		cleanup( function() {
			
			var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
			
			book.cast( 'stdinout' , function( error )
			{
				expect( error ).not.ok() ;
				//expect( getCastedLog( 'echo' ) ).to.be( 'echo\n' ) ;
				done() ;
			} ) ;
		} ) ;
	} ) ;
	*/
} ) ;



describe( "'foreach' block" , function() {
	
	it( "should " , function( done ) {
		
		cleanup( function() {
			
			var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
			
			book.cast( 'foreach' , function( error )
			{
				expect( error ).not.ok() ;
				expect( getCastedLog( 'foreach' ) ).to.be( 'one more time: one\none more time: two\none more time: three\n' ) ;
				done() ;
			} ) ;
		} ) ;
	} ) ;
} ) ;














	
	/*
	it( "1" , function() {
		var book = new spellcast.Book( fs.readFileSync( 'spellbook01' ).toString() ) ;
		console.log( book.formula ) ;
		console.log( book.spells.fireball ) ;
		console.log( book.spells.fireball.casting[ 0 ] ) ;
	} ) ;
	
	it( "2" , function( done ) {
		var book = new spellcast.Book( fs.readFileSync( 'spellbook01' ).toString() ) ;
		book.cast( 'fireball' , done ) ;
	} ) ;
	
	it( "3" , function( done ) {
		var book = new spellcast.Book( fs.readFileSync( 'spellbook01' ).toString() ) ;
		book.cast( 'nova' , function( error ) {
			expect( error ).to.be.ok() ;
			done() ;
		} ) ;
	} ) ;
	
	it( "4" , function( done ) {
		var book = new spellcast.Book( fs.readFileSync( 'spellbook01' ).toString() ) ;
		book.cast( 'blah' , done ) ;
	} ) ;
	
	it( "5" , function( done ) {
		var book = new spellcast.Book( fs.readFileSync( 'spellbook01' ).toString() ) ;
		book.cast( 'depend' , done ) ;
	} ) ;
	*/



