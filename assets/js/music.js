var sum = function() {
    sumprototypevar = 0;
    for (var x=0; x<this.length; x+=1) {
        sumprototypevar += this[x];
    }
    return sumprototypevar;
}

Array.prototype.sum = sum;
Float32Array.prototype.sum = sum;

function square(x) {
    return Math.abs(x*x);
}

var audioContext = null;
var musicbuffer = null;
var request = null;
var duration = 0;
var startTime = 0;

var source = null;
var gain = null;
var bass = null;
var treble = null;
var delay = null;
var compressor = null;
var splitter = null;
var merger = null;
var postanalyser = null;

var localavg = 0;

var analyser = null;

var analyserhelper = new Float32Array(1024);
var lastsums = new Array();
var c = 1.2;
var maxbpm = 300;
var maxWait = 0.2;

var lastbeat = 0;
var bpm = 0;

var versionString = '1.0.0 Beta';

var tips = [
    "If the game is too hard for you try an easier mode",
    "Version " + versionString,
    "Flashing notes give an extra bonus if you keep your Combo"
];

function init() {
    console.log('/--------------------------\\');
    console.log('|            Qwed           |');
    console.log('|    By ThatWeirdTechGuy    |');
    console.log('\\--------------------------/');
    console.log('Version ' + versionString);
    createAudioContext();
    setInterval(function () { changeTip(); },7000);
    changeTip();
    $('.first').click();
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
}

function createAudioContext() {
    console.log("Creating Audio Context...");
    audioContext = null;
    try {
        if (typeof AudioContext == "function") {
            audioContext = new AudioContext();
        } else if (typeof webkitAudioContext == "function") {
            audioContext = new webkitAudioContext();
        }
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser');
        console.log("Not Supported!");
    }
    console.log("Audio Context Created");
    musicbuffer = audioContext.createBufferSource()
}

function musicProgress(evt) {
    $('#musicProgress').attr('value',(evt.loaded/evt.total)*95)
}

function downloadSong(file) {
    showLoadingScreen();
    hideFilePrompt();

    request = new XMLHttpRequest();
    request.open('GET', file, true);
    request.responseType = 'arraybuffer';

    request.onprogress = musicProgress;

    request.onload = function() {
        console.log('Download Complete');

        audioContext.decodeAudioData(request.response, function(buffer){
            console.log('Audio Decoded');
            $('#musicProgress').attr("value",100);
            duration = buffer.duration;
            play(buffer);
        }, function() {
            alert('Cannot Decode Track!');
            console.log('Cannot Decode Track!');
            hideLoadingScreen();
            showFilePrompt();
        });
    }
    request.send();
    console.log('Downloading file...');
}

function play(buffer) {
    resetGame();
    hideLoadingScreen();
    hideFilePrompt();
    showGame();

    playing = true;

    source      =       audioContext.createBufferSource();
    gain        =       audioContext.createGain();
    bass        =       audioContext.createBiquadFilter();
    treble      =       audioContext.createBiquadFilter();
    delay       =       audioContext.createDelay(5);
    compressor  =       audioContext.createDynamicsCompressor();
    splitter    =       audioContext.createChannelSplitter(2);
    merger      =       audioContext.createChannelMerger(2);

    analyser    =       audioContext.createAnalyser();
    postanalyser    =   audioContext.createAnalyser();

    console.log('Nodes Initialized');

    monitor();

    gain.gain.value = 1;

    delay.delayTime.value = 1;

    bass.type = 6;
    bass.frequency.value = 9000;
    bass.Q.value = .1;

    treble.type = 2;
    treble.frequency.value = 9000;
    treble.Q.value = 1;

    analyser.smoothingTimeConstant = 1/60;

    source.buffer = buffer;

    // Analyser Path
    source.connect(splitter);
    splitter.connect(bass);
    splitter.connect(treble);
    bass.connect(merger);
    treble.connect(merger);
    merger.connect(analyser);
    //analyser.connect(gain);

    // Song Path
    source.connect(gain);
    gain.connect(delay);
    delay.connect(postanalyser);
    postanalyser.connect(audioContext.destination);

    hideFilePrompt();

    source.start(audioContext.currentTime);
    startTime = audioContext.currentTime;
}

function changeSettings() {
    //gain.gain.value = $('#mastergaincontrol').val();
    c = parseFloat($('#difficulty').val());
    hitSpeed = parseFloat($('#speed').val());
}

function fadeOutGameMusic() {
    if (source.gain.value>0) {
        source.gain.value -= .05;
        setTimeout(function() { fadeOutGameMusic() },10);
    } else {
        source.gain.value = 0;
        console.log('Fade Out Game Music');
    }
}

var lastBeatFlag = false;
var lastBeatFlags = new Array(1024);
for (var x=0; x<1024; x+=1) {
    lastBeatFlags[x] = 0;
}
var lastSpawn = 0;


function monitor() {
    if (audioContext.currentTime >= (duration + startTime + 1) && endOfSong == false) {
        endOfSong = true;
    }
    if (audioContext.currentTime >= (duration + startTime + 16) && endOfGame == false) {
        endOfGame = true;
		showFilePrompt();
        hideGame();
    }

    //$('#currenttime').html(audioContext.currentTime);
    //$('#gain').html(gain.gain.value);
    //$('#delay').html(delay.delayTime.value);

    // Beat Analysis
    analyser.getFloatFrequencyData(analyserhelper);

    if (lastsums.length >= 240) {
        lastsums.splice(0,1);
    }

    currentsum = new Array();
    subbands = 128*2;

    for (x=0; x<subbands-1; x+=1) {
        bandsum = 0
        for (band=(x*1024/subbands); band<((x+1)*1024/subbands); band+=1) {
            bandsum += analyserhelper[band];
        }
        currentsum.push(bandsum);
    }

    lastsums[lastsums.length] = currentsum;

    beats = 0;
    low = 0;
    mid = 0;
    high = 0;

    beatband = 0;

    for (band=0; band<currentsum.length; band+=1) {
        bandsum = 0;
        for (hist=0; hist<lastsums.length-1; hist+=1) {
            bandsum += lastsums[hist][band];
        }
        localavg = bandsum/(lastsums.length-1);
        // if (currentsum[band]*(c*(1/band+1)) > localavg) {
        if (currentsum[band]*(c) > localavg && lastBeatFlags[band] <= 0) {
            lastBeatFlags[band] += 60;
            beats += 1;
            if (band > (3*subbands/4)) {
                high += 2;
                beatband += 1;
            } else if (band >= (subbands/4) && band <= (3*subbands/4)) {
                mid += 3;
                beatband += 2;
            } else if (band < (subbands/4)) {
                low += .5;
            }
            beatband += band;
        } else {
            lastBeatFlags[band] -= 1;
        }
    }

    if ((low > 0 || mid > 0 || high > 0) && beatband > 400) {
        //$('body').css({'background':'#999'});

        beat = audioContext.currentTime;
        beatdelta = beat - lastbeat;
        // if (1/beatdelta*60 <= 300 && audioContext.currentTime < (duration + startTime - 1)) {
        // if (lastBeatFlag == false && audioContext.currentTime < (duration + startTime - 1)) {
        if (Math.abs(lastSpawn - audioContext.currentTime) > maxWait &&
            audioContext.currentTime < (duration + startTime - 1) &&
            1/beatdelta*60 <= maxbpm) {
            lastBeatFlag = true;
            bpm = 1/beatdelta * 60;
            lastbeat = beat;

            if (~~(Math.random()*16) == 8) {
                spawnHit(~~(Math.random*3), beatband);
            } else if (beatband > 1200) {
                spawnHit(0, beatband);
            } else if (beatband <= 1200 && beatband >= 600) {
                spawnHit(1, beatband);
            } else if (beatband < 600) {
                spawnHit(2, beatband);
            }

        }
    } else {
        lastBeatFlag = false;
        //$('body').css({'background':'#fff'});
    }

    //$('#bpm').html(~~bpm);

    //$('#bb').html(beatband + '<br>Low: ' + low + '<br>Mid: ' + mid + '<br>High: ' + high);

    //$('#bd').html('Beat: ' + beats + '<br>Sensitivity: ' + c);

    setTimeout(function() { monitor(); }, 1000/120);
}

var reader = null;
var multiBuffers = [];


function handleFileSelect(evt) {
    showLoadingScreen();
    hideFilePrompt();
    multiBuffers = [];

    var filenames = evt.target.files; // FileList object
    duration = 0;

    for (var buffernum=0; buffernum<filenames.length; buffernum+=1) {
        reader = new FileReader();

        reader.onload = function() {
            console.log('Download Complete');
            $('#musicProgress').attr("value",95);

            audioContext.decodeAudioData(reader.result, function(buffer){
                console.log('Audio Decoded');
                multiBuffers[buffernum] = buffer;
                $('#musicProgress').attr("value",100);
                duration += multiBuffers[buffernum].duration;
            }, function() {
                alert('Cannot Decode Track!');
                console.log('Cannot Decode Track!');
                hideLoadingScreen();
                showFilePrompt();
            });
        };

        reader.readAsArrayBuffer(filenames[buffernum]);
    }
}

if (navigator.appName == "Microsoft Internet Explorer") {
    alert("I've detected that you are using Internet Explorer. This may not work for you but you can continue anyways.");
}
