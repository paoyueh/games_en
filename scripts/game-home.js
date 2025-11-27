// scripts/game-home.js

function initGameHome() {
  renderGameInfoCommon(); // 共用：顯示主題與單字數
}

document.addEventListener("DOMContentLoaded", () => {
  loadWordBankCommon(initGameHome);
});
