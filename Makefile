
# This Makefile has been automatically generated by Spellcast.
# See: https://www.npmjs.org/package/spellcast

test:
	spellcast test

README.md:
	spellcast README.md

# Make every rules 'PHONY' rules, let Spellcast handle dependencies and everything else.
.PHONY: test README.md

