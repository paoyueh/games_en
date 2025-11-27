// scripts/stage3.js

const STAGE3_MAX_FLOOR = 101;
let stage3Floor = 0;
let stage3CurrentWord = null;
let stage3QuestionType = "zh"; // zh / img / listen
let stage3Answered = false;
let stage3GameOver = false;

function initStage3Page() {
  renderGameInfoCommon();

  document.getElementById("stage3-next").addEventListener("click", () => {
    if (stage3GameOver) return;
    nextStage3Question();
  });

  document.getElementById("stage3-restart").addEventListener("click", () => {
    resetStage3Game();
  });

  document
    .getElementById("stage3-repeat-question")
    .addEventListener("click", () => {
      if (stage3QuestionType === "listen" && stage3CurrentWord) {
        speak(stage3CurrentWord.en, "en-US");
      }
    });

  resetStage3Game();
}

function resetStage3Game() {
  stage3Floor = 0;
  stage3GameOver = false;
  stage3Answered = false;
  updateStage3FloorUI(0, 0);
  const feedbackEl = document.getElementById("stage3-feedback");
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("ok", "error");

  document.getElementById("stage3-next").disabled = true;

  document.getElementById("stage3-question-type").textContent = "";
  document.getElementById("stage3-question-prompt").textContent = "";
  document.getElementById("stage3-options").innerHTML = "";
  document.getElementById("stage3-repeat-question").style.display = "none";

  nextStage3Question();
}

function nextStage3Question() {
  if (stage3GameOver) return;

  const feedbackEl = document.getElementById("stage3-feedback");
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("ok", "error");

  stage3Answered = false;
  document.getElementById("stage3-next").disabled = true;

  // 隨機選一個單字
  const randIndex = Math.floor(Math.random() * ACTIVE_WORDS.length);
  stage3CurrentWord = ACTIVE_WORDS[randIndex];

  // 隨機決定題型：0=看中文 1=看圖示 2=聽英文
  const r = Math.floor(Math.random() * 3);
  stage3QuestionType = r === 0 ? "zh" : r === 1 ? "img" : "listen";

  renderStage3Question();
  renderStage3Options();
}

function renderStage3Question() {
  const typeEl = document.getElementById("stage3-question-type");
  const promptEl = document.getElementById("stage3-question-prompt");
  const repeatBtn = document.getElementById("stage3-repeat-question");

  repeatBtn.style.display = "none";

  if (stage3QuestionType === "zh") {
    typeEl.textContent = "題型：看中文選英文";
    promptEl.innerHTML = `<span class="question-zh">${stage3CurrentWord.zh}</span>`;
  } else if (stage3QuestionType === "img") {
    typeEl.textContent = "題型：看圖示選英文";
    const visual = getWordVisual(stage3CurrentWord);
    promptEl.innerHTML = `<span class="question-img">${visual}</span>`;
  } else {
    typeEl.textContent = "題型：聽英文選英文";
    promptEl.textContent = "請聽題目，選出正確的英文單字。";
    repeatBtn.style.display = "inline-block";
    // 自動播放一次
    speak(stage3CurrentWord.en, "en-US");
  }
}

function renderStage3Options() {
  const container = document.getElementById("stage3-options");
  container.innerHTML = "";

  // 正確答案 + 3 個其他選項
  const correctEn = stage3CurrentWord.en;
  const others = shuffleArray(
    ACTIVE_WORDS.filter((w) => w.en !== correctEn)
  ).slice(0, 3);

  const options = shuffleArray([stage3CurrentWord].concat(others));

  options.forEach((w) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stage3-option-card";
    btn.textContent = w.en;
    btn.dataset.correct = w.en === correctEn ? "1" : "0";
    btn.addEventListener("click", () => onStage3OptionClick(btn));
    container.appendChild(btn);
  });
}

function onStage3OptionClick(btn) {
  if (stage3Answered || stage3GameOver) return;
  stage3Answered = true;

  const isCorrect = btn.dataset.correct === "1";
  const feedbackEl = document.getElementById("stage3-feedback");

  const allBtns = document.querySelectorAll(".stage3-option-card");
  allBtns.forEach((b) => (b.disabled = true));

  if (isCorrect) {
    feedbackEl.textContent = "Great Job！答對囉！";
    feedbackEl.classList.remove("error");
    feedbackEl.classList.add("ok");
    speak("Great job!", "en-US");

    const oldFloor = stage3Floor;
    stage3Floor = Math.min(STAGE3_MAX_FLOOR, stage3Floor + 10);
    updateStage3FloorUI(oldFloor, stage3Floor);

    if (stage3Floor >= STAGE3_MAX_FLOOR) {
      finishStage3Game();
      return;
    }
  } else {
    feedbackEl.textContent = "再試一次喔～這題答錯了。";
    feedbackEl.classList.remove("ok");
    feedbackEl.classList.add("error");
    // 英文 + 中文再試一次
    speak("Try again!", "en-US");
    setTimeout(() => {
      speak("再試一次！", "zh-TW");
    }, 400);

    const oldFloor = stage3Floor;
    stage3Floor = Math.max(0, stage3Floor - 5);
    updateStage3FloorUI(oldFloor, stage3Floor, true);
  }

  document.getElementById("stage3-next").disabled = false;
}

function updateStage3FloorUI(oldFloor, newFloor, isMinus = false) {
  const sidebarFloor = document.getElementById("stage3-floor");
  const textFloor = document.getElementById("building-floor-text");
  const tower = document.getElementById("building-tower");
  const changeEl = document.getElementById("building-change");
  const greatEl = document.getElementById("building-great");

  sidebarFloor.textContent = newFloor;
  textFloor.textContent = `${newFloor} 層`;

  // 重新畫大樓區塊（從下往上）
  tower.innerHTML = "";
  for (let i = 0; i < newFloor; i++) {
    const block = document.createElement("div");
    block.className = "building-block";
    tower.appendChild(block);
  }

  // 顯示樓層變化 +10 / -5
  const diff = newFloor - oldFloor;
  if (diff !== 0) {
    changeEl.textContent = diff > 0 ? `+${diff}` : `${diff}`;
    changeEl.style.color = diff > 0 ? "#2ecc71" : "#e74c3c";
    changeEl.classList.add("show");
    setTimeout(() => changeEl.classList.remove("show"), 700);
  }

  if (!isMinus && diff > 0) {
    greatEl.textContent = "Great Job!";
    setTimeout(() => {
      greatEl.textContent = "";
    }, 700);
  }
}

function finishStage3Game() {
  stage3GameOver = true;
  const feedbackEl = document.getElementById("stage3-feedback");
  feedbackEl.textContent = "恭喜完成 101 大樓！可以按「再玩一次」重新挑戰。";
  feedbackEl.classList.remove("error");
  feedbackEl.classList.add("ok");

  document.getElementById("stage3-next").disabled = true;

  // 停止出題：清掉題目與選項
  document.getElementById("stage3-question-type").textContent =
    "任務完成";
  document.getElementById("stage3-question-prompt").textContent =
    "101 大樓已經蓋滿囉！";

  const options = document.getElementById("stage3-options");
  options.innerHTML = "";

  showFireworks("🎆 恭喜完成 101 大樓！", 3000);

  // 將「重新開始」改為「再玩一次」文字（但功能一樣）
  const restartBtn = document.getElementById("stage3-restart");
  restartBtn.textContent = "🔁 再玩一次";
}

document.addEventListener("DOMContentLoaded", () => {
  loadWordBankCommon(() => {
    initStage3Page();
  });
});
