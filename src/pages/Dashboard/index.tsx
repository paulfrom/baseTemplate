import { Button, Layout, Result } from '@ead/suid'
import { Link } from '../../components/Link'
import { useCurrentUser } from '../../models/global'
import './dashboard.css'

const { Content } = Layout

/**
 * 工作台首页，迁自公司模板 `src/pages/Dashboard`。
 * 未登录时给出登录入口，登录后展示当前演示用户，避免在原型里堆假看板。
 */
export default function Dashboard() {
  const currentUser = useCurrentUser()

  return (
    <Layout className="dashboard-page">
      <Content>
        <Result
          icon="EADP"
          title="欢迎来到本模块进行开发"
          subTitle={
            currentUser
              ? `${currentUser.userName}，将复杂留给自己，把简单带给客户`
              : '将复杂留给自己，把简单带给客户'
          }
          extra={
            !currentUser && (
              <Button type="primary">
                <Link to="/user/login">去登录</Link>
              </Button>
            )
          }
        />
      </Content>
    </Layout>
  )
}
