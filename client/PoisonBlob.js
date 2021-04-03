function PoisonBlob (blob, poisonColor) {
    this.blob = blob;
    this.poisonColor = poisonColor;  

    this.computePointsLost = function() {
        if (this.poisonColor == 'black'){
            return 20;
        }
        if(this.poisonColor == 'blue'){
            return 10;
        }
        return 0;
    };
    
}