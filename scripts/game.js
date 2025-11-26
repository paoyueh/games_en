let WORD_BANK = {};
let currentTopic = null;

async function loadWordBank() {
  try {
    const res = await fetch('word-bank.json');
    WORD_BANK = await res.json();
    console.log('字庫載入完成：', WORD_BANK);

    renderTopicSelector();
    document.getElementById('stage-section').innerHTML = '<p>請選擇主題開始遊戲！</p>';
  } catch (err) {
    console.error('無法讀取 word-bank.json：', err);
    document.getElementById('stage-section').innerHTML = '<p>載入字庫失敗。</p>';
  }
}

function renderTopicSelector() {
  const topicSelect = document.getElementById('topicSelect');
  topicSelect.innerHTML = '';

  const topics = Object.keys(WORD_BANK);

  topics.forEach(topic => {
    const op = document.createElement('option');
    op.value = topic;
    op.textContent = topic; 
    topicSelect.appendChild(op);
  });

  topicSelect.addEventListener('change', () => {
    currentTopic = topicSelect.value;
    console.log('已切換主題：', currentTopic);
  });

  currentTopic = topics[0];
  topicSelect.value = currentTopic;
}

window.addEventListener('DOMContentLoaded', loadWordBank);
