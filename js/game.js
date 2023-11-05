var HORIZONTAL_BOARD_PIXELS = 320;
var VERTICAL_BOARD_PIXELS = 320;
var HORIZONTAL_CELL_PIXELS = 45.4;
var VERTICAL_CELL_PIXELS = 46;
var TOTAL_COLUMNS = 7;
var TOTAL_ROWS = 7;
var HUMAN_WIN_SCORE = -100;
var COMPUTER_WIN_SCORE = 100;
var NO_WIN_SCORE = 0;
var canvas;
var context;
var currentBoard;
var currentPlayer;
var $messageDiv;

var thinkNode = function (board) {
    this.board = new Array();
    this.score;

    this.setMove = function (col, row, player) {
        if (this.board[col].length < TOTAL_ROWS)
            this.board[col][row] = player;
    }

    for (var col = 0; col < TOTAL_COLUMNS; col++) {
        this.board[col] = new Array();
        for (var row = 0; row < board[col].length; row++)
            this.board[col][row] = board[col][row];
    }
}

var preloader = new function () {
    this.imageArray = new Array();
    this.countImagesToLoad = 0;

    this.preload = function (srcArray, allLoadedCallback) {
        this.countImagesToLoad += srcArray.length;
        for (var i = 0; i < srcArray.length; i++) {
            var image = new Image();
            image.onload = this.getImageLoadedCallback(this, allLoadedCallback);
            var src = srcArray[i];
            image.src = src;
            this.imageArray[src] = image;
        }
    }

    this.getImageLoadedCallback = function (preloaderObj, allLoadedCallback) {
        return function () {
            preloaderObj.countImagesToLoad--;
            if (preloaderObj.countImagesToLoad == 0)
                allLoadedCallback();
        }
    }

    this.getImage = function (src) {
        return this.imageArray[src];
    }
}

$(document).ready(function () {
    canvas = document.getElementById('canvas');
    if (canvas && canvas.getContext) {
        context = canvas.getContext('2d');
        $messageDiv = $('#message');
        preloader.preload(['images/board.jpg', 'images/token1.png', 'images/token2.png'], resetGame);
    }else {
        alert('Ваш браузер не поддерживает HTML5 Canvas.');
    }
});

function resetGame() {
    $('#canvas').unbind('click', resetGame);
	canvas.width = canvas.width;
    currentBoard = new Array();
    for (var col = 0; col < TOTAL_COLUMNS; col++)
        currentBoard[col] = new Array();
    goHumanTurn();
}

function goHumanTurn() {
    currentPlayer = 1;
    $messageDiv.text('Ваш ход.');
    $(canvas).click(boardClick);
}

function boardClick(event) {
    $('#canvas').unbind('click', boardClick);
    var x = event.pageX - $(event.target).offset().left;
    var col = Math.min(Math.floor(x / HORIZONTAL_CELL_PIXELS), TOTAL_COLUMNS - 1);
    var row = currentBoard[col].length;
    if (row < TOTAL_ROWS) {
        currentBoard[col][row] = currentPlayer;
        drawToken(col, row);

        if (checkWin(currentBoard, col, row, true)) {
            $messageDiv.text('You win! Click the board to restart.');
            $(canvas).click(resetGame);
        } else if (checkBoardFull(currentBoard)) {
            $messageDiv.text('Ничья! Нажмите на доску, чтобы перезапустить.');
            $(canvas).click(resetGame);
        } else {
            goComputerTurn();
        }
    } else {
        $(canvas).click(boardClick);
    }
}

function goComputerTurn() {
    currentPlayer = 2;
    $messageDiv.text('Компьютер думает...');
    setTimeout(makeComputerMove, 200);
}

function makeComputerMove() {
    var col;
    for (var depth = 0; depth <= 4; depth++) {
        var origin = new thinkNode(currentBoard);
        var tentativeCol = think(origin, 2, depth);

        if (origin.score == HUMAN_WIN_SCORE) {
            break;
        } else if (origin.score == COMPUTER_WIN_SCORE) {
            col = tentativeCol;
            break;
        } else {
            col = tentativeCol;
        }
    }

    var row = currentBoard[col].length;

    currentBoard[col][row] = currentPlayer;
    drawToken(col, row);

    if (checkWin(currentBoard, col, row, true)) {
        $messageDiv.text('Компьютер побеждает! Нажмите на доску, чтобы перезапустить.');
        $(canvas).click(resetGame);
    } else if (checkBoardFull(currentBoard)) {
        $messageDiv.text('Ничья! Нажмите на доску, чтобы перезапустить.');
        $(canvas).click(resetGame);
    } else {
        goHumanTurn();
    } 
}

function think(node, player, recursionsRemaining) {
    var childNodes = new Array();

    for (var col = 0; col < TOTAL_COLUMNS; col++) {
        var row = node.board[col].length;
        if (row < TOTAL_ROWS) {
            var childNode = new thinkNode(node.board);
            childNodes[col] = childNode;
            childNode.setMove(col, row, player);

            if (checkWin(childNode.board, col, row, false)) {
                if (player == 1) {
                    childNode.score = HUMAN_WIN_SCORE;
                } else {
                    childNode.score = COMPUTER_WIN_SCORE;
                }
            } else if (recursionsRemaining > 0) {
                var nextPlayer = (player == 1) ? 2 : 1;
                think(childNode, nextPlayer, recursionsRemaining - 1);
            } else {
                childNode.score = NO_WIN_SCORE;
            }

            if (node.score == undefined) {
                node.score = childNode.score;
            } else if (player == 1 && childNode.score < node.score) {
                node.score = childNode.score;
            } else if (player == 2 && childNode.score > node.score) {
                node.score = childNode.score;
            }
        }
    }

    var candidates = new Array();
    for (var col = 0; col < TOTAL_COLUMNS; col++)
        if (childNodes[col] != undefined && childNodes[col].score == node.score)
            candidates.push(col);
    var moveCol = candidates[Math.floor(Math.random() * candidates.length)];
    return moveCol;
}

function checkBoardFull(board) {
    for (var col = 0; col < TOTAL_COLUMNS; col++)
        if (board[col].length < TOTAL_ROWS)
            return false;

    return true;
}

function checkWin(board, lastMoveCol, lastMoveRow, isDrawWinLine) {
    var player = getTokenAt(board, lastMoveCol, lastMoveRow);

    if (checkWinHelper(board, player, lastMoveCol, lastMoveRow, 0, 1, isDrawWinLine)) {
        return true;
    } else if (checkWinHelper(board, player, lastMoveCol, lastMoveRow, 1, 0, isDrawWinLine)) {
        return true;
    } else if (checkWinHelper(board, player, lastMoveCol, lastMoveRow, 1, 1, isDrawWinLine)) {
        return true;
    } else if (checkWinHelper(board, player, lastMoveCol, lastMoveRow, 1, -1, isDrawWinLine)) {
        return true;
    } else {
        return false;
    }
}

function checkWinHelper(board, player, lastMoveCol, lastMoveRow, colStep, rowStep, isDrawWinLine) {
    var consecutiveCount = 0;

    for (var i = -3; i <= 3; i++) {
        if (getTokenAt(board, lastMoveCol + i * colStep, lastMoveRow + i * rowStep) == player) {
            consecutiveCount++;
            if (consecutiveCount == 4) {
                if (isDrawWinLine) {
                    drawWinLine(lastMoveCol + (i - 3) * colStep, lastMoveRow + (i - 3) * rowStep, lastMoveCol + i * colStep, lastMoveRow + i * rowStep);
                }
                return true;
            }
        } else {
            consecutiveCount = 0;
        }
    }

    return false;
}

function getTokenAt(board, col, row) {
    var token = 0;
    if (board[col] != undefined && board[col][row] != undefined)
        token = board[col][row];
    return token;
}

function drawToken(col, row) {
    var x = col * HORIZONTAL_CELL_PIXELS + 1;
    var y = VERTICAL_BOARD_PIXELS - (row + 1) * VERTICAL_CELL_PIXELS;

    if (currentPlayer == 1) {
        context.drawImage(preloader.getImage('images/token1.png'), x, y)
    } else {
        context.drawImage(preloader.getImage('images/token2.png'), x, y)
    }
}

function drawWinLine(startColIndex, startRowIndex, endColIndex, endRowIndex) {
    var startX = (startColIndex + 0.5) * HORIZONTAL_CELL_PIXELS + 1;
    var startY = VERTICAL_BOARD_PIXELS - (startRowIndex + 0.5) * VERTICAL_CELL_PIXELS;
    var endX = (endColIndex + 0.5) * HORIZONTAL_CELL_PIXELS + 1;
    var endY = VERTICAL_BOARD_PIXELS - (endRowIndex + 0.5) * VERTICAL_CELL_PIXELS;

    context.strokeStyle = "#28d300";
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
}