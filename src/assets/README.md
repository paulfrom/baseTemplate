# assets

静态资源目录，对应公司模板的 `src/assets`（svg / 图片等由代码 import 的资源）。

页面私有的插图仍放在页面目录内（例如 `src/pages/Portal/PlatformIllustration.tsx`）；
只有跨页面共享的图片、插画文件才放这里，避免同一份资源出现两处。
