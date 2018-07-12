//import * as $ from "jquery";
var PolytrisGame = /** @class */ (function () {
    function PolytrisGame(gridWidth, gridHeight, pieces) {
        var _this = this;
        this.logicTicks = 53;
        this.currentTick = 0;
        this.linesCleared = 0;
        this.score = 0;
        this.level = 0;
        this.paused = false;
        this.gameOver = false;
        this.gameOverPromptShown = false;
        this.showGridLines = false;
        this.removingLinesFrames = 0;
        this.linesToRemove = null;
        this.pauseText = "Paused";
        this.gameOverText = "Game Over";
        /** The total number of frames to remove lines for. */
        this.removingLinesFramesDelay = 50;
        this.tick = function () {
            if (_this.gameOver && !_this.gameOverPromptShown) {
                // game over handling
                var name = prompt("Game over. What is your name?", "");
                _this.gameOverPromptShown = true;
                if (name) {
                    _this.writeStatus("Submitting score...");
                    $.ajax({
                        url: "https://cors-anywhere.herokuapp.com/http://scores.richteaman.com/api/score",
                        headers: {
                            "name": name,
                            "lines": _this.linesCleared.toString(10),
                            "points": _this.score.toString(10),
                            "blocks": _this.pieces[0].blocks.length.toString(10)
                        },
                        method: "POST"
                    })
                        .always(function () {
                        location.reload();
                    });
                }
                else {
                    location.reload();
                }
            }
            if (_this.removingLinesFrames > 0) {
                _this.removingLinesFrames--;
                if (_this.removingLinesFrames == 0) {
                    _this.removeLines();
                }
            }
            else if (!_this.gameOver && !_this.paused && _this.currentTick % _this.logicTicks == 0) {
                _this.tickPiece();
            }
            _this.renderGame(_this.mainGtx, _this.gameGrid, _this.currentPiece);
            PolytrisGame.renderPreview(_this.previewGtx, PolytrisGame.createGrid(_this.nextPiece.length, _this.nextPiece.length), _this.nextPiece.createPreviewPiece());
            var linesClearedElement = document.getElementById("lines_cleared");
            if (linesClearedElement) {
                linesClearedElement.innerHTML = _this.linesCleared.toString();
            }
            var scoreElement = document.getElementById("score");
            if (scoreElement) {
                scoreElement.innerHTML = _this.score.toString();
            }
            var levelElement = document.getElementById("level");
            if (levelElement) {
                levelElement.innerHTML = _this.level.toString();
            }
            _this.currentTick++;
        };
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.pieces = pieces;
        this.gameGrid = PolytrisGame.createGrid(this.gridWidth, this.gridHeight);
    }
    PolytrisGame.createGrid = function (width, height) {
        var gameGrid = new Array(width);
        for (var i = 0; i < width; i++) {
            gameGrid[i] = new Array(height);
            for (var j = 0; j < height; j++) {
                gameGrid[i][j] = 0;
            }
        }
        return gameGrid;
    };
    PolytrisGame.prototype.spawnPiece = function () {
        var pieceId = getRandomInt(0, this.pieces.length);
        var piece = this.pieces[pieceId];
        var newPiece = piece.clonePoly();
        return newPiece;
    };
    PolytrisGame.renderBlock = function (gtx, x, y, width, height, colour) {
        var margin = 2;
        gtx.fillStyle = colour;
        gtx.fillRect(x, y, width, height);
        gtx.fillStyle = "rgba(0, 0, 0, 0.1)";
        gtx.fillRect(x, y, width, height);
        gtx.fillStyle = colour;
        gtx.fillRect(x + margin, y + margin, width - (2 * margin), height - (2 * margin));
    };
    /**
     * Renders the given grid on the given context with the given active piece as a game.
     * @param {*} gtx
     * @param {any[][]} grid
     * @param {any[]} activePiece
     */
    PolytrisGame.prototype.renderGame = function (gtx, grid, activePiece) {
        var _this = this;
        var cellWidth = gtx.canvas.width / grid.length;
        var cellHeight = gtx.canvas.height / grid[0].length;
        gtx.fillStyle = "#FFFFFF";
        gtx.fillRect(0, 0, gtx.canvas.width, gtx.canvas.height);
        var width = grid.length;
        var height = grid[0].length;
        for (var i = 0; i < width; i++) {
            var xPos = Math.floor(i * cellWidth);
            for (var j = 0; j < height; j++) {
                var yPos = Math.floor(j * cellHeight);
                if (this.showGridLines) {
                    gtx.fillStyle = "#eee";
                    gtx.fillRect(i * cellWidth - 1, 0, 1, gtx.canvas.height);
                }
                if (grid[i][j] === 0) {
                    gtx.fillStyle = "#FFFFFF";
                    gtx.fillRect(xPos, yPos, cellWidth, cellHeight);
                }
                else {
                    var blockColour = grid[i][j];
                    PolytrisGame.renderBlock(gtx, xPos, yPos, cellWidth, cellHeight, blockColour);
                }
            }
        }
        if (this.removingLinesFrames > 0) {
            if (Math.floor(this.removingLinesFrames / 5) % 2 == 0) {
                gtx.fillStyle = "#CCCC00";
                this.linesToRemove.forEach(function (lineNumber) {
                    gtx.fillRect(0, lineNumber * cellHeight, _this.gridWidth * cellWidth, cellHeight);
                });
            }
            else {
                gtx.fillStyle = "#000000";
            }
        }
        else {
            var colour = activePiece.createPolyColor();
            for (var i = 0; i < activePiece.length; i++) {
                var xPos = Math.floor(activePiece.blocks[i].x * cellWidth);
                var yPos = Math.floor(activePiece.blocks[i].y * cellHeight);
                PolytrisGame.renderBlock(gtx, xPos, yPos, cellWidth, cellHeight, colour);
            }
        }
        if (this.gameOver) {
            gtx.fillStyle = "rgba(10, 10, 10, 0.9)";
            gtx.fillRect(0, 0, gtx.canvas.width, gtx.canvas.height);
            gtx.font = "30px PressStart2P";
            gtx.fillStyle = "#FFFFFF";
            var gameOverTextWidth = gtx.measureText(this.gameOverText).width;
            var gameOverTextXpos = (gtx.canvas.width / 2) - (gameOverTextWidth / 2);
            gtx.fillText(this.gameOverText, gameOverTextXpos, gtx.canvas.height / 2);
        }
        else if (this.paused) {
            gtx.fillStyle = "#000000";
            gtx.fillRect(0, 0, gtx.canvas.width, gtx.canvas.height);
            gtx.font = "30px PressStart2P";
            gtx.fillStyle = "#FFFFFF";
            var pauseTextWidth = gtx.measureText(this.pauseText).width;
            var pauseTextXpos = (gtx.canvas.width / 2) - (pauseTextWidth / 2);
            gtx.fillText(this.pauseText, pauseTextXpos, gtx.canvas.height / 2);
        }
    };
    /**
     * Renders the given grid on the given context with the given active piece as a preview.
     * @param {*} gtx
     * @param {any[][]} grid
     * @param {any[]} activePiece
     */
    PolytrisGame.renderPreview = function (gtx, grid, activePiece) {
        var cellWidth = Math.floor(gtx.canvas.width / grid.length);
        var cellHeight = Math.floor(gtx.canvas.height / grid[0].length);
        gtx.fillStyle = "#FFFFFF";
        gtx.fillRect(0, 0, gtx.canvas.width, gtx.canvas.height);
        var width = grid.length;
        var height = grid[0].length;
        var colour = activePiece.createPolyColor();
        for (var i = 0; i < activePiece.length; i++) {
            this.renderBlock(gtx, activePiece.blocks[i].x * cellWidth, activePiece.blocks[i].y * cellHeight, cellWidth, cellHeight, colour);
        }
    };
    /**
     * Return true if move was possible, other false.
     *
     * @argument xMod {number} Change in x position.
     * @argument yMod {number} Change in y position.
     * @returns {boolean}
     */
    PolytrisGame.prototype.moveCurrentPiece = function (xMod, yMod) {
        var canMovePiece = true;
        for (var i = 0; i < this.currentPiece.length; i++) {
            var x = this.currentPiece.blocks[i].x + xMod;
            var y = this.currentPiece.blocks[i].y + yMod;
            if (y < 0) {
                y = 0;
            }
            if (y == this.gridHeight ||
                !(x >= 0 && x < this.gridWidth) ||
                this.gameGrid[x][y] != 0) {
                canMovePiece = false;
            }
        }
        if (canMovePiece) {
            for (var i = 0; i < this.currentPiece.length; i++) {
                this.currentPiece.blocks[i].y += yMod;
                this.currentPiece.blocks[i].x += xMod;
            }
        }
        return canMovePiece;
    };
    PolytrisGame.prototype.tickPiece = function () {
        if (!this.moveCurrentPiece(0, 1)) {
            for (var i = 0; i < this.currentPiece.length; i++) {
                this.gameGrid[this.currentPiece.blocks[i].x][this.currentPiece.blocks[i].y] = this.currentPiece.createPolyColor();
            }
            this.checkLines();
            this.currentPiece = this.nextPiece;
            // translate piece to middle of the grid
            if (!this.moveCurrentPiece(this.gridWidth / 2, 0)) {
                // game over handled by next tick so a render can happen.
                this.gameOver = true;
            }
            else {
                this.nextPiece = this.spawnPiece();
            }
        }
    };
    PolytrisGame.prototype.writeStatus = function (message) {
        var statusElement = document.getElementById("status");
        if (statusElement) {
            statusElement.innerHTML = message;
        }
    };
    PolytrisGame.prototype.calculateLineClearedBonus = function (linesCleared) {
        var base = (this.level + 1) * 25;
        var bonus = base * Math.pow(3.5, linesCleared - 1);
        bonus = Math.floor(bonus);
        return bonus;
    };
    PolytrisGame.prototype.calculateLevelUp = function () {
        var earnedLevel = Math.floor(this.linesCleared / 10);
        if (earnedLevel > 20) {
            earnedLevel = 20;
        }
        if (earnedLevel > this.level) {
            this.level = earnedLevel;
            switch (this.level) {
                case 0:
                    this.logicTicks = 53;
                    break;
                case 1:
                    this.logicTicks = 49;
                    break;
                case 2:
                    this.logicTicks = 45;
                    break;
                case 3:
                    this.logicTicks = 41;
                    break;
                case 4:
                    this.logicTicks = 37;
                    break;
                case 5:
                    this.logicTicks = 33;
                    break;
                case 6:
                    this.logicTicks = 28;
                    break;
                case 7:
                    this.logicTicks = 22;
                    break;
                case 8:
                    this.logicTicks = 17;
                    break;
                case 9:
                    this.logicTicks = 11;
                    break;
                case 10:
                    this.logicTicks = 10;
                    break;
                case 11:
                    this.logicTicks = 9;
                    break;
                case 12:
                    this.logicTicks = 8;
                    break;
                case 13:
                    this.logicTicks = 7;
                    break;
                case 14:
                    this.logicTicks = 6;
                    break;
                case 15:
                    this.logicTicks = 6;
                    break;
                case 16:
                    this.logicTicks = 5;
                    break;
                case 17:
                    this.logicTicks = 5;
                    break;
                case 18:
                    this.logicTicks = 4;
                    break;
                case 19:
                    this.logicTicks = 4;
                    break;
                case 20:
                    this.logicTicks = 3;
                    break;
                default:
                    this.logicTicks = 3;
                    break;
            }
            this.currentTick = 0;
        }
    };
    PolytrisGame.prototype.checkLines = function () {
        var removedLines = new Array();
        for (var j = this.gridHeight - 1; j >= 0; j--) {
            var clearLine = true;
            for (var i = 0; i < this.gridWidth; i++) {
                if (this.gameGrid[i][j] == 0) {
                    clearLine = false;
                    break;
                }
            }
            if (clearLine) {
                removedLines.push(j);
            }
        }
        if (removedLines.length > 0) {
            this.linesToRemove = removedLines;
            this.removingLinesFrames = this.removingLinesFramesDelay;
            return true;
        }
        return false;
    };
    PolytrisGame.prototype.removeLines = function () {
        var linesAdded = 0;
        var addedLineCount = this.gridHeight - 1;
        var newGameGrid = PolytrisGame.createGrid(this.gridWidth, this.gridHeight);
        for (var j = this.gridHeight - 1; j >= 0; j--) {
            var clearLine = true;
            for (var i = 0; i < this.gridWidth; i++) {
                if (this.gameGrid[i][j] == 0) {
                    clearLine = false;
                    break;
                }
            }
            if (clearLine) {
                linesAdded++;
            }
            else {
                for (var i = 0; i < this.gridWidth; i++) {
                    newGameGrid[i][addedLineCount] = this.gameGrid[i][j];
                }
                addedLineCount--;
            }
        }
        if (linesAdded > 0) {
            this.score += this.calculateLineClearedBonus(linesAdded);
        }
        this.linesCleared += linesAdded;
        this.gameGrid = newGameGrid;
        this.calculateLevelUp();
    };
    PolytrisGame.prototype.dropPiece = function () {
        while (this.moveCurrentPiece(0, 1)) { }
        this.tickPiece();
    };
    /**
     * Rotates the current piece clockwise. Returns true if the move was possible.
     */
    PolytrisGame.prototype.rotateCurrentPieceClockwise = function () {
        var clone = this.currentPiece.rotateClockwise();
        var canMovePiece = true;
        for (var i = 0; i < clone.length; i++) {
            var x = clone.blocks[i].x;
            var y = clone.blocks[i].y;
            if (y < 0) {
                y = 0;
            }
            if (y == this.gridHeight ||
                !(x >= 0 && x < this.gridWidth) ||
                this.gameGrid[x][y] != 0) {
                canMovePiece = false;
            }
        }
        if (canMovePiece) {
            this.currentPiece = clone;
        }
        return canMovePiece;
    };
    /**
     * Rotates the current piece anticlockwise. Returns true if the move was possible.
     */
    PolytrisGame.prototype.rotateCurrentPieceAntiClockwise = function () {
        var clone = this.currentPiece.rotateAntiClockwise();
        var canMovePiece = true;
        for (var i = 0; i < clone.length; i++) {
            var x = clone.blocks[i].x;
            var y = clone.blocks[i].y;
            if (y < 0) {
                y = 0;
            }
            if (y == this.gridHeight ||
                !(x >= 0 && x < this.gridWidth) ||
                this.gameGrid[x][y] != 0) {
                canMovePiece = false;
            }
        }
        if (canMovePiece) {
            this.currentPiece = clone;
        }
        return canMovePiece;
    };
    PolytrisGame.prototype.rebuildGtx = function () {
        this.mainGtx = document.getElementById("gtx").getContext("2d");
        this.previewGtx = document.getElementById("preview_gtx").getContext("2d");
    };
    PolytrisGame.prototype.startGame = function () {
        this.rebuildGtx();
        this.currentPiece = this.spawnPiece();
        this.moveCurrentPiece(this.gridWidth / 2, 0);
        this.nextPiece = this.spawnPiece();
        setInterval(this.tick, 17);
    };
    return PolytrisGame;
}());
