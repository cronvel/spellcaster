bob blihblih one
0\.1\.2
BOB
fuuu
one
one,two,three
zero,one,two,three,four
cat/John
echo
ls default line: one
ls default line: one
ls line: one
ls line: one
ls line: three
ls line: three
ls line: two
ls line: two
ls line: one
ls line: one
ls line: three
ls line: three
ls line: two
ls line: two
one more time: one
one more time: two
[32mThis spell is not ready yet.
[39mone more time: three
end: one
onE
two
one - un
thrEE
two - deux
three - trois
# TOC
   - [Formula & variable substitution](#formula--variable-substitution)
   - [Summon regexp](#summon-regexp)
   - ['scroll' block](#scroll-block)
   - ['summon' block and dependencies](#summon-block-and-dependencies)
   - ['foreach' block](#foreach-block)
   - ['transmute' block](#transmute-block)
   - ['transmute-file' block](#transmute-file-block)
<a name=""></a>
 
<a name="formula--variable-substitution"></a>
# Formula & variable substitution
top-level formula should be parsed into list of string, with an additionnal property 'index' equals to 0.

```js
var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;

expect( book.formulas.alert ).to.be.eql( [ 'bob' ] ) ;
expect( book.formulas.alert.index ).to.equal( 0 ) ;
expect( book.formulas.list ).to.be.eql( [ 'one' , 'two' , 'three' ] ) ;
expect( book.formulas.list.index ).to.equal( 0 ) ;
```

should substitute variable (aka formula) accordingly in 'scroll' block.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'kawarimi' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'kawarimi' ) ).to.be( 'bob blihblih one\n' ) ;
		done() ;
	} ) ;
} ) ;
```

should substitute variable (aka formula) using filters.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'kawarimi-filter' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'kawarimi-filter' ) ).to.be( '0\\.1\\.2\nBOB\nfuuu\n' ) ;
		done() ;
	} ) ;
} ) ;
```

<a name="summon-regexp"></a>
# Summon regexp
cast-level formula should be parsed into list of string, with an additionnal property 'index' equals to 0.

```js
var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;

book.cast( 'formula' , function( error )
{
	expect( error ).not.ok() ;
	expect( book.formulas.copy1 ).to.be.eql( [ 'one' ] ) ;
	expect( book.formulas.copy1.index ).to.equal( 0 ) ;
	expect( book.formulas.copy2 ).to.be.eql( [ 'one' , 'two' , 'three' ] ) ;
	expect( book.formulas.copy2.index ).to.equal( 0 ) ;
	expect( book.formulas.copy3 ).to.be.eql( [ 'zero' , 'one' , 'two' , 'three' , 'four' ] ) ;
	expect( book.formulas.copy3.index ).to.equal( 0 ) ;
	expect( getCastedLog( 'formula' ) ).to.be( 'one\none,two,three\nzero,one,two,three,four\n' ) ;
	done() ;
} ) ;
```

<a name="scroll-block"></a>
# 'scroll' block
should echoing echo.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'echo' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'echo' ) ).to.be( 'echo\n' ) ;
		done() ;
	} ) ;
} ) ;
```

should write a new formula with the output of an 'scroll' block.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'write-formula' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'write-formula' ) ).to.be( 'ls default line: one\nls line: one\nls line: three\nls line: two\nls line: one\nls line: three\nls line: two\n' ) ;
		done() ;
	} ) ;
} ) ;
```

<a name="summon-block-and-dependencies"></a>
# 'summon' block and dependencies
<a name="foreach-block"></a>
# 'foreach' block
should iterate through a variable as a list.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'foreach' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'foreach' ) ).to.be( 'one more time: one\none more time: two\none more time: three\nend: one\n' ) ;
		done() ;
	} ) ;
} ) ;
```

<a name="transmute-block"></a>
# 'transmute' block
should execute a regular expression on a variable as a list.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'transmute' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'transmute' ) ).to.be( 'onE\ntwo\nthrEE\n' ) ;
		done() ;
	} ) ;
} ) ;
```

should iterate through a variable as a list using coupled variable substitution.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'foreach-coupled' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'foreach-coupled' ) ).to.be( 'one - un\ntwo - deux\nthree - trois\n' ) ;
		done() ;
	} ) ;
} ) ;
```

<a name="transmute-file-block"></a>
# 'transmute-file' block
should execute a regular expression to a variable as a list.

```js
cleanup( function() {
	
	var book = new spellcast.Book( fs.readFileSync( 'spellbook' ).toString() ) ;
	
	book.cast( 'transmute-file' , function( error )
	{
		expect( error ).not.ok() ;
		expect( getCastedLog( 'transmute-file' ) ).to.be( 'onE two thrEE\n' ) ;
		done() ;
	} ) ;
} ) ;
```

