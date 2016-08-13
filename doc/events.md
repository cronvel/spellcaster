

# Events on Book instances

* ready: [state] emitted once the book is init
* exit: [completion] emitted when the the process is about to exit
* idle: [state] emitted when the core of spellcast is idling
* busy: [state] emitted when the core of spellcast is not idling
* undeadRaised (undeadList): emitted when a file or directory watched (undead mode) has changed, usually causing
  the book to reset and to run again the related action
* newClient (client): emitted when a new client is added to the book, once it emitted 'ready'
* newUser (client): emitted when a user has authenticated through a client
* removeClient (client): emitted when a client is removed from the book



# Events on Client instances

### input

* exit: [completion] emitted when the process hosting book is about to exit
* end (result, data): [state,completion] emitted once the book is finished, `result` constains the outcome for *that* client.
  It can be: *end* (end, nothing special), *win*, *lost*, *draw* (this spellbook is a game and the client win/lost or
  it was a draw game). `data` contains end of game details, depending on the spellbook (things like score, etc).
* coreMessage (message, ...): message emitted by the core of spellcast, `message` is the message and may
  contains markup and be formated with variables (printf-like)
* errorMessage (message, ...): error emitted by the core of spellcast or from anywhere else, `message` is the message and may
  contains markup and be formated with variables (printf-like)
* extOutput (raw): an external program raw output (usually on stdout)
* extErrorOutput (raw): an external program raw error output (usually on stderr)

* message (text, options): [completion] message emitted by the book, `text` contains the message and may contains markup,
  if `options` is set, it is an object contains details about the message. They may or may not be implemented, depending
  on the client. Available options:
	* next `boolean` if true, the message wait for the user acknowledgement
	* slowTyping `boolean` if true, the message is diplayed letter by letter
	* image `url` if set, the message as an image related to the text, it may be a portrait of the speaker or an image
	  of what is described
	* sound `url` if set, a sound that should be played along with the message
* textInput (label, grantedRoleIds): the book require that the user enter a text, `label` is the text describing what is required,
  the client response should emit a `textSubmit` event, `grantedRoleIds` is an array of role's ID, roles that can respond.

* user (userObject): this contains the user related to the client. Argument `userObject` is an object containing
  at least those properties:
	* id `string` it's the client ID for THIS SESSION
	* name `string` if set, the role is currently taken by this user

* userList (users): this contains the  list of connected users. Argument `users` is an array of object
  containing those users, where:
	* id `string` it's the client ID for THIS SESSION
	* name `string` if set, the role is currently taken by this user

* roleList (roles, unassignedClients , assigned): this give the list of roles that should be chosen by each client.
  Argument `assigned` is a boolean. If false, some clients still need to choose a role, sending a `selectRole` event.
  If true, all clients have chosen their role, the game is about to start, and `selectRole` events are ignored.
  Argument `unassignedUsers` is an array of client ID names that hasn't chosen a role yet.
  Argument `roles` is an array of object containing those roles, where:
	* id `string` contains the unique ID of this role
	* label `string` contains the text describing the role
	* clientId `null` or `string` if not null, it's the client ID of the user holding this role

* enterScene: the book enter a new scene
* leaveScene: the book is leaving the current scene
* nextList (nexts, grantedRoleIds, undecidedRoleIds, timeout, isUpdate): users should make a choice between multiple
  alternatives, `nexts` is an array of object containing those alternatives, where:
	* label `string` contains the text describing the choice
	* image `url` if set, the choice as an image that would usually be displayed as an icon
	* roleIds `array` of role's IDs, if not null, it's the client ID of the user holding this role
  Once the user has selected a choice, the client should emit a `selectNext` event.
  Argument `isUpdate` is a boolean, it is true if the provided *next list* is an update of the previous one (i.e. it is not a new
  choice to make, but an update of the values of the current choice, e.g. when a choice get a vote, etc).
  `undecidedRoleIds` is a array of role's IDs that hasn't chosen anything yet.
  `timeout` is the time in ms before the vote finish.
  `grantedRoleIds` is an array of role's ID, roles that can select a response (TODO).
* nextTriggered (nextIndex, roleIds, special): a next action was triggered, `nextIndex` contains its index in the
  `nextList` event's argument `nexts`, and `roleIds`, if not null, is an array of IDs of roles that activated it (if relevant),
  provided in the last `roleList` event, in the `roles` argument. The last argument `special`, if set, it contains a code:
  special trigger conditions. Codes:
	* auto: next was triggered automatically (e.g. by an [auto] tag timeout)

* split: roles/players are splitted in 2 or more groups
* rejoin: roles/players are joined again after they have been splitted (see the `split` event)

* wait (what): currently waiting for something to happen, `what` is the code (`string`), where:
	* otherBranches: roles were splitted into multiple branches, and the client must wait for other branches to finish,
	  roles are done waiting once the 'join' event is received.

* image (data): instruct the client (if it is capable) to set an image as the scene image. Argument `data` is an object, where:
	* url `string` (optional) if set this is the URL of the image, else the client *MAY* display a default image if any
	* position `string` (optional) is one of 'left' or 'right', indicating if the image should be on the left or on the right
	* origin `string` (optional) indicating how the image should be centered. One of 'center', 'top', 'bottom', 'left', right', ...

* music (data): instruct the client (if it is capable) play a music as the scene music. Argument `data` is an object, where:
	* url `string` (optional) if set this is the URL of the music to play, else the client should stop playing music
  There is only one music that must be played at any time, so a music replace another.

* sound (data): instruct the client (if it is capable) play a sound right now. Argument `data` is an object, where:
	* url `string` this is the URL of the sound to play
  Multiple sounds may be played at any time. If the client supports sounds, it is recommended to support at least 2 channels.

* chatConfig (configObject): [state] this pass the chat status for each roles. Argument `configObject` is an object, where keys
  are existing role IDs, and value is an object, where:
	* active: `boolean` true if the role can chat



### output

* ready: [state] emitted once the client is init
* textSubmit (text): the text the user submit in response of a `textInput` event

* chat (text): the text sent by a player/role as a chat message. If the role can chat, it will be sent to all player in
  a message event.

* selectRole (index): in response of a `roleList` event, it contains the index of the role the current client want
  to be assigned to, if `index` is `null`, the client is unassigned to any role

* selectNext (index): in response of a `nextList` event, it contains the index of the item selected by the user

* authenticate (data): authenticate a user. WIP API.
