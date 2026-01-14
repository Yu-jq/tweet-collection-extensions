const SAVE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
const CHECK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

interface Tweet {
  id: string;
  userName: string;
  userHandle: string;
  text: string;
  images: string[];
  videoUrl: string;
  url: string;
  timestamp: string;
  captured: string;
}

// 缓存已抓取的推文 URL
let capturedUrls = new Set<string>();

// 初始化：加载已抓取的 URL
async function initCapturedUrls() {
  try {
    const result = await chrome.storage.local.get(['tweets']);
    const tweets: Tweet[] = result.tweets || [];
    capturedUrls = new Set(tweets.map(t => t.url));
  } catch (error) {
    console.error('Error loading captured URLs:', error);
  }
}

// 监听 storage 变化，更新缓存
chrome.storage.onChanged.addListener((changes) => {
  if (changes.tweets?.newValue) {
    const tweets: Tweet[] = changes.tweets.newValue;
    capturedUrls = new Set(tweets.map(t => t.url));
    updateAllButtons();
  }
});

function extractTweetData(article: Element): Tweet | null {
  const userLink = article.querySelector('a[role="link"][href^="/"]');
  const tweetLink = article.querySelector('a[href*="/status/"]')?.getAttribute('href');
  
  if (!tweetLink) return null;
  
  const images: string[] = [];
  article.querySelectorAll('[data-testid="tweetPhoto"] img').forEach((img) => {
    const src = (img as HTMLImageElement).src;
    if (src && !src.includes('profile_images')) {
      images.push(src.split('?')[0] + '?format=jpg&name=large');
    }
  });

  const hasVideo = !!article.querySelector('video');
  const url = `https://twitter.com${tweetLink}`;

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userName: userLink?.textContent?.trim() || '',
    userHandle: userLink?.getAttribute('href') || '',
    text: article.querySelector('[data-testid="tweetText"]')?.textContent || '',
    images,
    videoUrl: hasVideo ? url : '',
    url,
    timestamp: article.querySelector('time')?.getAttribute('datetime') || new Date().toISOString(),
    captured: new Date().toISOString()
  };
}

async function saveTweet(data: Tweet): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(['tweets']);
    const tweets: Tweet[] = result.tweets || [];
    
    // 检查是否已存在（去重）
    if (tweets.some(t => t.url === data.url)) {
      return false;
    }
    
    tweets.unshift(data);
    await chrome.storage.local.set({ tweets });
    capturedUrls.add(data.url);
    return true;
  } catch (error) {
    console.error('Error saving tweet:', error);
    return false;
  }
}

function createButton(tweetUrl: string, article: Element): HTMLButtonElement {
  const isCaptured = capturedUrls.has(tweetUrl);
  
  const btn = document.createElement('button');
  btn.className = 'twitter-capture-btn' + (isCaptured ? ' captured' : '');
  btn.innerHTML = isCaptured 
    ? `${CHECK_ICON}<span>已抓取</span>`
    : `${SAVE_ICON}<span>抓取</span>`;
  btn.title = isCaptured ? '已抓取此推文' : '抓取推文';
  btn.disabled = isCaptured;
  btn.dataset.tweetUrl = tweetUrl;
  
  if (!isCaptured) {
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const data = extractTweetData(article);
      if (!data) return;
      
      const saved = await saveTweet(data);
      if (saved) {
        btn.classList.add('captured');
        btn.innerHTML = `${CHECK_ICON}<span>已抓取</span>`;
        btn.disabled = true;
        btn.title = '已抓取此推文';
      }
    };
  }
  
  return btn;
}

function updateAllButtons() {
  document.querySelectorAll('.twitter-capture-btn').forEach((btn) => {
    const tweetUrl = (btn as HTMLButtonElement).dataset.tweetUrl;
    if (tweetUrl && capturedUrls.has(tweetUrl)) {
      btn.classList.add('captured');
      btn.innerHTML = `${CHECK_ICON}<span>已抓取</span>`;
      (btn as HTMLButtonElement).disabled = true;
      btn.setAttribute('title', '已抓取此推文');
    }
  });
}

function observeTweets() {
  new MutationObserver(() => {
    document.querySelectorAll('article[data-testid="tweet"]').forEach((tweet) => {
      if (tweet.querySelector('.twitter-capture-btn')) return;
      
      const actions = tweet.querySelector('[role="group"]');
      if (!actions) return;

      const tweetLink = tweet.querySelector('a[href*="/status/"]')?.getAttribute('href');
      if (!tweetLink) return;
      
      const tweetUrl = `https://twitter.com${tweetLink}`;
      const btn = createButton(tweetUrl, tweet);

      const container = document.createElement('div');
      container.className = 'twitter-capture-container';
      container.appendChild(btn);
      actions.appendChild(container);
    });
  }).observe(document.body, { childList: true, subtree: true });
}

// 初始化并启动
initCapturedUrls().then(() => observeTweets());
