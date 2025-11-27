// scripts/stage1.js

let stage1CurrentWord = null;
let stage1Answer = "";
let stage1CurrentSpelling = "";

// 初始化 Stage1 頁面
function initStage1Page() {
  renderGameInfoCommon();
  buildStage1WordList();
  setupStage1Buttons();
}

function buildStage1WordList() {
  const listContainer = document.getElementById("stage1-wordList");
  if (!listContainer) return;

  listContainer.innerHTML = "";
  ACTIVE_WORDS.forEach((w, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "word-card";
    card.innerHTML = `
      <div class="word-card-img">${getWordVisual(w)}</div>
      <div class="word-card-en">${w.en}</div>
    `;
    card.addEventListener("click", () => {
      speak(w.en, "en-US");
      selectStage1Word(w, index);
    });
    listContainer.appendChild(card);
  });
}

function setupStage1Buttons() {
  const btnEn = document.getElementById("stage1-speak-en");
  const btnZh = document.getElementById("stage1-speak-zh");
  const btnSpell = document.getElementById("stage1-start-spell");

  if (btnEn) {
    btnEn.addEventListener("click", () => {
      if (stage1CurrentWord) speak(stage1CurrentWord.en, "en-US");
    });
  }
  if (btnZh) {
    btnZh.addEventListener("click", () => {
      if (stage1CurrentWord) speak(stage1CurrentWord.zh, "zh-TW");
    });
  }
  if (btnSpell) {
    btnSpell.addEventListener("click", () => {
      if (stage1CurrentWord) {
        // 重新用「逐格」動畫再顯示一次字母卡
        buildStage1Letters(true);
      }
    });
  }
}

function selectStage1Word(word, index) {
  stage1CurrentWord = word;

  const cardEl = document.getElementById("stage1-card");
  const titleEl = document.getElementById("stage1-currentTitle");
  const imgEl = document.getElementById("stage1-img");
  const enEl = document.getElementById("stage1-en");
  const zhEl = document.getElementById("stage1-zh");
  const feedbackEl = document.getElementById("stage1-spell-feedback");
  const displayEl = document.getElementById("stage1-spell-display");

  if (!cardEl) return;
  cardEl.classList.remove("hidden");

  titleEl.textContent = `現在練習第 ${index + 1} 個單字`;
  imgEl.innerHTML = getWordVisual(word);
  enEl.textContent = word.en;
  zhEl.textContent = word.zh || "";

  feedbackEl.textContent = "";
  displayEl.textContent = "";

  stage1Answer = (word.en || "").toLowerCase().replace(/[^a-z]/g, "");
  stage1CurrentSpelling = "";

  // 選完單字就直接顯示字母卡（不動畫）
  buildStage1Letters(false);
}

/**
 * 建立字母卡
 * @param {boolean} animated  true = 逐格出現；false = 一次全部顯示
 */
function buildStage1Letters(animated) {
  if (!stage1Answer) return;

  stage1CurrentSpelling = "";
  const lettersEl = document.getElementById("stage1-letters");
  const displayEl = document.getElementById("stage1-spell-display");
  const feedbackEl = document.getElementById("stage1-spell-feedback");

  lettersEl.innerHTML = "";
  displayEl.textContent = "";
  feedbackEl.textContent = "";

  const letters = stage1Answer.split("");
  const shuffled = shuffleArray(letters);

  const createTile = (ch) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "letter-tile";
    btn.textContent = ch.toUpperCase();
    btn.dataset.char = ch;
    btn.addEventListener("click", () => {
      if (stage1CurrentSpelling.length >= stage1Answer.length) return;
      stage1CurrentSpelling += ch;
      displayEl.textContent = stage1CurrentSpelling.toUpperCase();
      btn.disabled = true;
      btn.classList.add("used");

      if (stage1CurrentSpelling.length === stage1Answer.length) {
        checkStage1Spelling();
      }
    });
    return btn;
  };

  if (!animated) {
    // 直接全部加上去
    shuffled.forEach((ch) => {
      lettersEl.appendChild(createTile(ch));
    });
  } else {
    // 逐格動畫顯示
    let index = 0;
    const interval = setInterval(() => {
      if (index >= shuffled.length) {
        clearInterval(interval);
        return;
      }
      lettersEl.appendChild(createTile(shuffled[index]));
      index++;
    }, 180); // 每 0.18 秒一張
  }
}

function checkStage1Spelling() {
  const feedbackEl = document.getElementById("stage1-spell-feedback");
  if (!feedbackEl) return;

  if (stage1CurrentSpelling === stage1Answer) {
    feedbackEl.textContent = "Great Job！拼字正確！";
    feedbackEl.classList.remove("error");
    feedbackEl.classList.add("ok");
    speak("Great job!", "en-US");
  } else {
    feedbackEl.textContent = "再試一次喔～";
    feedbackEl.classList.remove("ok");
    feedbackEl.classList.add("error");
    speak("Try again! 再試一次！", "en-US");
  }
}

// 啟動
document.addEventListener("DOMContentLoaded", () => {
  loadWordBankCommon(() => {
    initStage1Page();
  });
});
