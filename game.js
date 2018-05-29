
var gridWidth = 10;
var gridHeight = 14;
var polySize = 4;

var gridSquareLength = 40;

var logicTicks = 20;
var currentTick = 0;

function clonePoly(poly) {
    // ensure current piece is deeply cloned
    var clone = new Array(poly.length);
    for (var i = 0; i < poly.length; i++) {
        var block = { "x": poly[i].x, "y": poly[i].y };
        clone[i] = block;
    }
    return clone;
}

function createPolyominoes(n) {

    // create origin point
    var polys = [[{ "x" : 0, "y": 0}]];

    for (var i = 1; i < n; i++) {

        polys = expandPolys(polys);
    }

    var hashPolys = new Set();
    var resultPolys = new Array();
    for (var i = 0; i < polys.length; i++) {
        var poly = clonePoly(polys[i]);
        normalisePoly(poly);
        var hash = getHashPolyomino(poly);
        if (!hashPolys.has(hash)) {
            hashPolys.add(hash);
            resultPolys.push(poly);
        }
    }
    return resultPolys;
}

function normalisePoly(poly) {
    // find most negative x and y
    var negX = 0;
    var negY = 0;
    for (var i = 0; i < poly.length; i++) {
        if (poly[i].x < negX) {
            negX = poly[i].x;
        }
        if (poly[i].y < negY) {
            negY = poly[i].y;
        }
    }

    // add mod back to blocks
    for (var i = 0; i < poly.length; i++) {

        poly[i].x += Math.abs(negX);
        poly[i].y += Math.abs(negY);
    }
}

function expandPolys(startPolys) {

    var resultPolys = new Set();

    // iterate through all polys
    for (var p = 0; p < startPolys.length; p++) {
        var poly = startPolys[p];

        var polyHash = getHashPolyomino(poly);

        // iterate through all blocks in poly
        for (var i = 0; i < poly.length; i++) {

            // add a block in all cardinalities
            // left
            var leftCpoly = Array.from(poly);
            var leftNewBlock = { "x": poly[i].x + 1, "y": poly[i].y };
            leftCpoly.push(leftNewBlock);
            if (getHashPolyomino(leftCpoly) != polyHash) {
                resultPolys.add(leftCpoly);
            }

            // up
            var upCpoly = Array.from(poly);
            var upNewBlock = { "x": poly[i].x, "y": poly[i].y + 1 };
            upCpoly.push(upNewBlock);
            if (getHashPolyomino(upCpoly) != polyHash) {
                resultPolys.add(upCpoly);
            }

            // right
            var rightCpoly = Array.from(poly);
            var rightNewBlock = { "x": poly[i].x - 1, "y": poly[i].y };
            rightCpoly.push(rightNewBlock);
            if (getHashPolyomino(rightCpoly) != polyHash) {
                resultPolys.add(rightCpoly);
            }

            // down
            var downCpoly = Array.from(poly);
            var downNewBlock = { "x": poly[i].x, "y": poly[i].y - 1 };
            downCpoly.push(downNewBlock);
            if (getHashPolyomino(downCpoly) != polyHash) {
                resultPolys.add(downCpoly);
            }
        }
    }

    return Array.from(resultPolys);
}

function getHashPolyomino(poly) {
    var blockHashes = new Set();
    for (var i = 0; i < poly.length; i++) {
        var polyHash = JSON.stringify(poly[i]);
        blockHashes.add(polyHash);
    }
    return JSON.stringify(Array.from(blockHashes));
}

function createGrid() {
    var gameGrid = new Array(gridWidth);
    for (var i = 0; i < gridWidth; i++) {
        gameGrid[i] = new Array(gridHeight);
        for (var j = 0; j < gridHeight; j++) {
            gameGrid[i][j] = 0;
        }
    }
    return gameGrid;
}

/**
 * Gets an integer between the given values. Maximum is exclusive and the minimum is inclusive.
 * @argument min {number} Minimum number.
 * @argument max {number} Maximum number.
 * @returns {number}
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function spawnPiece() {
    var pieceId = getRandomInt(0, pieces.length);
    var piece = pieces[pieceId];

    // ensure current piece is deeply cloned
    currentPiece = new Array(piece.length);
    for (var i = 0; i < piece.length; i++) {
        var block = { "x": piece[i].x + 5, "y": piece[i].y };
        currentPiece[i] = block;
    }

    var blockHashElement = document.getElementById("blockHash");
    if (blockHashElement) {
        blockHashElement.innerText = JSON.stringify(currentPiece);
    }
}

function render() {

    gtx.fillStyle = "#FF0000";
    gtx.fillRect(0, 0, 800, 800);

    for (var i = 0; i < gridWidth; i++) {
        for (var j = 0; j < gridHeight; j++) {
            if (gameGrid[i][j] == 0) {
                gtx.fillStyle = "#FFFFFF";
            } else {
                gtx.fillStyle = "#0000FF";
            }
            gtx.fillRect(i * gridSquareLength, j * gridSquareLength, gridSquareLength, gridSquareLength);
        }
    }

    gtx.fillStyle = "#0000FF";
    for (var i = 0; i < currentPiece.length; i++) {
        gtx.fillRect(currentPiece[i].x * gridSquareLength, currentPiece[i].y * gridSquareLength, gridSquareLength, gridSquareLength);
    }
}

/**
 * Return true if move was possible, other false.
 * 
 * @argument xMod {number} Change in x position.
 * @argument yMod {number} Change in y position.
 * @returns {boolean}
 */
function moveCurrentPiece(xMod, yMod) {

    var canMovePiece = true;
    for (var i = 0; i < currentPiece.length; i++) {
        if (currentPiece[i].y + yMod == gridHeight || gameGrid[currentPiece[i].x + xMod][currentPiece[i].y + yMod] != 0) {
            canMovePiece = false;
        }
    }

    if (canMovePiece) {
        for (var i = 0; i < currentPiece.length; i++) {
            currentPiece[i].y += yMod;
            currentPiece[i].x += xMod;
        }
    }
    return canMovePiece;
}

function tick() {

    if (currentTick % logicTicks == 0) {

        if (!moveCurrentPiece(0, 1)) {

            for (var i = 0; i < currentPiece.length; i++) {
                gameGrid[currentPiece[i].x][currentPiece[i].y] = 1;
            }

            checkLines();
            spawnPiece();
        }
    }

    render();
    currentTick++;
}

function checkLines() {

    var addedLineCount = gridHeight - 1;
    var newGameGrid = createGrid();
    for (var j = gridHeight - 1; j >= 0; j--) {

        var clearLine = true;
        for (var i = 0; i < gridWidth; i++) {
            if (gameGrid[i][j] == 0) {
                clearLine = false;
                break;
            }

        }
        if (!clearLine) {
            for (var i = 0; i < gridWidth; i++) {
                newGameGrid[i][addedLineCount] = gameGrid[i][j];
            }
            addedLineCount--;
        }
    }
    gameGrid = newGameGrid;
}

function rotateClockwise (poly) {

    // rotate about the first block
    for (var i = 1; i < poly.length; i++) {
        var x = poly[i].x - poly[0].x;
        var y = poly[i].y - poly[0].y;
        poly[i].x = -y + poly[0].x;
        poly[i].y = x + poly[0].y;
    }
}

function rotateAntiClockwise (poly) {

    for (var i = 1; i < poly.length; i++) {
        var x = poly[i].x - poly[0].x;
        var y = poly[i].y - poly[0].y;
        poly[i].x = y + poly[0].x;
        poly[i].y = -x + poly[0].y;
    }
}

window.onkeydown = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;

    left = 37
    up = 38
    right = 39
    down = 40
    var xMod = 0;
    var yMod = 0;

    // up
    if (key == 38) {

    }
    // down
    else if (key == 40) {
        yMod++;
    }
    // left
    else if (key == 37) {
        xMod--;
    }
    // right
    else if (key == 39) {
        xMod++;
    }
    // X
    else if (key == 88) {
        rotateClockwise(currentPiece);
    }
    // Z
    else if (key == 90) {
        rotateAntiClockwise(currentPiece);
    }
    moveCurrentPiece(xMod, yMod);
}

var gameGrid = createGrid();

var pieces = createPolyominoes(polySize);

var currentPiece = [];
var gtx = document.getElementById("gtx").getContext("2d");

spawnPiece();

setInterval(tick, 50);