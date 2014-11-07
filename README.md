# Harmony-Explorer

Harmony-Explorer lets you explore the harmonies of musical keys on a visual directed graph.
More complex chords can be added by building them in the left panel.
Additional harmony octaves can be reached using the harmony buttons in the right panel.
MIDI supported by [MIDI.js](https://github.com/mudcube/MIDI.js) submodule.
Soundfonts supported by [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) submodule.

## In Development

* Ability to record, edit and play back short chord progressions
* Support for the additional instruments

## To Do

* all these globals (and functions) should be encapsulated into a singleton object (and maybe a chord object as well)
* collapse the paired arrays --> 2-dimensional, notes 3
* split out the decoding of a harmony chord from the setting of the globals
* harmonies are order-specific and need to be built from base (0th) note up through the pattern
* handle inversion - inverting the chord reverses (CEG = GEC) and creates the chord moving up through the chord
* node graph should be canvas elements
* VI in image should be vi
* IV back and forth to vi?
* I <--> V also

## License

[GNU General Public License](http://www.gnu.org/licenses/)

&copy; Copyright 2014 Dave Corboy <dave@corboy.com>

This file is part of Harmony-Explorer.

Harmony-Explorer is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Harmony-Explorer is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

If you did not receive a copy of the GNU General Public License
along with Harmony-Explorer, see <http://www.gnu.org/licenses/>.