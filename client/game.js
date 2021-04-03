let blob;
let blobs = [];
let poison = [];
let zoom = 1;
let w = 1000;
let h = 1000;
let nrBlobs = 200;
let randomColor;
let initialRadius = 25;
const socket = io();
let players = [];
let player;
var score = 0;


var Experience = function (score) {
    this.score = score;
    this.badge = '🥉';
    var currentState = new Junior(this);
   
    this.change = function (state) {
        currentState = state;
        currentState.go();
    };
 
    this.start = function () {
        currentState.go();
    };
}

var Junior = function (exp) {
    this.exp = exp;
    exp.badge = '🥉';
    this.go = function () {
        console.log("Junior");
        if (exp.score > 50){
            exp.change(new Medium(exp));
        }
    }
};

var Medium = function (exp) {
    this.exp = exp;
    exp.badge = '🥈';
    this.go = function () {
        console.log("Medium");
        if (exp.score > 100){
            exp.change(new Expert(exp));
        }
    }
};

var Expert = function (exp) {
    this.exp = exp;
    exp.badge = '🥇';
    this.go = function () {
        console.log("Expert");
        if (exp.score < 50){
            exp.change(new Junior(exp));
        }
    }
};




function setup() {
    createCanvas(1200, 800);
    console.log(this.score);
    for (let i = 0; i < nrBlobs; i++) {
        let x = random(-w, w);
        let y = random(-h, h);
        randomColor = color(random(255), random(255), random(255));
        blobs[i] = new Blob(x, y, 10, randomColor);
    }

   for(var j = 0; j < 6; j++) {
        var poisonColor;
        var nameColor;

        let x = random(-w, w);
        let y = random(-h, h);
        
        if(j < 3){
            poisonColor = color(0, 0, 0);
            nameColor = 'black';
           
        }else {
            poisonColor = color(0, 0, 255);
            nameColor = 'blue';
            
        }
        var p = new Blob(x, y, 20, poisonColor);
        poison[j] =  new PoisonBlob(p, nameColor);
    
    }
    var letters = '0123456789ABCDEF';
    var colors = '#';
    for (var i = 0; i < 6; i++) {
        colors += letters[Math.floor(Math.random() * 16)];
    }
    blob = new Blob(0, 0, initialRadius, colors);
    blob.name = document.getElementById("name").innerHTML;
    var data = {
        x: blob.pos.x,
        y: blob.pos.y,
        r: blob.r,
        color: blob.color,
        name: blob.name,
        score: blob.score
    };
    socket.on('reloaded', function(data) {
        players = data;
    });
    socket.emit('start', data);
    socket.on('heartbeat', function(data) {
        players = data;
    });


}

function mousePressed() {
    loop();
}

function draw() {
    if (keyIsPressed == true) {
        noLoop();
    }
    background(200);
    translate(width / 2, height / 2);
    var newzoom = 50 / blob.r;
    zoom = lerp(zoom, newzoom, 0.1);
    scale(zoom);
    translate(-blob.pos.x, -blob.pos.y);
    stroke(255);
    fill(255, 255, 255, 100);
    rect(-w - blob.r, -h - blob.r, w * 2 + blob.r * 2, h * 2 + blob.r * 2, 10);


    for(var i = 0; i < 6; i++){
        poison[i].blob.show();
        if(blob.meetsPoison(poison[i])){
            let loss = poison[i].computePointsLost();
            blob.score -= loss; 
            if( (blob.score - loss) >= 0){
                blob.score -= loss; 
            } else
            {
                blob.score = 0; 
            }
            var x = random(-w, w);
            var y = random(-h, h);
            var newBlob = new Blob(x,y,20,poison[i].blob.color);
            poison[i] = new PoisonBlob(newBlob, poison[i].poisonColor);
        }
    }

    for (var i = blobs.length - 1; i >= 0; i--) {
        blobs[i].show();
        if (blob.eats(blobs[i])) {
            var x = random(-w, w);
            var y = random(-h, h);
            var randomColor;
            randomColor = color(random(255), random(255), random(255));
            blob.score += 16 / (blob.r * 0.5);
            blobs[i] = new Blob(x, y, 16, randomColor);

        }
    }
    console.log(blob.name);

    var data = {
        x: blob.pos.x,
        y: blob.pos.y,
        r: blob.r,
        color: blob.color,
        name: blob.name,
        score: blob.score
    };
    socket.emit('update', data);

    var eaten = false;

    console.log(blob.score);
    for (var i = players.length - 1; i >= 0; i--) {

        player = new Blob(players[i].x, players[i].y, players[i].r, players[i].color);
        player.name = players[i].name;
        player.score = players[i].score;
        if (player.name != blob.name)
            player.show();
        player.x = 0;
        player.y = 0;
        if ((players.length > 1) && (blob.name != player.name)) {


            if (blob.eatsPlayer(player)) {
                players[i].x = 0;
                players[i].y = 0;
                players[i].r = 20;
                players[i].score = 0;

                var data = {
                    x: blob.pos.x,
                    y: blob.pos.y,
                    r: blob.r,
                    color: blob.color,
                    name: blob.name,
                    score: blob.score
                };
                socket.emit('update', data);
                var data_player = {
                    x: players[i].x,
                    y: players[i].y,
                    r: players[i].r,
                    color: players[i].color,
                    name: players[i].name,
                    score: players[i].score
                };
                socket.emit('somebdy_eat', data_player);
                console.log('ai mancat ceva');

                eaten = false;
                // }
            }

            if (blob.eatenBy(player)) { //cand este mancat, schimba propriul view si anunta serverul de noua pozitie a
                //celui cu care a fost interactiunea
                blob.score = 0;
                blob.r = 20;
                blob.pos.x = 0;
                blob.pos.y = 0;

                players[i].score = players[i].score + blob.score;
                let sum = PI * players[i].r * players[i].r + PI * (blob.r * blob.r) / (players[i].r * 0.01); //suma ariilor
                players[i].r = sqrt(sum / PI); //deducem raza finala a playerul dupa ce a mancat
                var data = {
                    x: blob.pos.x,
                    y: blob.pos.y,
                    r: blob.r,
                    color: blob.color,
                    name: blob.name,
                    score: blob.score
                };
                socket.emit('update', data);
                var data_player = {
                    x: players[i].x,
                    y: players[i].y,
                    r: players[i].r,
                    color: players[i].color,
                    name: players[i].name,
                    score: players[i].score
                };
                socket.emit('somebdy_eat', data_player);
                console.log('eaten');
                eaten = true;
                eats = false;
            }
        }

    }
    var modal = document.getElementById("GameOver");
    var span = document.getElementsByClassName("close")[0];
    if (eaten == true) {
        noLoop();
        modal.style.display = "block";

    }

    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }


    for (var i = players.length - 1; i >= 0; i--) {
        player = new Blob(players[i].x, players[i].y, players[i].r, players[i].color);
        player.name = players[i].name;
        player.score = parseInt(players[i].score);
        pos = getBoardPosition(players, player);

        var stage = new Experience(player.score);
        stage.start();

        document.getElementById("p" + (pos)).innerHTML = player.name + player.score + stage.badge;

      
    }
    blob.show();
    blob.update();
}

function getBoardPosition(players, element) {
    var clonePlayers = players.slice();
    clonePlayers.sort(function(a, b) { return b.score - a.score });

    return clonePlayers.findIndex(x => x.name == element.name) + 1;

}
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const msgerChat = document.getElementById("main");

socket.on('chat-message', data => {
    //appendMessage(`${data.name}: ${data.message}`);
    appendMessage(data.name, 'https://www.flaticon.com/svg/static/icons/svg/1256/1256650.svg', 'left', data.message);
});

messageForm.addEventListener('submit', e => {
    e.preventDefault(); //not posting on page => not refreshing
    const message = messageInput.value;
    // appendMessage(`You: ${message}`);
    appendMessage('You', 'https://image.flaticon.com/icons/svg/145/145867.svg', 'right', message);
    socket.emit('send-chat-message', message);
    messageInput.value = '';
})


function appendMessage(name, img, side, text) {
    const msgHTML = `
      <div class="msg ${side}-msg">
        <div class="msg-img" style="background-image: url(${img})"></div>
  
        <div class="msg-bubble">
          <div class="msg-info">
            <div class="msg-info-name">${name}</div>
  
          <div class="msg-text">${text}</div>
        </div>
      </div>
    `;

    msgerChat.insertAdjacentHTML("beforeend", msgHTML);
    msgerChat.scrollTop += 500;
}