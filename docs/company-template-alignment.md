# 公司模板组件与页面规则

## 目标与当前状态

本仓库供业务人员生成和操作前端原型，数据、保存与流程状态均使用 Mock。生成的业务页面需要与公司开发模板采用相同的真实组件、表单复用方式与页面规则，便于开发人员按同一结构接续实现。

参考目录：`D:/资料合计/司库/sei-base-demo/sei-base-demo/frontend`。2026-11-04 已核查源码；baseTemplate 使用 React 18 / SUID 2.1.99，UI 和图标已统一使用公司包。工程外壳仍为 Vite / hash 路由，公司模板为 Umi 4 / dva / qiankun；工程目录、路由和宿主集成尚未完全一致，不得将组件接入表述为完整工程架构对齐。

内部 npm 源已写入本仓库 `.npmrc`，不包含凭据。不得自行实现一个同名 ExtTable 或 WorkFlow 来宣称一致。

`#/sample-request` 提供真实 ExtTable、本地新增/编辑/查看和真实 WorkFlow.Approve 示例，行操作使用 ActionButton 并按公司工具函数计算列宽。普通页面与流程入口复用 RequestForm。应用管理和菜单管理列表同样使用 ExtTable + Mock dataSource；驾驶舱内嵌明细不属于独立列表页。MSW Service Worker 在浏览器内拦截原型专用 BPM 路径，所有响应为 Mock；构建产物也保留此模拟层，不连接真实 BPM。浏览器需支持 Service Worker（localhost 或 HTTPS）。未覆盖的原型 BPM 请求返回明确失败，不穿透到服务端。

## 事实来源

以下路径相对公司模板目录；规则以实际文件为准（其 AGENTS.md 中 `.claude/rules/` 引用已漂移）。

| 内容 | 源码位置 |
| --- | --- |
| 技术栈、依赖版本 | `package.json`、`AGENTS.md` |
| 通用页面规则 | `.claude/business-dev.md` |
| 申请单与审批规则 | `.claude/application-form.md` |
| 列表范例 | `src/pages/SampleRequest/index.jsx` |
| 共用主表单 | `src/pages/SampleRequest/Form/index.jsx` |
| 审批入口 | `src/pages/SampleRequest/approve/` |
| 审批适配器 | `src/components/BpmApprovePageAdapter/index.jsx` |
| 公共组件导出 | `src/components/index.tsx` |
| 能力边界 | `CONTEXT.md` |

## 组件选择

| 场景 | 必须沿用的组件或模式 | Mock 边界 |
| --- | --- | --- |
| 列表 | SUID `ExtTable` | 无接口，使用 `dataSource`，查询、分页、选择和删除在本地处理 |
| 编辑与查看 | SUID `Form` 及字段组件，同一主表单 | 保存更新模块内 Mock 状态 |
| 下拉、树选择 | `ComboList`、`ComboTree` | 本地选项；配置、reader、onChange 不使用 useMemo/useCallback |
| 金额 | `MoneyInput`、`Money` | 本地字段 |
| 日期范围筛选 | `FilterDate` | 本地筛选 |
| 附件 | `Attachment` | 不访问 EDM；只读保留预览/下载，关闭上传/删除，禁止 disabled={readOnly} |
| 流程 | `WorkFlow.Approve` 与共用主表单 | 通过浏览器 MSW 模拟其 BPM 服务契约，不连接 BPM |

UI 优先使用 SUID 扩展组件，其次使用 SUID 基础组件，再复用已有项目封装。图标使用 `@ead/suid-icons`。不为转发 props 新建薄包装，不复制第二套通用表格、表单或流程组件。用户可见业务文案走 i18n key。

## 列表页面

- 新增等业务动作放 `toolbar.left`，按业务需要启用 quickSearch。
- 操作列固定左侧，位于业务列之前；启用选择时顺序为勾选、操作、业务列。
- 行按钮使用 `Space size={4}`；操作列宽度沿用模板 `getOperationColumnWidth` 的计算方式。
- Mock 数据、字段常量和交互放业务模块内。禁止保留远程 store、网关地址或真实请求作为备用路径。

## 编辑与流程页面

- 一个业务模块只维护一份主表单，普通新增、编辑、查看和流程入口共同使用，避免字段、校验和布局分叉。
- `requestId` 指定业务记录，`action` 决定可写或只读；审批入口传入的记录和动作优先。
- 共享 `MODULE_ACTION` 三态为 `LINK_VIEW`、`VIEW_APPROVE_FLOW`、`UPDATE_APPROVE_FLOW`；特殊节点仅在业务模块扩展。
- 普通页面显示保存和返回；流程模式隐藏主表单的独立操作，由流程容器承担操作。
- 公司模板审批薄壳通过 `BpmApprovePageAdapter` 注册主表单和页面模式；该组件目前是依赖 BPM 服务的接入契约，不得原样接入真实服务来实现原型。
- 流程演示的节点与动作结果由模块 Mock 提供，界面明确显示模拟状态；示例仅开放同意和退回，未实现的流程图、历史与配置入口不开放。

## 接入与验收顺序

1. 配置可用的内部 npm 源，核实 SUID 的实际版本、React 兼容性、类型与离线 API；不提交凭据。
2. 对照公司模板配置完成组件运行基础，依据实际依赖决定必须同步的工程设置；宿主认证、真实权限与服务端能力不进入原型。
3. 用一套 Mock 业务记录贯通列表、新增、编辑、查看和模拟流程，先验证真实组件再推广生成规则。
4. 替换被覆盖的旧实现，不保留兼容层；继续复用现有门户、主题和部署成果中适用的部分。
5. 执行 `npm run verify`，并浏览器验证查询、分页、保存、只读、流程表单复用与本地数据交互；未执行的验证不得标为通过。

现有 `src/modules` 与 hash 路由接线方式在工程调整完成前仍描述当前实现，不代表已经采用公司模板的 `src/pages` / Umi 路由。调整工程时同步修改 README 与 AGENTS，避免文档同时指导两套生成方式。
