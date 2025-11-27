// scripts/stage4.js

let stage4CurrentWord = null;
let stage4Answer = "";
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

  // 重置火車狀態
  train.classList.remove("train-move", "train-flash");
  train.style.visibility = "visible";
  train.style.transition = "none";
  train.style.transform = "translateX(0)";

  cars.innerHTML = "";
  pool.innerHTML = "";
  progress.textContent = "";

  // 隨機挑一個單字
  const randIndex = Math.floor(Math.random() * ACTIVE_WORDS.length);
  stage4CurrentWord = ACTIVE_WORDS[randIndex];

  const zh = stage4CurrentWord.zh;
  const visual = getWordVisual(stage4CurrentWord);

  document.getElementById("stage4-zh").textContent = zh;
  document.getElementById("stage4-img").innerHTML = visual;

  // 題目一出來念一次英文
  speak(stage4CurrentWord.en, "en-US");

  // 正確拼字（只保留 a-z）
  stage4Answer = (stage4CurrentWord.en || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  const letters = stage4Answer.split("");

  // 建立車廂 slot
  letters.forEach(() => {
    const slot = document.createElement("div");
    slot.className = "letter-slot";
    slot.addEventListener("click", () => onStage4SlotClick(slot));
    cars.appendChild(slot);
  });

  // 建立字母池（亂數順序）
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
  empty.dataset.btnIndex = btn.dataset.index;

  btn.disabled = true;
  btn.classList.add("used");
}

function onStage4SlotClick(slot) {
  if (stage4GameOver) return;
  if (!slot.dataset.char) return;

  const btnIndex = slot.dataset.btnIndex;
  if (btnIndex != null) {
    const poolBtn = document.querySelector(
      `#stage4-letter-pool .letter-tile[data-index="${btnIndex}"]`
    );
    if (poolBtn) {
      poolBtn.disabled = false;
      poolBtn.classList.remove("used");
    }
  }

  slot.textContent = "";
  delete slot.dataset.char;
  delete slot.dataset.btnIndex;
}

function onStage4Start() {
  if (stage4GameOver) return;

  const train = document.getElementById("stage4-train");
  const area = document.getElementById("stage4-train-area");
  const cars = document.querySelectorAll("#stage4-train-cars .letter-slot");
  const progress = document.getElementById("stage4-progress");

  const spelling = Array.from(cars)
    .map((s) => s.dataset.char || "")
    .join("");

  const correct = spelling === stage4Answer && spelling.length > 0;

  if (correct) {
    // ✅ 答對：火車一路開到內容區塊最左側，再換下一題
    progress.textContent = "太棒了！拼字正確，火車出發囉～";
    speak(stage4CurrentWord.en, "en-US");

    // 計算要往左移動多少距離：從目前位置 → 左邊界
    const areaWidth = area.clientWidth;
    const trainWidth = train.offsetWidth;
    let distance = areaWidth - trainWidth;
    if (distance < 0) distance = 0;

    // 先重置，再啟動動畫
    train.classList.remove("train-flash");
    train.style.transition = "none";
    train.style.transform = "translateX(0)";

    // 下一幀才加 transition，避免瞬移
    requestAnimationFrame(() => {
      train.style.transition = "transform 1.2s ease";
      train.style.transform = `translateX(-${distance}px)`;
    });

    stage4DoneCount++;
    document.getElementById("stage4-done").textContent =
      stage4DoneCount.toString();

    setTimeout(() => {
      if (stage4DoneCount >= 10) {
        finishStage4Game();
      } else {
        prepareStage4Train();
      }
    }, 1300);
  } else {
    // ❌ 答錯：閃一下後換題
    progress.textContent = "這次拼錯了，火車閃一下，換下一題試試看。";

    train.classList.remove("train-move");
    train.classList.add("train-flash");

    speak("Oops! Try again! 再試一次！", "en-US");

    setTimeout(() => {
      train.style.visibility = "hidden";
    }, 700);

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
