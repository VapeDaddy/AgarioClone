
function Blob(x, y, r, randomColor) {
    this.pos = createVector(x, y);
    this.r = r;
    this.vel = createVector(0, 0);
    this.color = randomColor;
    this.name = ""
    this.score = 0;
    this.invincible = false;

    this.update = function() {

        var newX = mouseX - width / 2;
        var newY = mouseY - height / 2;
        if ((this.pos.x > w && newX > 0) || (-this.pos.x > w && newX < 0))
            newX = 0;
        if ((this.pos.y > h && newY > 0) || (-this.pos.y > h && newY < 0))
            newY = 0;
        var newvel = createVector(newX, newY);
        var n = 50 / sqrt(this.r);
        newvel.setMag(n);
        this.vel.lerp(newvel, 0.2);
        this.pos.add(this.vel);

    };
    
    this.meetsPoison = function(other) {
        let d = p5.Vector.dist(this.pos, other.blob.pos);
        if (d < this.r + other.blob.r) { 
            return true;
        } else {
            return false;
        }
        
    }
    this.eats = function(other) {
        let d = p5.Vector.dist(this.pos, other.pos); //calc distanta dintre player si food
        if (d < this.r + other.r) { //verificam distanta dintre cele doua si suma razelor pt a vedea daca exista coliziune
            let sum = PI * this.r * this.r + PI * (other.r * other.r) / (this.r * 0.02); //suma ariilor
            this.r = sqrt(sum / PI); //deducem raza finala a playerul dupa ce a mancat
            return true;
        } else {
            return false;
        }
    };

    this.eatenBy = function(other) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d < /*this.r +*/ other.r && (other.r > this.r) && !this.invincible) {
            this.score = 0;
            return true;
        } else {
            return false;
        }
    };
    this.eatsPlayer = function(other) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d < this.r && (other.r < this.r) && !other.invincible) {
            let sum = PI * this.r * this.r + PI * (other.r * other.r) / (this.r * 0.01); //suma ariilor
            this.r = sqrt(sum / PI); //deducem raza finala a playerul dupa ce a mancat
            this.score += other.score;
            other.score = 0;
            return true;
        } else {
            return false;
        }
    };
    this.show = function() {
        fill(this.color);
        if (this.name != "") { //desenare scor si nume
            textSize(20 * this.r / 100);
            text(this.name, this.pos.x - this.r * 0.5, this.pos.y + this.r);
            document.getElementById("score").innerHTML = parseInt(this.score);
        }
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2); //deseneaza cerc cu centrul in x,y si diametrul dat (inaltime, lungime)
    };
    this.constrain = function() {
        blob.pos.x = constrain(blob.pos.x, -width / 4, width / 4);
        blob.pos.y = constrain(blob.pos.y, -height / 4, height / 4);
    };
    this.draw = function() {
        fill(this.color);

        if (this.name != "") { //desenare scor si nume
            textSize(20 * this.r / 100);
            text(this.name, this.pos.x - this.r * 0.5, this.pos.y + this.r);

        }
        ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2); //deseneaza cerc cu centrul in x,y si diametrul dat (inaltime, lungime)
    }
}