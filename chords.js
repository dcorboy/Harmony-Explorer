// chords.js
// JavaScript functionality for creating a chord & harmony explorer.
//
// Copyright 2014 Dave Corboy <dave@corboy.com>
//
// This file is part of Harmony-Explorer.
// Harmony-Explorer lets you explore the harmonies of musical keys
// on a visual directed graph.
//
// Harmony-Explorer is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Harmony-Explorer is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// If you did not receive a copy of the GNU General Public License
// along with Harmony-Explorer, see <http://www.gnu.org/licenses/>.

// FIXME
// collapse the paired arrays --> 2-dimensional, notes 3
// split out the decoding of a harmony chord from the setting of the globals
// harmonies are order-specific and need to be built from base (0th) note up through the pattern
// handle inversion - inverting the chord reverses (CEG = GEC) and creates the chord moving up through the chord
// node graph should be canvas elements
// VI in image should be vi
// IV back and forth to vi?
// I <--> V also
// Convert gChord to an object prototype

var notes = ['C','C# / Db','D','D# / Eb','E','F','F# / Gb','G','G# / Ab','A','A# / Bb','B'];
var disp = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var chordnames = ['Major','Major 7th','Major 9','Major 11','Major 13','Major 7th add 11','Major 7th add 13','Major 7th Sus4','Major 9 Sus4','Minor','Minor 6','Minor 7th','Minor 9','Minor 11','Minor 13','Minor add 9','Minor 6 add 9','Minor 7th add 11','Minor 7th add 13','Minor Major 7th','Minor Major 9','Minor Major 11','Minor Major 13','Minor Major 7th add 11','Minor Major 7th add 13','Dominant 7th','Dominant 7th add 11','Dominant 7th add 13','Sus 2','Sus 4','6sus4','7sus4','9sus4'];
var chordformulas = ['0,4,7','0,4,7,11','0,2,4,7,11','0,2,4,5,7,11','0,2,4,7,9,11','0,4,5,7,11','0,4,7,9,11','0,5,7,11','0,2,5,7,11','0,3,7','0,3,7,9','0,3,7,10','0,2,3,7,10','0,2,3,5,7,10','0,2,3,7,9,10','0,2,3,7','0,2,3,7,9','0,3,5,7,10','0,3,7,9,10','0,3,7,11','0,2,3,7,11','0,2,3,5,7,11','0,2,3,7,9,11','0,3,5,7,11','0,3,7,9,11','0,4,7,10','0,4,5,7,10','0,4,7,9,10','0,2,7','0,5,7','0,5,7,9','0,5,7,10','0,2,5,7,10'];

// harmonyformulas represents the harmony encodings
//   e.g., ['0,2,4','1,3,5','2,4,6', ...
//     note: h4 is '3,5,7', not '3,5,0'
//   Past the basic harmonies, we need to encode # and b
//     so 5/5 is '1,#3,5'
//     5/4 is '1,3,5,b7'
//     etc.
var harmonynames = ['I','ii','iii','IV','V','vi','vii','V/vi','V/V','V7/IV','V/ii','V/iii'];
var harmonyformulas = ['0,2,4','1,3,5','2,4,6','3,5,7','4,6,8','5,7,9','6,8,10','2,#4,6','1,#3,5','0,2,4,b7','5,#7,9','6,#8,#10'];
var scales = [[0,2,4,5,7,9,11], [0,2,3,5,7,8,10]];	// intervals of the major and minor scales
var harmonychordmap = [[11,225,121,335], [468,280,578,373], [680,225,790,335], [468,187,578,280],
						[250,187,360,280],[327,56,437,166],[250,280,360,373],[230,104,300,174],
						[347,385,417,455],[557,104,627,174],[557,385,627,455],[710,76,780,146]];

MIDI.USE_XHR = false;	// allows MIDI.js to run from file:

var gChord = {
	name: '',			// chord name
	key: 0,				// root note of current key where C=0 and B=11
	scale: 0,			// index into scales for current mode (0=major, 1=minor)
	harmony: 0,			// index into harmony 
	harmonyOctave: 0,	// octave number (middle C starts octave 4)
	chord: [],			// array of MIDI note numbers representing current chord

    fullName : function(c) {
       return this.key + " " + this.scale;
    },

	// changeChord (root, chord_fmla)
	// root - root note where C=0 and B=11
	// chord_fmla - a chord formula as semitones from the root 
	//
	// Sets the global chord to the chord defined by the root note
	// and the chord formula
	changeChord : function  (root, chord_fmla) {
		var chordformula = chord_fmla.split(',');
		var output = '';
		
		gChord.chord.length = 0;	// reset chord array

		for (var i=0; i<chordformula.length; i++) {
			var note = root + parseInt(chordformula[i]);
			output += (disp[note%12] + ' '); 
			gChord.chord.push(note+60);	// FIXME adjust for octave later
		}
		document.getElementById("chordoutput").innerHTML = output;
	},

	//sets chord from all the other member vars
	// harmony - indexes into harmonyformulas for a harmony coding
	//   ['0,2,4','1,3,5','2,4,6', ...
	//     note: h4 is '3,5,7', not '3,5,0'
	//   Past the basic harmonies, we need to encode # and b
	//     so 5/5 is '1,#3,5'
	//     5/4 is '1,3,5,b7'
	// octave - defines the octave above/below middle C
	//
	// Decodes the harmony chord based on the harmony formulas,
	// the key, scale and octave
	setHarmonyChord : function() {
		var harmonyformula = harmonyformulas[this.harmony].split(',');
		
		this.chord.length = 0;	// reset chord array

		for (var i=0; i<harmonyformula.length; i++) {
			var n;
			var str = harmonyformula[i];
			var a = (str.charAt(0) == 'b') ? -1 : ((str.charAt(0) == '#') ? 1 : 0);	// set a to +1 for '#' and -1 for 'b'

			if (a) n = parseInt(str.slice(1));
			else n = parseInt(str);
			// console.log('formula extraction: ', n, a);

			var idx = n%7;
			var r = (n/7) >> 0;
			// console.log('index extraction: ', idx, r);

			var note = ((this.harmonyOctave + 1) * 12) + this.key + scales[this.scale][idx] + (r * 12) + a;
			// console.log('note: ', note);
			
			this.chord.push(note);
		}
	},

	// changeKey (root, major)
	// root - string representation of a root note where C=0 and B=11
	// scale - index into scales indicating major or minor key (0=major, 1=minor)
	//
	// Sets the global key to the root note
	// and sets the global scale to indicate either major or minor intervals.
	changeKey : function(key, scale) {
		this.key = key;
		this.scale = scale;
		gChord.setHarmonyChord();	//FIXME kinda makes the object useless beyond the encapsulation
	},

	// changeHarmony(harmony, octave)
	// harmony - indexes into harmonyformulas for a harmony coding
	//   ['0,2,4','1,3,5','2,4,6', ...
	//     note: h4 is '3,5,7', not '3,5,0'
	//   Past the basic harmonies, we need to encode # and b
	//     so 5/5 is '1,#3,5'
	//     5/4 is '1,3,5,b7'
	// octave - defines the octave above/below middle C
	//
	// Decodes the harmony chord based on the harmony formula,
	// the global key gChord.key and the global major/minor scale index gChord.scale
	// then plays the chord.
	changeHarmony : function(harmony, octave) {
		this.harmony = harmony;
		this.harmonyOctave = octave;
		gChord.setHarmonyChord();
	},

	// play()
	// Plays the current chord
	// Basically a pass-through to MIDI.js.
	play : function () {
		var delay = 0;
		var velocity = 127; // how hard the note hits
		MIDI.setVolume(0, 127);

		MIDI.chordOn(0, this.chord, velocity, delay);
	}

};

function playChord() {
	gChord.play();
}

function chgChord(root, chord) {
	gChord.changeChord (parseInt(root), chord)
}

function chgKey(root, scale) {
	var type = typeof root;
	gChord.changeKey(parseInt(root), scale);
}

function recordChord(chord) {
	var parent = document.getElementById('recording');
	var child = document.createElement('div');
}

/* 		var child = document.createElement('div');
		child.id = 'harmonies'+j;
		child.className = 'harmonies';

		var label = document.createElement('label');
		//label.id = 'harmonies'+j;
		label.className = 'hmy-label';
		label.innerHTML = 'C'+(5-j)+': ';	// really, this all needs to be octave generalized
		child.appendChild(label); */

// selectHarmony(harmony, octave)
// harmony - indexes into harmonyformulas for a harmony coding
// octave - defines the octave (octave 4 starts with middle C)
//
// Changes the chord harmony and plays the chord.
function selectHarmony(harmony, octave) {
	var name = disp[gChord.key]+(gChord.scale ? 'm' : '')+octave+'-'+harmonynames[harmony];
	document.getElementById("harmonyoutput").innerHTML = name;
	// maybe record
	gChord.changeHarmony(harmony, octave);
	gChord.play();
}

function startup() {
	// set up the UI and whatnot

	var parent = document.getElementById('keyroot');
	var len = notes.length;
	var chord;

	// create two sets of note selection controls
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('option')
		elem.value = i;
		elem.innerHTML = notes[i];
		parent.appendChild(elem);
	}
	parent.selectedIndex = "0";

	// create the chord selection control
	parent = document.getElementById('chord');
	len = chordnames.length;
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('option')
		elem.value = chordformulas[i];
		elem.innerHTML = chordnames[i];
		if (i == 0) {
			elem.selected = "selected";
			chord = elem.value;
		}
		parent.appendChild(elem);
	}

	// create the harmony chord buttons
	parent = document.getElementById('harmonybuttons');
	for (var i = 0; i < 3; i++) {		// three rows of harmony buttons, starting at C3
		var child = document.createElement('div');
		child.id = 'harmonies'+i;
		child.className = 'harmonies';

		var label = document.createElement('label');
		//label.id = 'harmonies'+i;
		label.className = 'hmy-label';
		label.innerHTML = 'C'+(5-i)+': ';	// really, this all needs to be octave generalized
		child.appendChild(label);

		len = harmonynames.length;
		for (var j = 0; j < len; j++) {
			var elem = document.createElement('button');
			elem.innerHTML = harmonynames[j];
			elem.setAttribute('onclick','selectHarmony('+j+', '+(5-i)+');');
			child.appendChild(elem);
		}
		parent.appendChild(child);
	}

	// create the harmony chord board
	var graphnode = document.getElementById('harmonychordgraph');
	parent = document.createElement('map');
	parent.name = "hgraphmap";
	graphnode.parentNode.insertBefore(parent, graphnode);	// create a map node and add it before the harmony chord graph

	len = harmonychordmap.length;
	for (var i = 0; i < len; i++) {
		var child = document.createElement('area');
		child.shape = 'rect';
		child.coords = '11,225,121,335';
		child.coords = harmonychordmap[i][0]+','+harmonychordmap[i][1]+','+harmonychordmap[i][2]+','+harmonychordmap[i][3];
		child.setAttribute('onclick','selectHarmony('+i+', '+4+');');
		parent.appendChild(child);
	}

	document.getElementById("modemajor").checked = true;
	chgChord('0', chord);	// C Major
	selectHarmony(0, 4)		// C Major
	gChord.play();
}

function init() {
	// load and initialize the MIDI.js plugin

	MIDI.loadPlugin({
		soundfontUrl: "./midi-js-soundfonts/FluidR3_GM/",
		instrument: "acoustic_grand_piano",
		callback: function() {
			startup();
		}
	});
}