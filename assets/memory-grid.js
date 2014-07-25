(function($) {

var CLASS = {
  hideSolution: 'hide-solution',
  gameOver: 'game-over'
};
var $gameContent = $('#game-content');
var $gameBoard = $('#game-board');
var $dialogBox = $('#dialog-box');
var $dialogBoxTemplate = $('#dialog-box-template').html();
var $gridRowTemplate = $('#game-grid-row-template').html();
var $comboContainer = $('#combo-container');
var correctCheers = ['Cool!', 'Nice!', 'Wonderful!', 'You got this!', 'Booyah!', 'Amazing!', 'Excellent!', 'You\'re a pro!'];
var hideSolutionDuration = 1400;
var comboTimerId = 0;
var score = {
  current: 0,
  total: 0,
  combo: 0,
  comboMax: 0,
  requirement: 1,
  increase: function() {
    this.current++;
    this.total++;
    this.combo++;
    this.update();
  },
  resetToPrev: function() {
    this.total -= this.current;
    this.current = 0;
    this.update();
  },
  resetAll: function() {
    this.current = 0;
    this.total = 0;
    this.combo = 0;
    this.requirement = 2;
    this.update();
  },
  update: function() {
    $('#game-score').text(this.total);    
  }
};
var game = {  
  defaults: {
    rows: 2,
    cols: 2,
    level: 1,
    timeLimit: 3000 + hideSolutionDuration
  },
  extraTimePerLevel: 200,
  levelFailedTimerId: 0,
  resetBoardTimerId: 0,
  levelIsReady: false,
  nextLevel: function() {
    if (this.level%2 === 0) {
      this.increaseBoardSize();
    }
    score.current = 0;
    
    this.level++;
    this.timeLimit += this.level * this.extraTimePerLevel;    
    
    var msg = correctCheers[_.random(0, correctCheers.length-1)];
    showDialog({msg: msg});
    
    revealSolution();
    setTimeout(generateBoard, 850);
  },
  increaseBoardSize: function() {
    this.rows++;
    this.cols++;
  },
  resetBoard: function() {
    score.resetToPrev();
    generateBoard();
    revealSolution();
  },
  resetTimer: function() {
    clearTimeout(this.levelFailedTimerId);
    this.levelFailedTimerId = setTimeout(levelFailed, this.timeLimit);
    $('#game-timer')
        .addClass('update')
        .css({'transition-duration': this.timeLimit - hideSolutionDuration + 'ms'})
    setTimeout(function() {
      $('#game-timer').removeClass('update');
    }, hideSolutionDuration);
  },
  create: function() {
    score.resetAll();
    $.extend(game, game.defaults);    
    $gameContent.removeClass(CLASS.gameOver);        
    generateBoard();
    revealSolution();
    $gameContent.addClass('game-started');
  }
};

var generateBoard = function() {
  var totalItemCount = game.rows * game.cols;
  var _board = [];
  for (var i=0; i<totalItemCount; i++) {
    // generate initial set of answers
    if (i<score.requirement)
    	_board.push({correctItem: true});
    else
      _board.push({});
  }
  
  var shuffledBoard = _.shuffle(_board);
  var generatedBoard = [];
  for (var i=0; i<game.rows; i++) {
    // add a row of items for every x cols
    generatedBoard.push( {gridRow: shuffledBoard.splice(0, game.cols)} );
  }
  //console.log(finalBoard);
  
  var html = Mustache.render($gridRowTemplate, {gameBoard: generatedBoard});
  $gameBoard.html(html);
  setTimeout(function() {
    $('.game-grid-item').addClass('created');    
  }, 25);
  //$('#time-limit').html(game.timeLimit);
  game.resetTimer();
  showDialog({msg: 'Ready...'});
}

var solutionTimerId = 0;
var revealSolution = function() {
  var duration = hideSolutionDuration + (game.level * 50);
  $gameBoard.removeClass(CLASS.hideSolution);
  game.levelIsReady = false;
  // hide solution after 'x' milliseconds
  clearTimeout(solutionTimerId);
  if (duration) {
    solutionTimerId = setTimeout(function() {
      $gameBoard.addClass(CLASS.hideSolution);
      game.levelIsReady = true;
      //showDialog({msg: 'Go!'});
      solutionTimerId = 0;
    }, duration)
  }
}

var showDialog = function(templObj) {
  $dialogBox.html(Mustache.render($dialogBoxTemplate, templObj));
}

var levelFailed = function() {
  
  if (!game.levelIsReady)  {
    return
  }
  
  showDialog({
    msg: 'You made a booboo!',
    failed: true
  });
  clearTimeout(game.resetBoardTimerId);
  game.resetBoardTimerId = setTimeout(game.resetBoard, 1000);
}

var showCombo = function() {
  $comboContainer
    .addClass('update')
    .one('transitionend', function() {
      $(this).removeClass('update');
    });
  $('#current-combo-score').text(score.combo);
}

$('#game-content')
.on('click', '.game-grid-item:not(.selected)', function() {
  
  if (!game.levelIsReady)  {
    showDialog({msg: 'Wait till tiles dissappear!'});
    return
  }    
  
  if ($(this).is('.correct-item')) {
    
    clearTimeout(comboTimerId);
    comboTimerId = setTimeout(function() {
      if (score.combo > score.comboMax) {
        score.comboMax = score.combo;        
        showCombo();
      }
      $('#game-score-max-combo').text(score.comboMax);  
      score.combo = 0;
    }, 500);
    
    score.increase();

    if (score.current === score.requirement) {
      score.requirement++;
      game.nextLevel();
    }
    
  } else {
    
    $(this).addClass('failed');
    levelFailed();
    
  }
  
  $(this).addClass('selected');
})
.on('click', '#start-game', game.create);
  
})(jQuery)