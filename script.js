const board = document.getElementById("board");

// 9x9マスの将棋盤のセル作成
for (let y = 0; y < 9; y++) {
  for (let x = 0; x < 9; x++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    // 将棋の座標は右上が1九なので便宜的に表示(例：9一)
    const file = 9 - x;
    const rank = y + 1;
    cell.dataset.pos = `${file}${rank}`;
    cell.dataset.x = x;
    cell.dataset.y = y;
    board.appendChild(cell);
  }
}

// 駒の種類（漢字1字簡略版）
const pieceTypes = {
  FU: "歩",
  KY: "香",
  KE: "桂",
  GI: "銀",
  KI: "金",
  KA: "角",
  HI: "飛",
  OU: "王",
};

// 初期配置 (x,y, type, player)
const initialPieces = [
  { x: 0, y: 8, type: "KY", player: 1 },
  { x: 1, y: 8, type: "KE", player: 1 },
  { x: 2, y: 8, type: "GI", player: 1 },
  { x: 3, y: 8, type: "KI", player: 1 },
  { x: 4, y: 8, type: "OU", player: 1 },
  { x: 5, y: 8, type: "KI", player: 1 },
  { x: 6, y: 8, type: "GI", player: 1 },
  { x: 7, y: 8, type: "KE", player: 1 },
  { x: 8, y: 8, type: "KY", player: 1 },

  { x: 1, y: 7, type: "HI", player: 1 },
  { x: 7, y: 7, type: "KA", player: 1 },

  ...Array(9).fill(0).map((_, i) => ({ x: i, y: 6, type: "FU", player: 1 })),

  { x: 0, y: 0, type: "KY", player: 2 },
  { x: 1, y: 0, type: "KE", player: 2 },
  { x: 2, y: 0, type: "GI", player: 2 },
  { x: 3, y: 0, type: "KI", player: 2 },
  { x: 4, y: 0, type: "OU", player: 2 },
  { x: 5, y: 0, type: "KI", player: 2 },
  { x: 6, y: 0, type: "GI", player: 2 },
  { x: 7, y: 0, type: "KE", player: 2 },
  { x: 8, y: 0, type: "KY", player: 2 },

  { x: 7, y: 1, type: "HI", player: 2 },
  { x: 1, y: 1, type: "KA", player: 2 },

  ...Array(9).fill(0).map((_, i) => ({ x: i, y: 2, type: "FU", player: 2 })),
];

// 駒を保持する配列(9x9)
const piecesMap = Array.from({ length: 9 }, () => Array(9).fill(null));

// 駒オブジェクトを管理
let pieces = [];

// 盤上の駒をDOMに追加し配置する関数
function placePieces() {
  initialPieces.forEach(({ x, y, type, player }) => {
    const pieceEl = document.createElement("div");
    pieceEl.classList.add("piece");
    pieceEl.textContent = pieceTypes[type];
    // プレイヤー2は駒を反転させる
    if (player === 2) {
      pieceEl.style.transform = "rotate(180deg)";
    }

    pieceEl.dataset.x = x;
    pieceEl.dataset.y = y;
    pieceEl.dataset.type = type;
    pieceEl.dataset.player = player;

    // 位置はセルに合わせて絶対配置
    positionPiece(pieceEl, x, y);

    board.appendChild(pieceEl);

    piecesMap[y][x] = pieceEl;
    pieces.push(pieceEl);
  });
}

// 駒の絶対位置を盤の座標に基づいて設定
function positionPiece(pieceEl, x, y) {
  const cellSize = 50; // CSSでの1マスのサイズ
  pieceEl.style.left = x * cellSize + 2 + "px";
  pieceEl.style.top = y * cellSize + 2 + "px";
}

// クリックされた駒やマスの管理
let selectedPiece = null;

// 駒クリック時の処理
function onPieceClick(e) {
  const pieceEl = e.target;
  if (selectedPiece) {
    selectedPiece.classList.remove("selected");
    if (selectedPiece === pieceEl) {
      selectedPiece = null;
      return;
    }
  }
  selectedPiece = pieceEl;
  selectedPiece.classList.add("selected");
}

// 盤クリック時の処理（駒移動）
function onBoardClick(e) {
  if (!selectedPiece) return;

  const rect = board.getBoundingClientRect();
  const cellSize = 50;

  // クリック位置から盤上の座標を取得
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);

  if (x < 0 || x >= 9 || y < 0 || y >= 9) return;

  // 駒の現在座標
  const fromX = parseInt(selectedPiece.dataset.x);
  const fromY = parseInt(selectedPiece.dataset.y);

  // 移動先に同じプレイヤーの駒があれば移動不可
  const targetPiece = piecesMap[y][x];
  if (targetPiece && targetPiece.dataset.player === selectedPiece.dataset.player) {
    return; // 移動不可
  }

  // 駒をアニメーションで移動させる
  movePiece(selectedPiece, fromX, fromY, x, y);

  // 駒データ更新
  piecesMap[fromY][fromX] = null;
  if (targetPiece) {
    // 取った駒は一旦盤から消す（持ち駒は未実装）
    board.removeChild(targetPiece);
    pieces = pieces.filter(p => p !== targetPiece);
  }
  piecesMap[y][x] = selectedPiece;
  selectedPiece.dataset.x = x;
  selectedPiece.dataset.y = y;

  selectedPiece.classList.remove("selected");
  selectedPiece = null;
}

// 駒移動のアニメーション
function movePiece(pieceEl, fromX, fromY, toX, toY) {
  const cellSize = 50;
  pieceEl.classList.add("moving");

  // transformで移動距離を計算
  const dx = (toX - fromX) * cellSize;
  const dy = (toY - fromY) * cellSize;

  pieceEl.style.transition = "transform 0.3s ease";
  pieceEl.style.transform = `translate(${dx}px, ${dy}px)` + (pieceEl.dataset.player == 2 ? " rotate(180deg)" : "");

  pieceEl.addEventListener("transitionend", () => {
    pieceEl.style.transition = "";
    pieceEl.style.transform = pieceEl.dataset.player == 2 ? "rotate(180deg)" : "";
    // 左上の絶対位置を更新し、transformをリセット
    positionPiece(pieceEl, toX, toY);
    pieceEl.classList.remove("moving");
  }, { once: true });
}

// イベント登録
board.addEventListener("click", onBoardClick);

// 駒にクリックイベントを追加
function addPieceListeners() {
  pieces.forEach(piece => {
    piece.addEventListener("click", e => {
      e.stopPropagation(); // 盤クリックに伝播させない
      onPieceClick(e);
    });
  });
}

// 初期化
placePieces();
addPieceListeners();
