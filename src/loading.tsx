import { Flex, Spin } from '@ead/suid'

/** 全局加载态：路由懒加载与首屏等待时使用，与公司模板 `src/loading.tsx` 对应。 */
export default function Loading() {
  return (
    <Flex justify="center" align="center" className="layout-loading">
      <Spin size="large" />
    </Flex>
  )
}
