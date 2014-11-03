
var notes = ['C','C# / Db','D','D# / Eb','E','F','F# / Gb','G','G# / Ab','A','A# / Bb','B / Cb'];
var disp = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var chordformulas = ['0,4,7','0,4,7,11','0,2,4,7,11','0,2,4,5,7,11','0,2,4,7,9,11','0,4,5,7,11','0,4,7,9,11','0,5,7,11','0,2,5,7,11','0,3,7','0,3,7,9','0,3,7,10','0,2,3,7,10','0,2,3,5,7,10','0,2,3,7,9,10','0,2,3,7','0,2,3,7,9','0,3,5,7,10','0,3,7,9,10','0,3,7,11','0,2,3,7,11','0,2,3,5,7,11','0,2,3,7,9,11','0,3,5,7,11','0,3,7,9,11','0,4,7,10','0,4,5,7,10','0,4,7,9,10','0,2,7','0,5,7','0,5,7,9','0,5,7,10','0,2,5,7,10'];
var chordnames = ['Major','Major 7th','Major 9','Major 11','Major 13','Major 7th add 11','Major 7th add 13','Major 7th Sus4','Major 9 Sus4','Minor','Minor 6','Minor 7th','Minor 9','Minor 11','Minor 13','Minor add 9','Minor 6 add 9','Minor 7th add 11','Minor 7th add 13','Minor Major 7th','Minor Major 9','Minor Major 11','Minor Major 13','Minor Major 7th add 11','Minor Major 7th add 13','Dominant 7th','Dominant 7th add 11','Dominant 7th add 13','Sus 2','Sus 4','6sus4','7sus4','9sus4'];
var majorscale = [0,2,4,5,7,9,11];
var minorscale = [0,2,3,5,7,8,10];


MIDI.USE_XHR = false;	// allows MIDI.js to run from file:

var gChord = [];	// array of MIDI note numbers
var gKey = 0;
var gScale = [];	// array of major/minor scale intervals

function playChord(chord) {
	var delay = 0;
	var velocity = 127; // how hard the note hits
	MIDI.setVolume(0, 127);

	MIDI.chordOn(0, chord, velocity, delay);
}

function chgChord (root, chord)
{
	var rootnote = parseInt(root.value);
	var chordformula = chord.value.split(',');
	var output = '';
	
	gChord.length = 0;	// reset chord

	for (var i=0; i<chordformula.length; i++) {
		var note = rootnote + parseInt(chordformula[i]);
		output += (disp[note%12] + ' '); 
		gChord.push(note+60);
	}
	document.getElementById("chordoutput").innerHTML = output;
}

function chgKey(root, major)
{
	gKey = parseInt(root.value);
	if (major) gScale = majorscale;
	else gScale = minorscale;
	playChord(gChord);
}

function playHarmony(harmony)
{
}

function startup() {
	// set up the UI and whatnot

	var select = document.getElementById('chordroot');
	var select2 = document.getElementById('keyroot');
	var len = notes.length;
	var root, chord;

	for (var i = 0; i < len; i++) {
		var elem = document.createElement('option')
		elem.value = i;
		elem.innerHTML = notes[i];
		if (i == 0) root = elem;
		select.appendChild(elem);
		select2.appendChild(elem.cloneNode(true));
	}
	select.selectedIndex = "0";
	select2.selectedIndex = "0";

	select = document.getElementById('chord');
	len = chordnames.length;
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('option')
		elem.value = chordformulas[i];
		elem.innerHTML = chordnames[i];
		if (i == 0) {
			elem.selected = "selected";
			chord = elem;
		}
		select.appendChild(elem);
	}
	
	// maybe set major/minor here also

	chgChord(root, chord);
	playChord(gChord);
}

function init() {
	// load and initialize the MIDI.js plugin

	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function() {
			startup();
		}
	});
}