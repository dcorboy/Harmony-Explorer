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

// Thanks to these folks for their code samples and guidance
// https://kopepasah.com/tutorial/awesome-overlays-with-simple-css-javascript-html/

// FIXME
// collapse the notes stuff into a multi-dimensional array
// handle inversion - inverting the chord reverses (CEG = GEC) and creates the chord moving up through the chord
// node graph should be canvas elements
// encapsulate keyboard as object
// tile UI sizeToContent
// tempo setting?
// examples
// toggle notes with modifier keys (add/remove)
// use codepoints for flat/sharp
// decode arbitrary chords?

var notes = ['C','C&#x266f / D&#x266d','D','D# / Eb','E','F','F# / Gb','G','G# / Ab','A','A# / Bb','B'];
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
// encodings[3]: [x0, y0, x1, y1] of the hitbox on the graph image
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

var gChord = new Chord(updateUIMode, updateChordInfo);
var gRecorder = null;

function Chord(modecallback, infocallback) {
	var self = this;		// because ECMAScript
	var modechangecallback = modecallback;	// called when internal mode changes
	var infochangecallback = infocallback;	// called when chord info (name, notes) changes
	var key = 0;			// root note of current key where C=0 and B=11
	var scale = 0;			// index into scales for current mode (0=major; 1=minor)
	var chordtype = 0;		// chord index for current chord mode
	var octave = 0;			// octave number (middle C starts octave 4)
	var mode = -1;			// chord mode 0=harmony, 1=extended chord, 2=custom user chord

	this.chord = [];		// array of MIDI note numbers representing current chord
	this.name = '';			// chord name
	this.notes = '';		// chord note names


	///////////////////////
	//  Private Members  //
	///////////////////////

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
			self.chord.push(note+((octave + 1 ) * 12));
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

	// setCustomChord(octavedelta)
	// octavedelta - if known, the octave offset of the octave change

	//
	// Just sets the chord name
	function setCustomChord(octavedelta) {
		self.notes = '';
		var shift = 0;

		if (typeof octavedelta != 'undefined') shift = octavedelta;

		self.name = "Custom";	// set chord name

		for (var i=0; i<self.chord.length; i++) {
			var note = self.chord[i] + (shift * 12);
			self.chord[i] = note;
			self.notes += (disp[note%12] + ' '); 
		}
	}

	// setChord(delta)
	// octavedelta - if known, the octave offset of the octave change
	//
	// Determines how to set the chord based on current mode
	//   0 - harmony chords, index into harmony names/formulas
	//   1 - extended chords, index into chord names/formulas(-1)
	//   2 - custom chords defined on the keyboard
	function setChord(octavedelta) {
		switch(mode) {
			case 2:
				setCustomChord(octavedelta);
				break;
			case 1:
				setExtChord(chordtype);
//				setExtChord(chordtype[1]);
				break;
			default:
				setHarmonyChord(chordtype);
//				setHarmonyChord(chordtype[0]);
		}
		infochangecallback(self.name, self.notes);
	}

	// setMode(mode)
	//
	// Changes chord mode and calls the owner callback
	function setMode(newmode) {

		if (newmode != mode) {
			mode = newmode;
			modechangecallback(newmode);
		}
	}

	//////////////////////
	//  Public Members  // 
	//////////////////////

	// Accessors
	this.getType = function() { return mode; }
	this.getChordType = function() { return chordtype; }
	this.getOctave = function() { return octave; }

	// changeKey(newroot)
	// newroot - string representation of a root note where C=0 and B=11
	//
	// Sets key to the root note
	this.changeKey = function(newkey) {
		if ((newkey != key) || mode == 2) {
			key = newkey;
			if (mode == 2) setMode(0);	// choosing a key will reset the custom chord mode
			setChord();
		}
	};

	// changeScale(newscale)
	// newscale - index into scales indicating major or minor key (0=major, 1=minor)
	//
	// Sets scale to indicate either major or minor intervals.
	this.changeScale = function(newscale) {
		if (newscale != scale) {
			scale = newscale;
			setMode(0);
			setChord();
		}
	};

	// changeOctave(newoctave)
	// newoctave - defines the octave where middle C = 4
	//
	// Changes octave selection and sets the chord
	this.changeOctave = function(newoctave) {
		if ((newoctave != octave) && (newoctave >= 0) && (newoctave <= 7)) {
			var octavedelta = newoctave - octave;
			octave = newoctave;
			//if (mode == 2) setMode(0);	// choosing an octave will reset the custom chord mode
			setChord(octavedelta);
		}
	};

	// changeHarmony(harmony)
	// harmony - indexes into harmonies[harmony][1] for a harmony coding
	//
	// Changes harmony selection and sets the chord
	this.changeHarmony = function(harmony) {
		if ((harmony != chordtype) || (mode != 0)) {
			setMode(0);
			chordtype = harmony;
			setChord();
		}
	};

	// changeChord(chord)
	// chord - index into the chordformulas as semitones from the root 
	//
	// Sets the chordtype to indicate the (extended) chord
	this.changeChord = function(chord) {
		if ((chord != chordtype) || (mode != 1)) {
			setMode(1);
			chordtype = chord;	// by convention, negative numbers are extended chords
			setChord();
		}
	};

	// clearCustomNotes()
	//
	// Sets the chordtype to indicate a custom chord and clears it
	this.clearCustomNotes = function() {
		setMode(2);
		self.chord.length = 0;
		setChord();
	};

	// addCustomNote(note)
	// note - MIDI note to add to custom chord
	//
	// Sets the chordtype to indicate a custom chord and adds the note to the chord
	this.addCustomNote = function(note) {
		setMode(2);
		self.chord.push(note);
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

//
// Recorder object
//
// Handles recording and playback of recorded chords

function Recorder(recordingnode) {
	var self = this;				// because ECMAScript
	var recNode = recordingnode;	// node containing the recording elements

	// playback variables
	var isRecording = false;
	var pCallbackID = null;
	var pNodes = null;
	var pCount = 0;
	var pCurrent = null;
	var pLast = null;
	var pTempo = 750;	// play length of each chord

	///////////////////////
	//  Private Member   //
	///////////////////////

	function playRecordingCallback() {
		if (pCurrent >= pCount) {
			if (pLast) removeClass(pLast, 'recordhlt');

			window.clearInterval(pCallbackID);
			pCallbackID = null;
			updateChordKeys(gChord.chord);
		}
		else {
			var thisNode = pNodes[pCurrent++];

			if (pLast) removeClass(pLast, 'recordhlt');
			addClass(thisNode, 'recordhlt');
			updateChordKeys(thisNode.chord);

			MIDI.chordOn(0, thisNode.chord, 127, 0);

			pLast = thisNode;
		}
	}

	///////////////////////
	//  Public Members   //
	///////////////////////

	this.setTempo = function(tempo) {
		pTempo = tempo;
	}

	// playRecording()
	//
	// Plays the chords encoded in the recorded DOM objects
	// using a timed interval.
	this.playRecording = function() {
		pNodes = recNode.childNodes;
		pCount = pNodes.length;

		MIDI.setVolume(0, 127);

		if (pCount) {
			pCurrent = 0;

			playRecordingCallback();	// play first note immediately
			pCallbackID = window.setInterval(playRecordingCallback, pTempo);
		}
	};
	
	// addRecording()
	//
	// Records the current chord in a visual DOM object element.
	this.addRecording = function() {
		var newNode = document.createElement('div');

		newNode.className = 'tile uiheading recordtile color'+(gChord.getChordType() + 1);
		newNode.innerHTML = gChord.name;
		newNode.chord = gChord.chord.slice(0);	// do not store the global object array
		recNode.appendChild(newNode);
	};

	// tryRecording()
	//
	// Checks if recording and if so, records the chord
	this.tryRecording = function() {
		if (isRecording) self.addRecording();
	};

	// toggleRecording(elem)
	// elem - clicked element (for visual state :-P)
	//
	// Checks if recording and if so, records the chord
	this.toggleRecording = function(elem) {

		if (isRecording) addClass(elem, 'dim');
		else removeClass(elem, 'dim');

		isRecording = !isRecording;
	};

	// addRest()
	//
	// Records a rest in the recording.
	this.addRest = function() {
		var newNode = document.createElement('div');

		newNode.className = 'tile uiheading recordtile color0';
		newNode.innerHTML = 'Rest';
		newNode.chord = [];
		recNode.appendChild(newNode);
	};

	// deleteRecording()
	//
	// Deletes the last recorded chord.
	this.deleteRecording = function() {
		var nodecount = recNode.childNodes.length;

		if (nodecount) recNode.removeChild(recNode.childNodes[nodecount - 1]); 
	};

	// clearRecording()
	//
	// Removes all recording nodes from the DOM
	this.clearRecording = function() {
		while(recNode.hasChildNodes() ){
			recNode.removeChild(recNode.lastChild);
		}
		pTempo = 750;	// reset tempo
	};

	// loadRecording(index)
	// index - index of sample to load
	//
	// Loads sample referenced by index into JSONSamples.samples[]
	this.loadRecording = function(index) {
		var sample = JSONSamples.samples[index];
		self.clearRecording();

		pTempo = sample.tempo;

		for (var i = 0; i < sample.chords.length; i++) {
			var thisnode = sample.chords[i];
			var newnode = document.createElement('div');

			newnode.innerHTML = thisnode.name;
			newnode.className = 'tile uiheading recordtile color' + thisnode.style;
			newnode.chord = thisnode.chord.slice(0);	// probably okay to use a ref to global here tho
			recNode.appendChild(newnode);
		}
	}

	// saveRecording()
	//
	// Dev function to out put the chord data for the current recording
	// in a JSON format, to be added to the samples.json file
	this.saveRecording = function() {
		var nodes = recNode.childNodes;
		var nodecount = nodes.length;
		var output = '\t\t\tchords: [\n';

		for (var i = 0; i < nodes.length; i++) {
			var thisnode = nodes[i];
			var thischord = thisnode.chord;

			var color = thisnode.className.match(/\scolor([0-9]*)/)[1];

			if (i != 0) output += ', \n';

			output += '\t\t\t\t{\n\t\t\t\t\tname: "' + thisnode.innerHTML + '",\n';
			output += '\t\t\t\t\tstyle: ' + color + ',\n';
			output += '\t\t\t\t\tchord: ['

			for (var j = 0; j < thischord.length; j++) {
				if (j != 0) output += ', ';
				output += thischord[j];
			}
			output += ']\n\t\t\t\t}';
		}
		output += '\n\t\t\t]';

		console.log(output);
	}
}

//
// View Layer Functions
//

// playChord()
//
// Plays the current chord
function playChord() {
	gRecorder.tryRecording();
	gChord.play();
}

// updateChordInfo(name, notes)
//
// Updates UI with current chord name and notes
function updateChordInfo(name, notes) {
	document.getElementById('harmonyoutput').innerHTML = name;
	document.getElementById('chordoutput').innerHTML = notes;
	updateChordKeys(gChord.chord);
	document.getElementById('octaveoutput').innerHTML = gChord.getOctave();
}

// Class manipulation functions
//
//
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

// removeClassFromChildren(id, cls)
// id - id of element under which cls style should be removed
// cls - class to be removed
//
// Removes cls from all child nodes of id
function removeClassFromChildren(id, cls) {
	var parent = document.getElementById(id);

	if (parent) {
		var childnodes = parent.childNodes;
		for (var i = 0; i < childnodes.length; i++) removeClass(childnodes[i], cls);
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

	var modedimmers = document.getElementsByClassName('dim'+ui);
	for (var j = 0; j < modedimmers.length; j++) {
		addClass(modedimmers[j],'dim');
	}
}

// updateChordKeys()
//
// Displays the current chord on the keyboard
function updateChordKeys(chord) {

	removeClassFromChildren('upperkeys', 'hlt');
	removeClassFromChildren('lowerkeys', 'hlt');

	for (var i = 0; i < chord.length; i++) {

		var key = document.getElementById('keyupr'+chord[i]);
		if (key) addClass(key, 'hlt');

		key = document.getElementById('keylwr'+chord[i]);
		if (key) addClass(key, 'hlt');
	}
}

// UI accessor functions

function chgOctave(offset) {
	gChord.changeOctave(gChord.getOctave()+offset);
}

function chgScale(scale) {
	gChord.changeScale(scale);
}

// selectHarmony(harmony)
// harmony - indexes into harmonies[harmony][1] for a harmony coding
//
// Changes the harmony chord
function selectHarmony(harmony) {
	gChord.changeHarmony(harmony);

	gRecorder.tryRecording();
	gChord.play();
}

// selectNote(note, event)
// note - note value selected
// event - click event
//
// Modifies current chord by adding note
function selectNote(note, event) {

	event = event || window.event;
	//if (!event.shiftKey && !event.ctrlKey) gChord.clearCustomNotes();	// clear custom chord if shift key not down
	if (!event.altKey) gChord.clearCustomNotes();	// clear custom chord if alt key not down
	
	gChord.addCustomNote(note);

	MIDI.setVolume(0, 127);
	MIDI.noteOn(0, note, 127, 0);
}

// selectKey(optionnode)
// optionnode - node of select control that was clicked
//
// Handles selection UI update and selection
function selectKey(optionnode) {

	removeClassFromChildren(optionnode.parentNode.id, 'selected');
	addClass(optionnode, 'selected');

	gChord.changeKey(optionnode.value);
}

// selectChord(optionnode)
// optionnode - node of select control that was clicked
//
// Handles selection UI update and selection
function selectChord(optionnode) {

	removeClassFromChildren(optionnode.parentNode.id, 'selected');
	addClass(optionnode, 'selected');

	gChord.changeChord (optionnode.value);
}

// loadRecording()
//
// Select and load a sample recording
function loadRecording() {
	gRecorder.loadRecording(0);
}

//
// Overlay (popup dialog) functions
//

function selectOverlay(overlaynum) {
	var overlay = document.getElementById('overlay'+overlaynum);
	if (overlay) {
		addClass(overlay, 'overlay-open');
		addClass(document.getElementsByTagName("body")[0], 'overlay-view');
	}
}

function dismissOverlay(overlaynum, event) {
	var overlay = document.getElementById('overlay'+overlaynum);
	if (overlay && (!event || (event.target == overlay))) {
		removeClass(overlay, 'overlay-open');
		removeClass(document.getElementsByTagName("body")[0], 'overlay-view');
	}
}

//
// Keyboard Event Listener
//
// Listens for Shift and Ctrl keys and raises/lowers octave respectively

var gKbdEvents = new KeyboardEventHandler();

function KeyboardEventHandler() {
	var self = this;		// because ECMAScript
	var shiftDown = false;
	var ctrlDown = false;

	window.addEventListener ? document.addEventListener('keydown', keyDown) : document.attachEvent('keydown', keyDown);
	window.addEventListener ? document.addEventListener('keyup', keyUp) : document.attachEvent('keyup', keyUp);

	///////////////////////
	//  Private Members  //
	///////////////////////

	function keyDown(event) {
		if (!shiftDown && (event.keyCode == 16)) {
			gChord.changeOctave(gChord.getOctave()+1);
			//console.log('shift down: '+gChord.getOctave());
			shiftDown = true;
		}

		if (!ctrlDown && (event.keyCode == 17)) {
			gChord.changeOctave(gChord.getOctave()-1);
			//console.log('ctrl down: '+gChord.getOctave());
			ctrlDown = true;
		}

		// remove selections caused by shift/vtrl highlighting
		if (document.selection)
			document.selection.empty();
		else if (window.getSelection)
			window.getSelection().removeAllRanges();
	}

	function keyUp(event) {
		if (shiftDown && event.keyCode == 16) {
			gChord.changeOctave(gChord.getOctave()-1);
			//console.log('shift up: '+gChord.getOctave());
			shiftDown = false;
		}

		if (ctrlDown && event.keyCode == 17) {
			gChord.changeOctave(gChord.getOctave()+1);
			//console.log('ctrl up: '+gChord.getOctave());
			ctrlDown = false;
		}
	}
}

// startup()
//
// Creates the dynamic UI elements and sets defaults
function startup() {
	var parent = null;
	var len = 0;
	var chord;

	// create root note selection control
	parent = document.getElementById('keyroot');
	len = notes.length;
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
		child.setAttribute('onclick','selectHarmony('+i+');');
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
		upperkey.setAttribute('onclick','selectNote(this.note, event);');
		upper.appendChild(upperkey);

		if (!scale[i % 12]) {	// white key here
			var lowerkey = document.createElement('div');
			if (i == 108) lowerkey.className = 'keylwr llst';
			else lowerkey.className = 'keylwr lk';
			lowerkey.id = 'keylwr'+i;
			lowerkey.note = i;
			lowerkey.setAttribute('onclick','selectNote(this.note, event);');
			lower.appendChild(lowerkey);
		}
	}

	// Fill the samples dialog
	parent = document.getElementById("samples");
	len = JSONSamples.samples.length;
	for (var i = 0; i < len; i++) {
		var li = document.createElement('li');
		li.setAttribute('onclick','gRecorder.loadRecording(' + i + ');');
		li.className = 'option';
		parent.appendChild(li);

		// now build the children of the li node
		var elem = document.createElement('div');
		elem.innerHTML = JSONSamples.samples[i].title;
		elem.className = 'option';
		li.appendChild(elem);

		elem = document.createElement('div');
		elem.innerHTML = JSONSamples.samples[i].description;
		elem.className = 'option';
		li.appendChild(elem);
	}
	

	document.getElementById("modemajor").checked = true;
	gRecorder = new Recorder(document.getElementById("recordingblock"));
	gChord.changeHarmony(0);	// C Major-I
	gChord.changeOctave(4);	// Middle C octave
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