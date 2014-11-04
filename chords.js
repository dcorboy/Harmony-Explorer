
var notes = ['C','C# / Db','D','D# / Eb','E','F','F# / Gb','G','G# / Ab','A','A# / Bb','B / Cb'];
var disp = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var chordnames = ['Major','Major 7th','Major 9','Major 11','Major 13','Major 7th add 11','Major 7th add 13','Major 7th Sus4','Major 9 Sus4','Minor','Minor 6','Minor 7th','Minor 9','Minor 11','Minor 13','Minor add 9','Minor 6 add 9','Minor 7th add 11','Minor 7th add 13','Minor Major 7th','Minor Major 9','Minor Major 11','Minor Major 13','Minor Major 7th add 11','Minor Major 7th add 13','Dominant 7th','Dominant 7th add 11','Dominant 7th add 13','Sus 2','Sus 4','6sus4','7sus4','9sus4'];
var chordformulas = ['0,4,7','0,4,7,11','0,2,4,7,11','0,2,4,5,7,11','0,2,4,7,9,11','0,4,5,7,11','0,4,7,9,11','0,5,7,11','0,2,5,7,11','0,3,7','0,3,7,9','0,3,7,10','0,2,3,7,10','0,2,3,5,7,10','0,2,3,7,9,10','0,2,3,7','0,2,3,7,9','0,3,5,7,10','0,3,7,9,10','0,3,7,11','0,2,3,7,11','0,2,3,5,7,11','0,2,3,7,9,11','0,3,5,7,11','0,3,7,9,11','0,4,7,10','0,4,5,7,10','0,4,7,9,10','0,2,7','0,5,7','0,5,7,9','0,5,7,10','0,2,5,7,10'];
var harmonynames = ['I','ii','iii','IV','V','vi','vii','5/5'];

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
	var rootnote = parseInt(root);
	var chordformula = chord.value.split(',');
	var output = '';
	
	gChord.length = 0;	// reset chord array

	for (var i=0; i<chordformula.length; i++) {
		var note = rootnote + parseInt(chordformula[i]);
		output += (disp[note%12] + ' '); 
		gChord.push(note+60);	// FIXME adjust for octave later
	}
	document.getElementById("chordoutput").innerHTML = output;
}

function chgKey(root, major)
{
	gKey = parseInt(root);
	if (major) gScale = majorscale;
	else gScale = minorscale;
}

function playHarmony(harmony, octave)
{
	var chord = [];
	var h = harmony;
	// uses gKey and gScale
	// a h is the notes indexed by n, n+2 and n+4 in the notes of the key scale
	// where n is the root note
	// h is the h # -1 as an index into harmonynames[]
	// octave is the relative octave from 4 (Middle C)

	if (harmony == 7) h = 1;

	var i1 = (0+h)%7;
	
	var i2 = (2+h)%7;
	var r2 = ((2+h)/7) >> 0;
	var i3 = (4+h)%7;
	var r3 = ((4+h) >= 7) ? 1 : 0

	console.log(i1+1,i2+1,i3+1);
	console.log(r2,r3);

	var n1 = 60 + gKey + gScale[i1] + octave * 12;
	var n2 = 60 + gKey + gScale[i2] + (r2+octave)*12;
	var n3 = 60 + gKey + gScale[i3] + (r3+octave)*12;
	
	if (harmony == 7) n2++;
	
	console.log(n1,n2,n3);
	
	chord.push(n1);
	chord.push(n2);
	chord.push(n3);

	playChord(chord);
}

function playHarmony2(harmony, octave)
{
	// harmony indexes into some kind of data structure in which teh chord is coded
	// Thoughts:
	// ['0,2,4','1,3,5','2,4,6', ...
	//   by the way h4 is '3,5,7', not '3,5,0'
	//
	// Past the basic harmonies, we need to encode # and b
	// so 5/5 is '1,#3,5'
	// 5/4 is '1,3,5,b7'
	//
	// So split the code into string tokens
	// for each token, check the 1st char for '#' or 'b'
	//   if they have one, set a signed modifier a (accidental)
	//     and parseInt str.slice(1);
	//   otherwise just parse it as-is
	//   these are the i#s above, but need to be cut down to %7 with a carry flag, as above
	//   convert to n as above
	//   add the accidental a
	//   push it into the chord array
}

function startup() {
	// set up the UI and whatnot

	var parent = document.getElementById('chordroot');
	var parent2 = document.getElementById('keyroot');
	var len = notes.length;
	var chord;

	for (var i = 0; i < len; i++) {
		var elem = document.createElement('option')
		elem.value = i;
		elem.innerHTML = notes[i];
		parent.appendChild(elem);
		parent2.appendChild(elem.cloneNode(true));
	}
	parent.selectedIndex = "0";
	parent2.selectedIndex = "0";

	parent = document.getElementById('chord');
	len = chordnames.length;
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('option')
		elem.value = chordformulas[i];
		elem.innerHTML = chordnames[i];
		if (i == 0) {
			elem.selected = "selected";
			chord = elem;
		}
		parent.appendChild(elem);
	}

	parent = document.getElementById('harmonies');
	len = harmonynames.length;
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('button')
		elem.innerHTML = harmonynames[i];
		elem.setAttribute('onclick','playHarmony('+i+', 0);');
		parent.appendChild(elem);
	}
	
	parent = document.getElementById('lowharmonies');
	len = harmonynames.length;
	for (var i = 0; i < len; i++) {
		var elem = document.createElement('button')
		elem.innerHTML = harmonynames[i];
		elem.setAttribute('onclick','playHarmony('+i+', -1);');
		parent.appendChild(elem);
	}

	chgChord('0', chord);	// C Major
	chgKey('0', true);		// C Major
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