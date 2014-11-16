// chords.js
// JavaScript functionality for creating a harmony & chord explorer.
//
// Copyright 2014 Dave Corboy <dave@corboy.com>
//
// This file is part of Harmony-Explorer.
// Harmony-Explorer is a JavaScript application that lets you explore harmonies
// and chords using a visual directed graph.
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
// collapse the notes stuff into a multi-dimensional array
// handle inversion - inverting the chord reverses (CEG = GEC) and creates the chord moving up through the chord
// node graph should be canvas elements
// Convert gChord to an object prototype
// needs a better handling of chord 'types' (harmony vs. chord.. and user-defined)
//   -- needs get function for type or some way to color the chord properly
// Allow the keyboard to create a new chord
// encapsulate keyboard as object
// octave setting
// tile UI sizeToContent
// tempo setting?
// examples/instructions


var notes = ['C','C# / Db','D','D# / Eb','E','F','F# / Gb','G','G# / Ab','A','A# / Bb','B'];
var disp = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var chordnames = ['Major','Major 7th','Major 9','Major 11','Major 13','Major 7th add 11','Major 7th add 13','Major 7th Sus4','Major 9 Sus4','Minor','Minor 6','Minor 7th','Minor 9','Minor 11','Minor 13','Minor add 9','Minor 6 add 9','Minor 7th add 11','Minor 7th add 13','Minor Major 7th','Minor Major 9','Minor Major 11','Minor Major 13','Minor Major 7th add 11','Minor Major 7th add 13','Dominant 7th','Dominant 7th add 11','Dominant 7th add 13','Sus 2','Sus 4','6sus4','7sus4','9sus4'];
var chordformulas = ['0,4,7','0,4,7,11','0,2,4,7,11','0,2,4,5,7,11','0,2,4,7,9,11','0,4,5,7,11','0,4,7,9,11','0,5,7,11','0,2,5,7,11','0,3,7','0,3,7,9','0,3,7,10','0,2,3,7,10','0,2,3,5,7,10','0,2,3,7,9,10','0,2,3,7','0,2,3,7,9','0,3,5,7,10','0,3,7,9,10','0,3,7,11','0,2,3,7,11','0,2,3,5,7,11','0,2,3,7,9,11','0,3,5,7,11','0,3,7,9,11','0,4,7,10','0,4,5,7,10','0,4,7,9,10','0,2,7','0,5,7','0,5,7,9','0,5,7,10','0,2,5,7,10'];

// harmonyformulas represents the harmony names[0], encodings[1] and graphmap[2]
// encodings[0]: 'name'
// encodings[1]:
//   e.g., ['0,2,4','1,3,5','2,4,6', ...
//     note: h4 is '3,5,7', not '3,5,0'
//   Past the basic harmonies, we need to encode # and b
//     so 5/5 is '1,#3,5'
//     5/4 is '1,3,5,b7'
//     etc.
// encodings[3]: [x0, y0, x1, y1]
var harmonies = [
				['I','0,2,4',[11,225,121,335]],
				['ii','1,3,5',[468,280,578,373]],
				['iii','2,4,6',[680,225,790,335]],
				['IV','3,5,7',[468,187,578,280]],
				['V','4,6,8',[250,187,360,280]],
				['vi','5,7,9',[327,56,437,166]],
				['vii','6,8,10',[250,280,360,373]],
				['V/ii','5,#7,9',[557,385,627,455]],
				['V/iii','6,#8,#10',[710,76,780,146]],
				['V7/IV','0,2,4,b7',[557,104,627,174]],
				['V/V','1,#3,5',[347,385,417,455]],
				['V/vi','2,#4,6',[230,104,300,174]]];
				
var scales = [[0,2,4,5,7,9,11], [0,2,3,5,7,8,10]];	// intervals of the major and minor scales

MIDI.USE_XHR = false;	// allows MIDI.js to run from file. Remove this line if publishing to a server.

var gChord = new Chord();

function Chord() {
	var self = this;
	var key = 0;			// root note of current key where C=0 and B=11
	var scale = 0;			// index into scales for current mode (0=major; 1=minor)
	var chordtype = 0;		// positive values index into harmony names/formulas; negative values index into chord names/formulas(-1)
	var octave = 0;			// octave number (middle C starts octave 4)

	this.chord = [];		// array of MIDI note numbers representing current chord
	this.name = '';			// chord name
	this.notes = '';		// chord note names

	// Private Members

	// setExtChord(chord)
	// chord - index into the chordformula array for a chord encoding
	//
	// Decodes the extended chord based on the chord formulas,
	// the key, scale and octave
	function setExtChord(chord) {
		var chordformula = chordformulas[chord].split(',');

		self.name = disp[key]+octave+' '+chordnames[chord];	// set chord name		
		self.chord.length = 0;	// reset chord array
		self.notes = '';

		for (var i=0; i<chordformula.length; i++) {
			var note = key + parseInt(chordformula[i]);
			self.notes += (disp[note%12] + ' '); 
			self.chord.push(note+60);	// FIXME adjust for octave later
		}
	}

	// setHarmonyChord(harmony)
	// harmony - indexes into harmonies[harmony][1] for a harmony coding
	//   ['0,2,4','1,3,5','2,4,6', ...
	//     note: h4 is '3,5,7', not '3,5,0'
	//   Past the basic harmonies, we need to encode # and b
	//     so 5/5 is '1,#3,5'
	//     5/4 is '1,3,5,b7'
	//
	// Decodes the harmony chord based on the harmony formulas,
	// the key, scale and octave
	function setHarmonyChord(harmony) {
		var harmonyformula = harmonies[harmony][1].split(',');

		self.name = disp[key]+(scale ? 'm' : '')+octave+'-'+harmonies[harmony][0];	// set chord name		
		self.chord.length = 0;	// reset chord array
		self.notes = '';

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

			var note = ((octave + 1) * 12) + key + scales[scale][idx] + (r * 12) + a;
			// console.log('note: ', note);

			self.notes += (disp[note%12] + ' '); 			
			self.chord.push(note);
		}
	}

	// setChord()
	//
	// Determines how to set the current chord based on member variables
	// positive values index into harmony names/formulas, negative values index into chord names/formulas(-1)
	function setChord() {
		if (chordtype >= 0)
			setHarmonyChord(chordtype);
		else
			setExtChord(-chordtype - 1);
	};

	// changeKey(newroot)
	// newroot - string representation of a root note where C=0 and B=11
	//
	// Sets key to the root note
	this.changeKey = function(newkey) {
		key = newkey;
		setChord();
	};

	// changeScale(newscale)
	// newscale - index into scales indicating major or minor key (0=major, 1=minor)
	//
	// Sets scale to indicate either major or minor intervals.
	this.changeScale = function(newscale) {
		scale = newscale;
		setChord();
	};

	// changeOctave(newoctave)
	// newoctave - defines the octave where middle C = 4
	//
	// Changes octave selection and sets the chord
	this.changeOctave = function(newoctave) {
		octave = newoctave;
		setChord();
	};

	// changeHarmony(harmony)
	// harmony - indexes into harmonies[harmony][1] for a harmony coding
	//
	// Changes harmony selection and sets the chord
	this.changeHarmony = function(harmony) {
		chordtype = harmony;
		setChord();
	};

	// changeChord(chord)
	// chord - index into the chordformulas as semitones from the root 
	//
	// Sets the chordtype to indicate the (extended) chord
	this.changeChord = function(chord) {
		chordtype = -1 - chord;	// by convention, negative numbers are extended chords
		setChord();
	};

	// play()
	// Plays the current chord
	// Basically a pass-through to MIDI.js
	this.play = function () {
		var delay = 0;
		var velocity = 127; // how hard the note hits
		MIDI.setVolume(0, 127);

		MIDI.chordOn(0, this.chord, velocity, delay);
	};

};

// View Layer Functions

// playChord()
//
// Plays the current chord
function playChord() {
	gChord.play();
}

// updateChordName()
//
// Updates UI with current chord name
function updateChordName() {
	document.getElementById("harmonyoutput").innerHTML = gChord.name;
	document.getElementById("chordoutput").innerHTML = gChord.notes;
}

function hasClass(ele,cls) {
    return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls) {
    if (!hasClass(ele,cls)) ele.className += " "+cls;
}

function removeClass(ele,cls) {
    if (hasClass(ele,cls)) {
        var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
        ele.className=ele.className.replace(reg,' ');
    }
}

// updateUIMode(ui)
// ui - UI mode where
//   0 is harmony mode (chord select dimmed)
//   1 is chord mode (chord graph and scale radio buttons dimmed)
function updateUIMode(ui) {

	var dimmers = document.getElementsByClassName('dimmer');
	for (var i = 0; i < dimmers.length; i++) {
		removeClass(dimmers[i],'dim');
	}

	for (var i = 0; i < 2; i++) {
		var modedimmers = document.getElementsByClassName('dim'+i);
		for (var j = 0; j < modedimmers.length; j++) {
			if (i == ui) addClass(modedimmers[j],'dim');
		}
	}
}

// removeStyle()
// id - id of element under which class style should be removed
// style - style to be removed
//
// Removes style selector from all child nodes of id
function removeStyle(id, style) {
	var childclass = '';
	var parent = document.getElementById(id);

	if (parent) {
		var childnodes = parent.childNodes;
		var regex = new RegExp('\\b'+style+'\\b','ig');
		for (var i = 0; i < childnodes.length; i++) {
			childclass = childnodes[i].className;
			childclass = childclass.replace(regex, '');
			childnodes[i].className = childclass;
		}
	}
}

// updateChordKeys()
//
// Displays the current chord on the keyboard
function updateChordKeys() {
	var chord = gChord.chord;
	var keyclass = '';

	removeStyle('upperkeys', 'hlt');
	removeStyle('lowerkeys', 'hlt');

	for (var i = 0; i < chord.length; i++) {

		var key = document.getElementById('keyupr'+chord[i]);
		if (key) {
			keyclass = key.className;
			key.className = keyclass + ' hlt';
		}

		key = document.getElementById('keylwr'+chord[i]);
		if (key) {
			keyclass = key.className;
			key.className = keyclass + ' hlt';
		}

	}
}

// UI accessor functions

function chgOctave(octave) {
	gChord.changeOctave(octave);
	updateChordName();
	updateChordKeys();
}

function chgScale(scale) {
	gChord.changeHarmony(0);
	gChord.changeScale(scale);
	updateUIMode(0);
	updateChordName();
	updateChordKeys();
}

function chgHarmony(harmony) {
	gChord.changeHarmony(harmony);
	updateUIMode(0);
	updateChordName();
	updateChordKeys();
}

// selectHarmony(harmony, octave)
// harmony - indexes into harmonies[harmony][1] for a harmony coding
// octave - defines the octave (octave 4 starts with middle C)
//
// Changes the harmony chord (adjusting octave based on modifier
// then plays the chord.
function selectHarmony(harmony, event) {
	gChord.changeHarmony(harmony);

	event = event || window.event;
	var offset = event.shiftKey ? 1 : (event.ctrlKey ? -1 : 0);
	gChord.changeOctave(4 + offset);	// FIXME UI octave needed

	updateChordName();
	updateChordKeys();
	updateUIMode(0);
	gChord.play();
	
}

// selectNote(note)
// note - note value to play
//
// Plays a note for now
function selectNote(note) {

	MIDI.setVolume(0, 127);
	MIDI.noteOn(0, note, 127, 0);
}

// selectKey(optionnode)
// optionnode - node of select control that was clicked
//
// Handles selection UI update and selection
function selectKey(optionnode) {

	removeStyle(optionnode.parentNode.id, 'selected');
	optionnode.className += ' selected';

	gChord.changeKey(optionnode.value);
	updateChordName();
	updateChordKeys();
}

// selectChord(optionnode)
// optionnode - node of select control that was clicked
//
// Handles selection UI update and selection
function selectChord(optionnode) {

	removeStyle(optionnode.parentNode.id, 'selected');
	optionnode.className += ' selected';

	gChord.changeChord (optionnode.value);
	updateUIMode(1);
	updateChordName();
	updateChordKeys();
}

// recordChord(chord)
//
// Records the current chord in a visual DOM object element.
function recordChord(chord) {
	var parent = document.getElementById('recordingblock');
	var child = document.createElement('div');

	child.className = 'tile uiheading chord-rec color'+(gChord.chordtype >= 0 ? gChord.chordtype : ((-gChord.chordtype) - 1));	//FIXME handling chord type
	child.innerHTML = gChord.name;
	child.chord = gChord.chord.slice(0);
	parent.appendChild(child);
}

// playRecording()
//
// Plays the chords encoded in the recorded DOM objects.
function playRecording() {
	var recnodes = document.getElementById('recordingblock').childNodes;
	var str='';

	MIDI.setVolume(0, 127);

	for (var i = 0; i < recnodes.length; i++) {
		str=recnodes[i].innerHTML;
		MIDI.chordOn(0, recnodes[i].chord, 127, i);
	}
/* 	for (var i = 0; i < recnodes.length; i++) {
		str=recnodes[i].innerHTML;
		MIDI.chordOn(0, recnodes[i].chord, 127, (i*.5));
	} */
}

// clearRecording()
//
// Removes all recording nodes from the DOM
function clearRecording() {
	var recnodes = document.getElementById('recordingblock');

	while( recnodes.hasChildNodes() ){
		recnodes.removeChild(recnodes.lastChild);
	}
}

function test(str) {
	alert(str);
}

// startup()
//
// Creates the dynamic UI elements and sets defaults
function startup() {
	// set up the UI and whatnot

	var parent = null;
	var len = notes.length;
	var chord;

	// create root note selection control
	parent = document.getElementById('keyroot');
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('div')
		elem.value = i;
		elem.innerHTML = notes[i];
		elem.setAttribute('onclick','selectKey(this);');
		elem.className = 'option';
		if (i == 0) {
			elem.className += ' selected';
		}
		parent.appendChild(elem);
	}

	// create the chord selection control
	parent = document.getElementById('chord');
	len = chordnames.length;
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('div')
		elem.value = i;
		elem.innerHTML = chordnames[i];
		elem.setAttribute('onclick','selectChord(this);');
		elem.className = 'option';
		if (i == 0) {
			elem.className += ' selected';
			chord = elem.value;
		}
		parent.appendChild(elem);
	}

	// create the harmony chord board
	var graphnode = document.getElementById('harmonychordgraph');
	parent = document.createElement('map');
	parent.name = "hgraphmap";
	graphnode.parentNode.insertBefore(parent, graphnode);	// create a map node and add it before the harmony chord graph

	len = harmonies.length;
	for (var i = 0; i < len; i++) {
		var child = document.createElement('area');
		child.shape = 'rect';
		child.coords = harmonies[i][2][0]+','+harmonies[i][2][1]+','+harmonies[i][2][2]+','+harmonies[i][2][3];
		child.setAttribute('onclick','selectHarmony('+i+', event);');
		parent.appendChild(child);
	}

	// create the keyboard
	// ul -1 = 0 && +1 = 1
	// ur -1 = 1 && +1 = 0
	// um -1 = 1 && +1 = 1
	// ub 0 = 1
	// lwr 0 = 0
	parent = document.getElementById('keyboard');
	var scale = [0,1,0,1,0,0,1,0,1,0,1,0];
	var upper = document.getElementById('upperkeys');
	var lower = document.getElementById('lowerkeys');

	// parent.appendChild(upper);
	// parent.appendChild(lower);

	for (var i = 21; i <= 108; i++) {
		var note = i % 12;
		var cls = 'keyupr ';

		if (i == 21) cls += 'ufst';		// first key
		else if (i == 108) cls += 'ulst';	// last key
		else if (scale[i % 12]) cls += 'ub';	// black key
		else if (scale[(i-1) % 12] && scale[(i+1) % 12]) cls += 'um';	// upper middle white
		else if (scale[(i-1) % 12] && !scale[(i+1) % 12]) cls += 'ur';	// upper right white
		else cls += 'ul';	// upper left middle

		var upperkey = document.createElement('div');
		upperkey.className = cls;
		upperkey.id = 'keyupr'+i;
		upperkey.note = i;
		upperkey.setAttribute('onclick','selectNote(this.note);');
		upper.appendChild(upperkey);

		if (!scale[i % 12]) {	// white key here
			var lowerkey = document.createElement('div');
			if (i == 108) lowerkey.className = 'keylwr llst';
			else lowerkey.className = 'keylwr lk';
			lowerkey.id = 'keylwr'+i;
			lowerkey.note = i;
			lowerkey.setAttribute('onclick','selectNote(this.note);');
			lower.appendChild(lowerkey);
		}
	}

	document.getElementById("modemajor").checked = true;
	chgHarmony(0);	// C Major-I
	chgOctave(4);	// Middle C octave
//	gChord.play();
}

// init()
//
// Load and initializes the MIDI.js plugin
function init() {

	MIDI.loadPlugin({
		soundfontUrl: "./midi-js-soundfonts/FluidR3_GM/",
		instrument: "acoustic_grand_piano",
		callback: function() {
			startup();
		}
	});
}