
(function(){
	var Othello = function(boardSize){
		var game = this,
			WHITE = "white",
			BLACK = "black",
			EMPTY = "empty";
		
		
		//util
		
		game.cellBinding = function(x,y){
			return game.binding.childArrays.rows[y] && game.binding.childArrays.rows[y].childArrays.columns[x];
		};
		
		game.set = function(x,y, value, prop){
			prop = prop || "value";
			return game.cellBinding(x,y).data[prop] = value;
		}
		
		game.get = function(x,y, prop){
			var binding = game.cellBinding(x,y);
			prop = prop || "value";		
			return binding && binding.data[prop];
		}
		
		
		
		//setup
		
		game.makeBoard = function(n){
			var DEFAULT = 8,
				board = [];
				
			game.boardSize = n || DEFAULT;
			return Array(game.boardSize).fill().map(game.makeBoardRow);
		};
		
		game.makeBoardRow = function(){
			return {columns: Array(game.boardSize).fill(EMPTY)};
		};
		
		game.placeInitialPieces = function(){
			var n = Math.floor(game.boardSize/2 - 1);
			
			game.set(n,n,WHITE);
			game.set(n,n+1,BLACK);
			game.set(n+1,n,BLACK);
			game.set(n+1,n+1,WHITE);
			
			return game.binding;
		};

		game.init = function(){
			var config = {logic: {placePiece: game.placePiece}},
				data = {rows: game.makeBoard(boardSize), players: {}, showHints: true};
				
			data.players[WHITE] = {score: 0};
			data.players[BLACK] = {score: 0};
			game.binding = new SimpleDataBinding("body", data, config);
			game.placeInitialPieces();
			game.binding.data.currentTurn = WHITE;
			game.showPossibleFlips();
		};
		
		
		
		//turn
		
		game.showPossibleFlips = function(){
			for(var row = 0; row < game.boardSize; row++){
				for(var cell = 0; cell < game.boardSize; cell++){
					game.set(row, cell, game.checkAllVectors(row, cell, game.binding.data.currentTurn) || "", "possibleFlips");
				}
			}
		}
		
		game.checkAllVectors = function(x, y, playerColor){
			var cellBinding = game.cellBinding(x, y);
			cellBinding.bindingsToFlip = cellBinding.bindingsToFlip || [];
			cellBinding.bindingsToFlip.length = 0;	
			possibleFlips = 0;
			possibleFlips += game.checkVector(x, y, 1, 0, playerColor);
			possibleFlips += game.checkVector(x, y, 1, -1, playerColor);
			possibleFlips += game.checkVector(x, y, 0, -1, playerColor);
			possibleFlips += game.checkVector(x, y, -1, -1, playerColor);
			possibleFlips += game.checkVector(x, y, -1, 0, playerColor);
			possibleFlips += game.checkVector(x, y, -1, 1, playerColor);
			possibleFlips += game.checkVector(x, y, 0, 1, playerColor);
			possibleFlips += game.checkVector(x, y, 1, 1, playerColor);
			return possibleFlips;
		};

		game.checkVector = function(x, y, xDif, yDif, playerColor){
			if(game.get(x,y) === EMPTY){				
				var point = {x: x + xDif, y: y + yDif},
					sandwiching = false,
					bindingsToFlip = [];
				
				while(game.checkNeighbor(point, game.oppositeColor(playerColor))){
					bindingsToFlip.push(game.cellBinding(point.x, point.y));
					point.x += xDif;
					point.y += yDif;
				}
				
				if(bindingsToFlip.length){
					sandwiching = game.checkNeighbor(point, playerColor);
					if(sandwiching){
						game.cellBinding(x,y).bindingsToFlip.push.apply(game.cellBinding(x,y).bindingsToFlip, bindingsToFlip);
						return bindingsToFlip.length;
					}
				}
			}			
			return 0;
		};
		
		game.flipAffectedPieces = function(x, y){
			var playerBinding = game.binding.children.players.children[game.binding.data.currentTurn];
			return game.cellBinding(x,y).bindingsToFlip.forEach(function(binding){
				binding.data.value = game.oppositeColor(binding.data.value);
				playerBinding.data.score++;
			});
		};
		
		game.checkNeighbor = function(point, color){
			return game.get(point.x, point.y) === color;
		};
		
		game.oppositeColor = function(color){
			return color === BLACK ? WHITE : BLACK;
		};
		
		game.placePiece = function(e, cell){
			if(this.data.possibleFlips){
				var x = cell.cellIndex,
					y = cell.parentNode.rowIndex;
				
				game.flipAffectedPieces(x, y);
				game.set(x, y, game.binding.data.currentTurn);
				game.binding.data.currentTurn = game.oppositeColor(game.binding.data.currentTurn);
				game.showPossibleFlips();
			}
		}
		
		
		
		game.init();
	}
	
	window.game = new Othello();
	
})()

