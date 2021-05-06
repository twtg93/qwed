$(document).ready(function() {
    console.log("Loading...");
    init();
    changeSettings();
    loadGame();
    $(".collapsibleContainer").collapsiblePanel();
    showSplashScreen();
    // hideSplashScreen();
    // showFilePrompt();
    loadThemeMusic();
});

function initProgress(evt) {
    $('#initProgress').attr("value",(evt.loaded/evt.total)*95);
}

var mainMenuBuffer = null;
var mmsrc = null;
var mmgain = null;

var demoModeEnabled = false;
var userDifficulty = c;

var hitSize = 20;

var demoModeTimer = null;

function resetDemoMode() {
    if (demoModeEnabled == true && playing == true) {
        keyHit({'which':27});
        resetGame()
        demoModeEnabled = false;
        c = userDifficulty;
        maxbpm = 350;
        maxWait = 0.25;
    }
    clearTimeout(demoModeTimer);
    if (playing == false) {
        demoModeTimer = setTimeout(function() { demoMode(); },90000);
    }
}

function demoMode() {
    return false;
    clearTimeout(demoModeTimer);
    demoModeEnabled = true;
    userDifficulty = c;
    c = 1.09;
    maxbpm = 1200;
    maxWait = 0.15;
    downloadSong('./music/menu/supermode.mp3');
}

function loadThemeMusic() {
    var req = new XMLHttpRequest();
    req.open('GET', './music/menu/preamble.ogg', true);
    req.responseType = 'arraybuffer';
    req.onprogress = initProgress;

    req.onload = function() {
        console.log('Download Complete');

        audioContext.decodeAudioData(req.response, function(buffer){
            console.log('Audio Decoded');
            $('#initProgress').attr("value",100);
            mmsrc = audioContext.createBufferSource();
            mmgain = audioContext.createGain();
            mmgain.gain.value = .9;
            mainMenuBuffer = buffer;
            startMainMenuMusic();
            setTimeout(function() {
                hideSplashScreen();
                showFilePrompt();
            }, 2000);
        }, function() {
            alert('An error has occured.');
        });
    }
    req.send();
}

function resetGame() {
    finalscore = 0;
    rating = "";
    combo = 0;
    multiplier = 1;
    hits = new Array();
    totalPoints = 0;
    currentPoints = 0;
    maxCombo = 0;
    endOfSong = false;
    endOfGame = false;
    playing = false;
    startTime = audioContext.currentTime;
}

function changeTip() {
    $('#tips').html(tips[~~(Math.random()*tips.length)]);
}

function showSplashScreen() {
    console.log('Splash Screen Show');
    $('#splashScreen').show();
    $('#splashScreen').stop(true,false).animate({opacity:1},1500);
}
function hideSplashScreen() {
    console.log('Splash Screen Hide');
    $('#splashScreen').stop(true,false).animate({opacity:0},1500,function () {
        $('#splashScreen').hide();
    });
}

function showFilePrompt() {
    // resetDemoMode();
    resetGame()
    console.log('Main Menu Show');
    console.log('Fade In Menu Music');
    fadeInMenuMusic();
    $('#filePrompt').show();
    $('#filePrompt').stop(true,false).animate({opacity:1},1500);
}
function hideFilePrompt() {
    console.log('Main Menu Hide');
    $('#filePrompt').stop(true,false).animate({opacity:0},1500,function () {
        $('#filePrompt').hide();
    });
}

function showLoadingScreen() {
    console.log('Loading Screen Show');
    $('#loadingScreen').show();
    $('#loadingScreen').stop(true,false).animate({opacity:1},750);
}
function hideLoadingScreen() {
    console.log('Loading Screen Hide');
    $('#loadingScreen').stop(true,false).animate({opacity:0},750,function () {
        $('#loadingScreen').hide();
    });
}

function showGame() {
    console.log('Game Show');
    fadeOutMenuMusic();
    $('#canvas').show();
    $('#canvas').stop(true,false).animate({opacity:1},500);
}
function hideGame() {
    console.log('Game Hide');
    $('#canvas').stop(true,false).animate({opacity:0},500,function () {
        $('#canvas').hide();
    });
}

function fadeOutMenuMusic() {
    if (mmgain.gain.value > 0) {
        mmgain.gain.value -= .05;
        setTimeout(function() { fadeOutMenuMusic(); }, 10);
    } else {
        mmgain.gain.value = 0;
        console.log('Fade Out Menu Music');
    }
}

function fadeInMenuMusic() {
    if (mmgain.gain.value < .9) {
        mmgain.gain.value += .01;
        setTimeout(function() { fadeInMenuMusic(); }, 10);
    } else {
        mmgain.gain.value = .9;
        console.log('Fade In Menu Music');
    }
}

function startMainMenuMusic() {
    mmsrc.buffer = mainMenuBuffer;
    mmsrc.loop = true;
    mmsrc.connect(mmgain);
    mmgain.connect(audioContext.destination);
    mmsrc.start(audioContext.currentTime);
}

var ctx = null;
var canvasContext = null;
var bgctx = null;
var bgcanvasContext = null;
var width = 0;
var height = 0;
var bgwidth = 0;
var bgheight = 0;
var frametime = (new Date)*1 - 1;
var lastframetime = (new Date)*1 - 1;

var finalscore = 0;
var rating = "";
var combo = 0;
var multiplier = 1;
var multiplierMultiplier = 1;

var hits = new Array();

var totalPoints = 0;
var currentPoints = 0;
var maxCombo = 0;

var yplace = 0;

var endOfSong = false;
var endOfGame = false;
var playing = false;

var colors = ['#42c8f4','#2eae66','#f33f3f','#ffffff','#987643'];

var bg = new Image();
bg.src = './assets/img/gamebg.jpg';

function loadGame() {
    canvasContext = document.getElementById('canvas');
    bgcanvasContext = document.getElementById('background');
    bgcanvasContext.width = $('body').width();
    bgcanvasContext.height = $('body').height();
    bgBefore = canvasContext;
    width = canvasContext.width;
    height = canvasContext.height;
    bgwidth = bgcanvasContext.width;
    bgheight = bgcanvasContext.height;
    yplace = (height*.9) - .5 - (2*hitSize);
    ctx = canvasContext.getContext('2d');
    bgctx = bgcanvasContext.getContext('2d');
    gameLoop();
}

function drawGameStats() {

    ctx.textAlign = 'start';
    ctx.textBaseline = "middle";
    ctx.font = "9pt Arial";
    ctx.fillStyle = "#f1f1f1";
    ctx.fillText("Qwed",15,height-47);
    ctx.fillText(versionString,15,height-31);
    ctx.fillText("By: ThatWeirdTechGuy",15,height-15);

    ctx.fillText("Score: " + finalscore,15,24);
    ctx.fillText("Hit Rating: " + rating,15,40);

    ctx.textAlign = 'right';
    ctx.fillText("[ESC] to view your rank!",width-11,24);

    for (key in lastHits) {
        ctx.fillStyle = '#dfe448';
        ctx.strokeStyle = '#ffffff';
        pump = hitSize + 25;

        if (Math.abs(lastHits[key] - audioContext.currentTime) < .25) {
            ctx.globalAlpha = (1-(audioContext.currentTime - lastHits[key])/.1) > 0 ? 1-(audioContext.currentTime - lastHits[key])/.1 : 0;
            switch (key) {
                case '0':
                    ctx.fillRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                    ctx.strokeRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                break;
                case '1':
                    ctx.fillRect(width/2+.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                    ctx.strokeRect(width/2+.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                break;
                case '2':
                    ctx.fillRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                    ctx.strokeRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                break;
            }
            ctx.globalAlpha = 1;
        }
    }

}


var bgBefore = null;
var visualEffect = {'effect':1,'expires':0};
var waveformEffect = {'effect':1,'expires':0,'color':'#ffffff'};


function drawBackground() {
    bgctx.globalAlpha = .05;
    bgctx.fillStyle = '#000000';
    bgctx.fillRect(0,0,bgwidth,bgheight);
    bgctx.drawImage(bg,0,0,bgwidth,bgheight);
    bgctx.globalAlpha = 1;

    if (visualEffect['expires'] < audioContext.currentTime) {
        visualEffect = {'effect':Math.ceil(Math.random()*11),'expires':audioContext.currentTime+1+(Math.random()*20)};
        // visualEffect = {'effect':13,'expires':audioContext.currentTime+1+(Math.random()*20)};
    }

    bgctx.save();

    switch(visualEffect['effect']) {
        case 1:
            bgctx.translate(bgwidth/2, bgheight/2);
            bgctx.rotate(2*Math.PI / 90);
            bgctx.translate( -bgwidth/2, -bgheight/2);
            bgctx.drawImage(bgBefore,0,0,bgwidth,bgheight);
        break;
        case 2:
            bgctx.drawImage(bgBefore,Math.random()*10,Math.random()*10,bgwidth,bgheight);
        break;
        case 3:
            bgctx.drawImage(bgBefore,-1,-20,bgwidth+2,bgheight+40);
        break;
        case 4:
            bgctx.drawImage(bgBefore,-20,1,bgwidth+40,bgheight-2);
        break;
        case 5:
            bgctx.drawImage(bgBefore,-50,-50,bgwidth+100,bgheight+100);
        break;
        case 6:
            bgctx.drawImage(bgBefore,20,-10,bgwidth+(Math.sin(audioContext.currentTime/5)*40),bgheight+(Math.sin(audioContext.currentTime/2)*40));
        break;
        case 7:
            bgctx.drawImage(bgBefore,12-(Math.sin(audioContext.currentTime/8)*25),12-(Math.sin(audioContext.currentTime/3)*20),bgwidth,bgheight);
        break;
        case 8:
            bgctx.drawImage(bgBefore,12-(Math.sin(audioContext.currentTime/7)*30),12-(Math.sin(audioContext.currentTime/4)*11),bgwidth+(Math.sin(audioContext.currentTime/5)*37),bgheight+(Math.sin(audioContext.currentTime/2)*12));
        break;
        case 9:
            var centerw = Math.abs(Math.sin(audioContext.currentTime) * (bgwidth));
            var centerh = Math.abs(Math.sin(audioContext.currentTime/3) * (bgheight));
            bgctx.translate(centerw, centerh);
            bgctx.rotate((Math.sin(audioContext.currentTime*2)) * 2*Math.PI / 45);
            bgctx.translate(-centerw, -centerh);
            bgctx.drawImage(bgBefore,-10,-10,bgwidth-(Math.sin(audioContext.currentTime*2)*20),bgheight-(Math.sin(audioContext.currentTime*2)*20));
        break;
        case 10:
            bgctx.drawImage(bgBefore,20,-20,bgwidth-40,bgheight+40);
        break;
        case 11:
            bgctx.drawImage(bgBefore,20+(Math.random()*5),-20-(Math.random()*5),bgwidth-40-(Math.random()*5),bgheight+40+(Math.random()*5));
        break;
    }

    if (playing) {
        drawWaveform();
    }
    bgctx.globalAlpha = 1;
    bgBefore = bgcanvasContext;

    bgctx.restore();
    bgctx.globalCompositeOperation = 'source-over';
}

var frames = 0;
var fgfps = 60;
var bgfps = 1;
var cbgf = 0;
var cfgf = 0


var frametime = (new Date);
function gameLoop() {

    frames += 1

    if (cbgf%bgfps == 0) {
        drawBackground();
        cbgf = 0;
    }

    cbgf += 1;

    drawGameplay();

    drawGameStats();

    if (Math.abs(lastHit - audioContext.currentTime) < .5) {
        ctx.font = "italic 50px Calibri";
        ctx.textBaseline = "top";
        ctx.textAlign = 'center';
        ctx.fillStyle = "#f1f1f1";
        ctx.globalAlpha = 1 - (Math.abs(lastHit - audioContext.currentTime)/.5);
        ctx.fillText(rating,width/2,75);
        if (multiplier * multiplierMultiplier > 1) {
            ctx.fillText("X" + (multiplier * multiplierMultiplier),width/2,125);
        }
        ctx.globalAlpha = 1;
    }

    if (combo > maxCombo) {
        maxCombo = combo;
    }

    if (combo >= 5) {
        if (combo > 150) {
            multiplier = 32;
        } else if (combo > 100) {
            multiplier = 16;
        } else if (combo > 50) {
            multiplier = 8;
        } else if (combo > 25) {
            multiplier = 4;
        } else if (combo > 10) {
            multiplier = 2;
        } else {
            multiplier = 1;
        }
        ctx.textAlign = 'right';
        ctx.textBaseline = "bottom";
        ctx.font = "italic bold 40px Calibri";
        if (multiplier * multiplierMultiplier > 4) {
            ctx.fillStyle = colors[~~(Math.random()*colors.length)];
        } else {
            ctx.fillStyle = '#f1f1f1';
        }
        if (multiplier > 1)
            ctx.fillText("X" + (multiplier * multiplierMultiplier),width-15,height-107);
        ctx.fillText("COMBO: " + combo,width-15,height-67);
    }
    if (demoModeEnabled == true) {
        ctx.textBaseline = "middle";
        ctx.textAlign = 'center';
        ctx.fillStyle = "#f1f1f1";
        ctx.font = "italic 36px Calibri";
        ctx.globalAlpha = Math.abs(Math.sin(audioContext.currentTime));
        ctx.fillText("DEMO PLAY",width/2,3*height/4);
        ctx.globalAlpha = 1;
    }


    ctx.fillStyle = '#f1f1f1';
    ctx.textBaseline = "bottom";
    ctx.textAlign = 'right';
    ctx.font = "italic 12px arial";

    ctx.fillText('FPS: ' + ~~(1000/(((new Date)*1)-frametime)),width-5,height-5);

    frametime = (new Date)*1;
    setTimeout(function() { gameLoop() }, (1000/fgfps) - ((new Date)*1-1-frametime));
}

function genHex() {
    hexc = new Array(14)
    hexc[0]="0"
    hexc[1]="1"
    hexc[2]="2"
    hexc[3]="3"
    hexc[4]="4"
    hexc[5]="5"
    hexc[5]="6"
    hexc[6]="7"
    hexc[7]="8"
    hexc[8]="9"
    hexc[9]="a"
    hexc[10]="b"
    hexc[11]="c"
    hexc[12]="d"
    hexc[13]="e"
    hexc[14]="f"

    digit = new Array(5)
    color="#"
    for (i=0;i<6;i++){
        digit[i]=hexc[Math.round(Math.random()*14)]
        color = color+digit[i]
    }
    return color;
}

var waves = new Uint8Array(1024);
var curfft = new Float32Array(1024);

function drawWaveform() {
    postanalyser.getByteTimeDomainData(waves);
    postanalyser.getFloatFrequencyData(curfft);

    wavebgwidth = bgwidth/waves.length;

    if (waveformEffect['expires'] < audioContext.currentTime) {
        waveformEffect = {
            'effect':Math.floor(Math.random()*11),
            // 'effect':Math.floor(10),
            'expires':audioContext.currentTime+1+(Math.random()*20),
            'color':genHex()
        };
    }

    bgctx.fillStyle = waveformEffect['spcolor'] || waveformEffect['color'];
    var wavesize = (400/(curfft[0]+400))*10;

    for (var x=0; x<waves.length; x+=1) {
        switch (waveformEffect['effect']) {
            case 0:	// Spectrum
                bgctx.globalAlpha = .25;
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),bgheight,(bgwidth/(1024-512)),-(bgheight/2*(curfft[x]/70))-bgheight);
                bgctx.globalAlpha = .1;
            break;
            case 1:	// Waveform 1
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),((waves[x]/128)*bgheight/2)-.5,(bgwidth/(1024 - 512))*2,2);
            break;
            case 2: // Waveform 2
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),((waves[x]/128)*bgheight/2)-.5,(bgwidth/(1024 - 512))*2,(waves[x]-128));
            break;
            case 3: // Spectrum Peaks
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),-(bgheight*(curfft[x]/70))-(bgheight/4),(bgwidth/(1024 -512)),2);
            break;
            case 4: // Waveform Boxes
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),(Math.sin(audioContext.currentTime + x/128 + (Math.random()/10))*(bgheight/2))+(bgheight/2),((waves[x-1]-waves[x])*1),((waves[x-1]-waves[x])*1));
            break;
            case 5: // Real Waveform
                bgctx.globalAlpha = 1;
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),((waves[x]/128)*bgheight/2)-.5,2,((waves[x-1]-waves[x])*2)+1);
            break;
            case 6: // Waveform Boxes
                bgctx.globalAlpha = .1;
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),bgheight/2,((waves[x-1]-waves[x])*8),((waves[x-1]-waves[x])*8));
                bgctx.globalAlpha = 1;
            break;
            case 7: // Random Boxes
                bgctx.globalAlpha = .7;
                bgctx.fillRect(bgwidth*Math.random(),bgheight*Math.random(),((waves[x-2]-waves[x+2])/2),((waves[x-2]-waves[x+2])/2));
                bgctx.globalAlpha = 1;
            break;
            case 8: // Real Waveform
                bgctx.globalAlpha = 1;
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),-(bgheight*(curfft[x]/100))-(bgheight/4),2,2);
            break;
            case 9: // Real Waveform
                bgctx.globalAlpha = 1;
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),((waves[x]/128)*bgheight/4)+Math.sin(audioContext.currentTime + x/128)*(bgheight/2)+(bgheight/2),2,((waves[x-1]-waves[x])*2)+1);
                bgctx.fillRect(x*(bgwidth/(1024 - 512)),((waves[x]/128)*3*bgheight/4)+Math.sin(audioContext.currentTime - x/128)*(bgheight/4)+(bgheight/4),2,((waves[x-1]-waves[x])*4)+1);
            break;
            case 10: // Box Waveform
                bgctx.globalAlpha = 1;
                if (x%8 == 0) {
                    bgctx.fillRect(~~(x*(bgwidth/(1024 - 512))/12)*12,~~(((waves[x]/128)*bgheight/2)/12)*12, 12, 12);
                }
            break;
            default:
                bgctx.fillRect(wavebgwidth*x-(wavesize/2),(waves[x]-128)+(bgheight/2)-(wavesize/2),wavesize,wavesize);
        }
    }
    waveformEffect['spcolor'] = false;
}

function drawGameplay() {
    ctx.globalAlpha = 0.25;
    ctx.clearRect(0,0,width,height);
    ctx.globalAlpha = 1;

    $('#score').html(finalscore);
    ctx.strokeStyle = '#dfe448';

    ctx.globalCompositeOperation = 'source-over';

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0,0,width,height);
    ctx.globalAlpha = 0.75;
    ctx.fillRect(225,0,(width-225)-225+hitSize,height);
    ctx.globalAlpha = 1;

    if (endOfSong)
        endSong();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(220,((audioContext.currentTime - startTime)/duration)*height,5,height);
    ctx.fillRect(width-225+hitSize,((audioContext.currentTime - startTime)/duration)*height,5,height);

    pump = 0;
    ctx.strokeRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
    ctx.strokeRect((width/2)-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
    ctx.strokeRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);

    for (var x=0; x<hits.length; x+=1) {
        ctx.fillStyle = (hits[x]['color'] == 'rand') ? colors[~~(Math.random()*colors.length)] : hits[x]['color'];
        switch (hits[x]['type']) {
            default:
            case 1:
                hits[x]['x'] += 0;
            break;
            case 2:
                hits[x]['x'] -= 0;
            break;
            case 0:
                hits[x]['x'] += 0;
            break;
        }
        hits[x]['y'] = ((audioContext.currentTime - hits[x]['hittime'])*((yplace+hitSize/hitSpeed)/delay.delayTime.value)) * hitSpeed;
        if (hits[x]['x'] > width || hits[x]['y'] > height) {
            hits.splice(x,1);
            finalscore -= 50;
            currentPoints -= 50;
            rating = 'AWFUL!';
            combo = 0;
            multiplier = 1;
        } else {
            //if (Math.abs(hits[x]['y']-300) < 5)
                ctx.fillRect(hits[x]['x'],hits[x]['y'],hitSize,hitSize);
        }
    }
}

function spawnHit(type,intensity) {
    intensity = intensity || 0;
    cur = hits.length;
    totalPoints += 50;
    lastSpawn = audioContext.currentTime;
    switch (type) {
        default:
        case 0:
            hits[cur] = {'x':300.5,'y':0,
                'type':type,'hittime':lastSpawn,
                'color':'#42c8f4'};
        break;
        case 1:
            hits[cur] = {'x':width/2+.5,'y':0,
                'type':type,'hittime':lastSpawn,
                'color':'#2eae66'};
        break;
        case 2:
            hits[cur] = {'x':width-300.5,'y':0,
                'type':type,'hittime':lastSpawn,
                'color':'#f33f3f'};
        break;
    }
    if (~~(Math.random()*16) == 8) {
        hits[cur]['color'] = 'rand';
    }
    if (demoModeEnabled == true) {
        t = {0:37,1:38,2:39}
        if (~~(Math.random()*64) != 32) {
            setTimeout(function(){ keyHit({'which':t[type]}); },950+(Math.random()*50));
        } else {
            setTimeout(function(){ keyHit({'which':t[type]}); },925+(Math.random()*125));
        }
    }
    setTimeout(function(){ backgroundBeat(); },1000);
}

function backgroundBeat() {
    // bgctx.globalCompositeOperation = 'lighter';
    waveformEffect['spcolor'] = '#ffffff';
}

var seal = new Image();
seal.src = './assets/img/seal.png';

function endSong() {
    var centerw = width/2;
    ctx.save();
    ctx.translate( centerw, 150 );
    ctx.rotate( audioContext.currentTime/2 );
    ctx.translate( -centerw, -150 );
    ctx.drawImage( seal, centerw-100, 50 );
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = "middle";
    ctx.font = "bold 72px Calibri";
    ctx.fillStyle = '#000';
    if (currentPoints/totalPoints >= .97) {
        grade = 'A+';
    } else if (currentPoints/totalPoints < .97 && currentPoints/totalPoints >= .93) {
        grade = 'A'
    } else if (currentPoints/totalPoints < .93 && currentPoints/totalPoints >= .90) {
        grade = 'A-'
    } else if (currentPoints/totalPoints >= .87) {
        grade = 'B+';
    } else if (currentPoints/totalPoints < .87 && currentPoints/totalPoints >= .83) {
        grade = 'B'
    } else if (currentPoints/totalPoints < .83 && currentPoints/totalPoints >= .80) {
        grade = 'B-'
    } else if (currentPoints/totalPoints >= .77) {
        grade = 'C+';
    } else if (currentPoints/totalPoints < .77 && currentPoints/totalPoints >= .73) {
        grade = 'C'
    } else if (currentPoints/totalPoints < .73 && currentPoints/totalPoints >= .70) {
        grade = 'C-'
    } else if (currentPoints/totalPoints >= .67) {
        grade = 'D+';
    } else if (currentPoints/totalPoints < .67 && currentPoints/totalPoints >= .63) {
        grade = 'D'
    } else if (currentPoints/totalPoints < .63 && currentPoints/totalPoints >= .60) {
        grade = 'D-'
    } else {
        grade = 'F'
    }
    ctx.fillText(grade,centerw,150);
    ctx.font = "bold 30px Calibri";

    ctx.fillStyle = "#f1f1f1";
    ctx.fillText('Final Score: ' + finalscore,centerw,300);
    ctx.fillText('MAX COMBO: ' + maxCombo,centerw,350);
}


var keys = {};
var lastHit = 0;
var LEFT        = 37;
var CENTER      = 38;
var RIGHT       = 39;
var RETURN      = 27;
var VOLUMEDOWN  = 189;
var VOLUMEUP    = 187;

$(document).keydown(keyHit);

var lastHits = {0:0,1:0,2:0};

function keyHit(e) {
    if (e.which == RETURN && endOfGame == false) {
        endOfGame = true;
        endOfSong = true;
        fadeOutGameMusic();
        hideGame();
        showFilePrompt();
    }
    types = {37:0,38:1,39:2}
    typesarr = [37,38,39]

    if ($.inArray(e.which,typesarr) != -1) {
        keys[e.which] = true;
    }


    for (var key in keys) {
        if (!keys[key]) {
            continue;
        }

        keys[key] = true;
        ctx.fillStyle = '#dfe448';
        ctx.strokeStyle = '#ffffff';
        pump = hitSize + 25;
        switch (types[key]) {
            case 0:
                ctx.fillRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                ctx.strokeRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
            break;
            case 1:
                ctx.fillRect(width/2+.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                ctx.strokeRect(width/2+.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
            break;
            case 2:
                ctx.fillRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                ctx.strokeRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
            break;
        }

        keys[key] = false;
        closest = {'distance':0,'index':-1,'type':-1};
        for (var x=0; x<hits.length; x+=1) {
            if (closest['distance'] < hits[x]['y']) {
                special = hits[x]['color'] == 'rand' ? true : false;
                closest = {'distance':hits[x]['y'],'index':x,'type':hits[x]['type'],'special':special};
            }
        }

        kprototypevar = [];
        for (k in types) {
            kprototypevar.push(k);
        }

        pts = 0;
        combo += 1;

        if (~~Math.abs(closest['distance'] - yplace) <= 1) {
            rating = 'FLAWLESS!';
            pts = 100;
            if (closest['special']) {
                rating = 'X2 MULTIPLIER BONUS';
                multiplierMultiplier *= 2;
            }
        } else if (~~Math.abs(closest['distance'] - yplace) <= 15) {
            rating = 'PERFECT!';
            pts = 50;
            if (closest['special']) {
                rating = '+500 BONUS!';
                pts += 500;
            }
        } else if (~~Math.abs(closest['distance'] - yplace) <= 35) {
            rating = 'GOOD!';
            pts = 25;
            if (closest['special']) {
                rating = '+100 BONUS!';
                pts += 100;
            }
        } else if (~~Math.abs(closest['distance'] - yplace) <= 60) {
            rating = 'OK!';
            pts = 10;
            combo = 0;
            multiplier = 1;
            multiplierMultiplier = 1;
        } else if (~~Math.abs(closest['distance'] - yplace) <= 75) {
            rating = 'BAD!';
            pts = 0;
            combo = 0;
            multiplier = 1;
            multiplierMultiplier = 1;
        } else if (~~Math.abs(closest['distance'] - yplace) > 75) {
            rating = 'AWFUL!';
            pts = -50;
            combo = 0;
            multiplier = 1;
            multiplierMultiplier = 1;
        }

        lastHit = audioContext.currentTime;
        lastHits[types[key]] = lastHit;

        if (types[key] == closest['type'] && $.inArray(key,kprototypevar) != -1) {
            finalscore += pts * multiplier * multiplierMultiplier;
            currentPoints += pts;
            hits.splice(closest['index'],1);
        }
    }
}
