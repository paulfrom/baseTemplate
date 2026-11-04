import {
  AppstoreOutlined,
  FundOutlined,
  MenuOutlined,
  MonitorOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ead/suid-icons"
import type { PortalIconKey } from "../app/portal-settings"

const ICON_MAP = {
  cockpit: FundOutlined,
  menu: MenuOutlined,
  apps: AppstoreOutlined,
  user: UserOutlined,
  settings: SettingOutlined,
  monitor: MonitorOutlined,
} satisfies Record<PortalIconKey, typeof FundOutlined>

export function PortalIcon({ icon }: { icon: PortalIconKey }) {
  const Icon = ICON_MAP[icon] ?? AppstoreOutlined
  return <Icon />
}
