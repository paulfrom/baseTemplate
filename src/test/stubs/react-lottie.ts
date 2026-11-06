/**
 * 测试环境里的 `react-lottie` 替身。
 *
 * 真实实现会在模块加载时初始化 `lottie-web`，而 lottie-web 依赖 canvas，
 * jsdom 没有 canvas 会直接抛错。页面测试不渲染动画，这里用空组件替代。
 */
export default function Lottie() {
  return null
}
