
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
			
			var data = game.cellBinding(x,y).data,
				oldValue = data[prop];
				
			if(prop === "value"){
				game.updateScore(value, oldValue);
			}
			return game.cellBinding(x,y).data[prop] = value;
		}
		
		game.get = function(x,y, prop){
			var binding = game.cellBinding(x,y);
			prop = prop || "value";		
			return binding && binding.data[prop];
		}
		
		game.updateScore = function(color, oldColor){
			var playersBindings = game.binding.children.players.children;
			
			if(oldColor !== EMPTY){
				playersBindings[oldColor].data.score--;
			}
			if(color !== EMPTY){
				playersBindings[color].data.score++;
			}
		}
		
		
		
		//setup
		
		game.makeBoard = function(n){
			var DEFAULT = 8,
				board = [];
				
			game.boardSize = n || DEFAULT;
			return Array(game.boardSize).fill().map(game.makeBoardRow);
		};
		
		game.makeBoardRow = function(row, rowIndex){
			return {columns: Array(game.boardSize).fill().map(function(col, colIndex){
					return game.state ? game.state.board[rowIndex][colIndex] : EMPTY;
				})
			};
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
			var config = {logic: game.logic},
				rawState = localStorage.getItem("othello"),
				data;

			game.state = rawState && JSON.parse(rawState);
			data = {players: {}, showHints: game.state ? game.state.data.showHints : true};
			data.players[BLACK] = {score: game.state ? game.state.data[BLACK] : 0};
			data.players[WHITE] = {score: game.state ? game.state.data[WHITE] : 0};
			data.rows = game.makeBoard(boardSize), 
			game.binding = new SimpleDataBinding("body", data, config);
			game.binding.data.currentTurn = game.state ? game.state.data.currentTurn : BLACK;
			if(! game.state){
				game.placeInitialPieces();
			}
			game.showPossibleFlips();
			return game;
		};
		
		
		
		//turn
		
		game.showPossibleFlips = function(){
			game.binding.data.pass = "";
			for(var row = 0; row < game.boardSize; row++){
				for(var cell = 0; cell < game.boardSize; cell++){
					game.set(row, cell, game.checkAllVectors(row, cell, game.binding.data.currentTurn) || "", "possibleFlips");
				}
			}
		}
		
		game.checkAllVectors = function(x, y, playerColor){
			var cellBinding = game.cellBinding(x, y);
			cellBinding.nodesToFlip = cellBinding.nodesToFlip || [];
			cellBinding.nodesToFlip.length = 0;	
			possibleFlips = 0;
			possibleFlips += game.checkVector(x, y, 1, 0, playerColor);
			possibleFlips += game.checkVector(x, y, 1, -1, playerColor);
			possibleFlips += game.checkVector(x, y, 0, -1, playerColor);
			possibleFlips += game.checkVector(x, y, -1, -1, playerColor);
			possibleFlips += game.checkVector(x, y, -1, 0, playerColor);
			possibleFlips += game.checkVector(x, y, -1, 1, playerColor);
			possibleFlips += game.checkVector(x, y, 0, 1, playerColor);
			possibleFlips += game.checkVector(x, y, 1, 1, playerColor);
			if(possibleFlips){
				game.binding.data.pass = "disabled";
			}
			return possibleFlips;
		};

		game.checkVector = function(x, y, xDif, yDif, playerColor){
			if(game.get(x,y) === EMPTY){				
				var point = {x: x + xDif, y: y + yDif},
					sandwiching = false,
					nodesToFlip = [];
				
				while(game.checkNeighbor(point, game.oppositeColor(playerColor))){
					nodesToFlip.push({x: point.x, y: point.y});
					point.x += xDif;
					point.y += yDif;
				}
				
				if(nodesToFlip.length){
					sandwiching = game.checkNeighbor(point, playerColor);
					if(sandwiching){
						game.cellBinding(x,y).nodesToFlip.push.apply(game.cellBinding(x,y).nodesToFlip, nodesToFlip);
						return nodesToFlip.length;
					}
				}
			}			
			return 0;
		};
		
		game.flipAffectedPieces = function(x, y){
			return game.cellBinding(x,y).nodesToFlip.forEach(function(node){
				game.set(node.x,node.y,game.oppositeColor(game.get(node.x,node.y)));
			});
		};
		
		game.checkNeighbor = function(point, color){
			return game.get(point.x, point.y) === color;
		};
		
		game.oppositeColor = function(color){
			return color === BLACK ? WHITE : BLACK;
		};
		
		game.saveState = function(){
			var data = game.binding.data,
				board = game.binding.childArrays.rows.map(function(rowBinding){
					return rowBinding.childArrays.columns.map(function(columnBinding){
						return columnBinding.data;
					})
				}),
				playersBindings = game.binding.children.players.children,
				black = playersBindings[BLACK].data.score,
				white = playersBindings[WHITE].data.score,
				state = {data: data, board: board};
			
			data.black = black;
			data.white = white;
			localStorage.setItem("othello", JSON.stringify(state));
			alert("Game saved.");
			return state;
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
		};
		
		
		// click handlers
		
		game.logic = {
			pass: function(){
				game.binding.data.currentTurn = game.oppositeColor(game.binding.data.currentTurn);
				game.showPossibleFlips();
			},
			reset: function(){
				if(confirm("Are you sure you want to reset the game?")){
					location.reload();
				}
			},
			clearSaved: function(showAlert){
				localStorage.setItem("othello", "");
				if(showAlert !== false){
					alert("Cleared saved from memory.");
				}
			},
			placePiece: game.placePiece,
			saveState: game.saveState
		}
		
		
		
		game.init();
	}
	
	window.game = new Othello();
	
})()

