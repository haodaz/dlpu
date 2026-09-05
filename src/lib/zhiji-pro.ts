export function showZhijiPro(opts?: { related_dialogues_id?: string; value?: string }) {
  const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
  const proxyWin = isWeChat ? null : window.open('about:blank', '_blank');

  const { related_dialogues_id, value } = opts || {};
  // 如果传了 related_dialogues_id 但没有 value，用有意义的转介开场白
  const DEFAULT_HANDOFF_GREETING = '你好，我刚从知己群体智能转介过来。我们开始聊天吧？';
  const resolvedValue = related_dialogues_id ? (value || DEFAULT_HANDOFF_GREETING) : value;

  fetch('/api/auth/login-token-v2')
    .then(r => r.json())
    .then(data => {
      if (data.isLocal) {
        if (proxyWin) proxyWin.close();
        alert('本地账号无法跳转到知己Pro，请先登录正式账号');
        return;
      }
      if (!data.ok) {
        if (proxyWin) proxyWin.close();
        alert('获取跳转token失败: ' + (data.error || '未知错误'));
        return;
      }
      const { account, tempToken } = data;
      const host = process.env.NEXT_PUBLIC_ZHIJI_HOST || 'https://ask.mesquareai.com';
      const params = new URLSearchParams();
      params.set('account', account);
      params.set('token', tempToken);
      if (related_dialogues_id) params.set('related_dialogues_id', related_dialogues_id);
      if (resolvedValue) params.set('value', resolvedValue);
      const targetUrl = `${host}/ai-agent_chat?${params.toString()}`;
      if (isWeChat) {
        location.href = targetUrl;
      } else if (proxyWin) {
        proxyWin.location.href = targetUrl;
      } else {
        window.open(targetUrl, '_blank');
      }
    })
    .catch(err => {
      if (proxyWin) proxyWin.close();
      alert('跳转失败: ' + err.message);
    });
}