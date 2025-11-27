// scripts/stage4.js

let stage4CurrentWord = null;
let stage4Answer = "";
let stage4Spelling = "";
let stage4DoneCount = 0;
let stage4GameOver = false;

function initStage4Page() {
  renderGameInfoCommon();

  document.getElementById("stage4-start").addEventListener("click", () => {
    onStage4Start();
  });

  document.getElementById("stage4-reset").addEventListener("click", () => {
    resetStage4Game();
  });

  resetStage4Game();
}

function resetStage4Game() {
  stage4DoneCount = 0;
  stage4GameOver = false;
  document.getElementById("stage4-done").textContent = "0";
  document.getElementById("stage4-progress").textContent = "";
  prepareStage4Train();
}

function prepareStage4Train() {
  if (stage4GameOver) return;

  const train = document.getElementById("stage4-train");
  const cars = document.getElementById("stage4-train-cars");
  const pool = document.getElementById("stage4-letter-pool");
  const progress = document.getElementById("stage4-progress");

  // 清除狀態
  train.classList.remove("train-move", "train-leak");
  cars.innerHTML = "";
  pool.innerHTML = "";
  stage4Spelling = "";
  progress.textContent = "";

  // 隨機挑一個單字
  const randIndex = Math.floor(Math.random() * ACTIVE_WORDS.length);
  stage4CurrentWord = ACTIVE_WORDS[randIndex];
  const zh = stage4CurrentWord.zh;
  const visual = getWordVisual(stage4CurrentWord);

  document.getElementById("stage4-zh").textContent = zh;
  document.getElementById("stage4-img").innerHTML = visual;

  // 題目時順便念一次英文
  speak(stage4CurrentWord.en, "en-US");

  stage4Answer = (stage4CurrentWord.en || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  // 建立車廂（每個字母一個 slot）
  const letters = stage4Answer.split("");
  letters.forEach(() => {
    const slot = document.createElement("div");
    slot.className = "letter-slot";
    cars.appendChild(slot);
  });

  // 建立字母池（打亂順序）
  const shuffled = shuffleArray(letters);
  shuffled.forEach((ch, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "letter-tile big-letter";
    btn.textContent = ch.toUpperCase();
    btn.dataset.char = ch;
    btn.dataset.index = String(idx);
    btn.addEventListener("click", () => onStage4LetterClick(btn));
    pool.appendChild(btn);
  });
}

function onStage4LetterClick(btn) {
  if (stage4GameOver) return;
  if (btn.disabled) return;

  const cars = document.querySelectorAll("#stage4-train-cars .letter-slot");
  const empty = Array.from(cars).find((s) => !s.dataset.char);
  if (!empty) return;

  const ch = btn.dataset.char;
  empty.textContent = ch.toUpperCase();
  empty.dataset.char = ch;

  stage4Spelling += ch;
  btn.disabled = true;
  btn.classList.add("used");
}

function onStage4Start() {
  if (stage4GameOver) return;

  const train = document.getElementById("stage4-train");
  const progress = document.getElementById("stage4-progress");

  if (!stage4Answer || stage4Answer.length === 0) return;

  // 檢查是否填滿
  const cars = document.querySelectorAll("#stage4-train-cars .letter-slot");
  const filled = Array.from(cars).every((s) => s.dataset.char);
  if (!filled) {
    progress.textContent = "請先把所有字母放上車廂，再按出發喔！";
    return;
  }

  const spelling = Array.from(cars)
    .map((s) => s.dataset.char)
    .join("");

  const correct = spelling === stage4Answer;

  if (correct) {
    progress.textContent = "太棒了！拼字正確，火車出發囉～";
    speak(stage4CurrentWord.en, "en-US");
    train.classList.add("train-move");

    stage4DoneCount++;
    document.getElementById("stage4-done").textContent = stage4DoneCount.toString();

    setTimeout(() => {
      if (stage4DoneCount >= 10) {
        finishStage4Game();
      } else {
        prepareStage4Train();
      }
    }, 1700);
  } else {
    progress.textContent = "這次拼錯了，火車漏油啦～下一台再試試看。";
    train.classList.add("train-leak");
    speak("Oops! Try again! 再試一次！", "en-US");

    setTimeout(() => {
      prepareStage4Train();
    }, 2000);
  }
}

function finishStage4Game() {
  stage4GameOver = true;
  const progress = document.getElementById("stage4-progress");
  progress.textContent = "十輛火車都成功出發！恭喜完成～";

  showFireworks("🎆 火車全部裝滿啦！恭喜完成！", 3200);

  // 題目區暫停，僅保留「再玩一次」
  const pool = document.getElementById("stage4-letter-pool");
  pool.innerHTML = "";

  const cars = document.getElementById("stage4-train-cars");
  cars.innerHTML = "";

  const startBtn = document.getElementById("stage4-start");
  startBtn.disabled = true;

  const resetBtn = document.getElementById("stage4-reset");
  resetBtn.textContent = "🔁 再玩一次";
  resetBtn.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  loadWordBankCommon(() => {
    initStage4Page();
  });
});
