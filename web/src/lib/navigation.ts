/**
 * 安全返回：如果没有上一个页面或来自登录页，跳转到首页 /square
 * 使用 router.replace 避免首页留下多余的 history entry
 */
export function goBackSafe(router: { back: () => void; replace: (url: string) => void }) {
  const referrer = document.referrer;
  if (!referrer || referrer.includes('/login')) {
    router.replace('/square');
  } else {
    router.back();
  }
}
