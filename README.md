# Harmony-Explorer

Harmony-Explorer is a JavaScript application that lets you explore harmonies
and chords using a visual directed graph.

## Motivation

Composing a song starts with some basic parts, among them are chord progressions. I can't
remember all the harmonies of the different keys, making it difficult to try different keys
and chords.

With Harmony-Explorer, you can simply click around the seven main harmonies of any key to
experiment with different progressions. Extended harmonies can also be reached using the
chord graph and more complex chords can selected through the UI.

## Screenshot

![Alt text](screenshot.png?raw=true "Harmony-Explorer screenshot")

## Installation

MIDI is supported by the [MIDI.js](https://github.com/mudcube/MIDI.js) submodule.

Soundfonts are supported by the [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) submodule.

To properly install these submodules, on version 1.6.5 of Git and later, you can simply use:

``` bash
git clone --recursive https://github.com/dcorboy/Harmony-Explorer.git
```

For existing repos or older versions of Git, use

``` bash
cd MIDI.js
git submodule update --init
cd ../midi-js-soundfonts
git submodule update --init
```

## Usage

Play the current chord with the &#x266c; button. Chord name and notes are displayed under the Chord selection box.

Click on the colored graph below the main UI to follow the general progression of chords in C-Major (the default).

The **Shift** key will raise the chord an octave while the **Ctrl** key will lower the chord an octave.

Choose a different root note from the **Key** selection box on the top-left and either **Major** or
**Minor** from the radio buttons below it.

More complex variations of the root note can be selected from the **Chord** selection box on the top-right.

Clicking the keyboard with the **Alt/Option** key pressed will add notes to the current chord. Clicking without
**Alt/Option** will start a new custom chord.

#### Recording

* To record the current chord, click the &#x2617; &#x266c; button
* To record a rest measure, click the &#x2617; &#x2300; button
* To play back the recorded chords, click the &#x25b6 button
* To delete the last recorded chord, click the &#x232b; button
* To clear the current recording, click the &#x274c; button
* Toggle the record mode by clicking the &#x26ab; button. In record mode, all chords played will be recorded.
	
## In Development

* Support for some additional instruments
* Sample chord progressions
* Tempo control

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