
# Spellcast Builder tags

## formula

The `formula` tag stores data that can be used later for variable substitution.

* **Content:** an object of data.



## spell

The `spell` tag defines a *spell*, a set of actions that can be triggered by a spellcast command
(e.g. entering `spellcast <spell name>` in the shell).

* **Attributes:** `string` the name of the spell. Should be unique.

* **Content:** a TagContainer, containing tags to execute.



## summoning

The `summoning` tag defines how to *summon* a file or a group of files matching a regular expression, and contains
a set of actions to produce the file.

Summoning a file won't do anything if the file exists and is up to date.
That's the main difference between a *spell* and a *summoning*.

* **Attributes:** `string` or `regex` the name of the file to build, or a regular expression describing its name and path.

* **Content:** a TagContainer, containing tags to execute to produce the file.



## scroll

Execute shell commands.

* **Attributes:**
	* silence: dispell all output to stdout
	* amnesia: dispell all output to log files
	* silence `boolean` if set, do not output command's output
	* amnesia `boolean` do not store the command output
	* parallel `boolean` or `integer` how many command line should run in parallel, if `true` they all run in parallel
	* ignore `boolean` if set, execution of command continue even if one of them returns an error code (i.e. return a non-zero value)
	* write-formula: this specify a variable name (aka a *formula*) which will be populated by each line of the output
	  of this scroll block, the formula is used as a list
	* [deprecated?] only-index: in conjunction with write-formula, this get only the first part of the splitted output
	  and put it in this formula's index, it can be a number or a third party formula

* **Content:** an array of strings, command-line to execute.
