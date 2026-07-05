# Vision Design Platform Product Framework

本文档用于固定设计中台的产品框架、导航层级和工具纳入规则。后续新增工具、技能或外部系统时，先按这里的层级和属性判断归属，再进入实现。

参考框架来自 `UI3 Framework - Screen.png`：顶部为一级导航，第二行为二级导航，左侧为包/组导航，中间为工作台，右侧为属性栏。

## 1. 固定产品骨架

```
Design Center Shell
├── L0 Product Shell
│   ├── brand / workspace switch
│   ├── global search
│   ├── sync status
│   ├── account / role
│   └── settings
├── L1 Primary Domain
│   └── 顶部一级标题，用于表达业务域或治理域
├── L2 Secondary View
│   └── 第二行二级导航，用于表达当前业务域下的视图/工作流
├── L3 Package Navigation
│   └── 左侧包/组导航，用于表达可执行工具、资源组、项目组或能力模块
├── L4 Workbench Canvas
│   └── 中央工作台，用于承载真实工具 UI、表格、画布、导入导出、任务队列
└── L5 Inspector Panel
    └── 右侧属性栏，用于承载选区信息、参数、权限、状态、日志和上下文
```

## 2. 层级定义

| 层级 | 名称 | 作用 | 放什么 | 不放什么 |
| --- | --- | --- | --- | --- |
| L0 | Product Shell | 全局产品外壳 | workspace、搜索、同步、账号、设置 | 具体工具入口 |
| L1 | Primary Domain | 顶层业务域 | 资产治理、规范体系、项目管理、自动化、数据洞察 | 单个小工具 |
| L2 | Secondary View | 域内工作流 | 工作台、资产地图、Token 管理、组件库、模板市场、质量巡检 | 工具参数 |
| L3 | Package Navigation | 工具/资源包导航 | Open Design、切图工具、Figma 项目、Gallery、Templates、Uploads | 全局账号设置 |
| L4 | Workbench Canvas | 主操作区 | 实际工具 UI、编辑器、表格、画布、结果列表、导入导出 | 全局导航 |
| L5 | Inspector Panel | 上下文属性栏 | 选区属性、权限、状态、日志、当前工具 metadata | 主任务流程 |

## 3. 权限模型

权限只分三类：`owner`、`designer`、`viewer`。后续所有工具、资源和设置项都必须落到这三类权限中，不再扩展临时角色。

| 权限 | 定义 | 可做什么 | 不可做什么 |
| --- | --- | --- | --- |
| `viewer` | 查阅者 | 查看和下载公开资料；查看公开日报；使用无持久化、无共享写入的轻量工具 | 管理成员；修改共享资产；发布资源；运行高风险自动化 |
| `designer` | 设计协作者 | 使用设计工具；导入/生成/导出工作结果；管理自己有权限的设计资源；调优 skill 草稿 | 管理全局权限；删除共享资产；修改系统级集成 |
| `owner` | 空间负责人 | 管理成员、权限、集成、发布、资源上下架、风险操作和系统设置 | 无 |

默认权限规则：

1. 公开的 viaim 品牌资料资产对所有权限开放查阅和下载。
2. 本地即时工具如果不写共享库、不触发外部 API，可开放给 `viewer` 使用。
3. 需要导入、保存、发布、同步、生成共享结果的能力至少需要 `designer`。
4. 成员管理、权限配置、集成配置、删除、发布和高风险自动化必须是 `owner`。
5. 右侧属性栏必须显示当前对象的 `minimum_permission` 和当前账号是否可执行。

权限矩阵：

| 功能域 | Viewer | Designer | Owner |
| --- | --- | --- | --- |
| viaim 公开品牌资产 | 查看、下载 | 查看、下载、整理草稿 | 上下架、发布、权限和分类管理 |
| 切图调整工具 | 导入、预览、导出本地结果 | 导入、预览、导出本地结果 | 配置默认参数和工具策略 |
| OpenDesign | 查看开放说明和公开结果 | 使用工作台、运行生成、管理自己的项目 | 管理集成、runtime、仓库、风险操作 |
| Figma 项目 | 查看被公开的状态摘要 | 查看/分析文件状态、项目状态 | 成员管理、权限管理、空间配置 |
| AI 生图与反推 | 查看公开样例 | 生成图片、反推 prompt、结构化拆分 | 配置模型、额度、审核和安全策略 |
| Skill 平台 | 查看公开 skill 和文档 | 管理/调优草稿、导入资源、测试 | 发布 skill、管理内部/外部资源源 |
| 设计日报 | 查阅、搜索、收藏 | 补充标签和阅读状态 | 配置来源、发布、归档和审计 |
| 系统设置 | 查看个人信息 | 修改个人外观和局部偏好 | 账号、权限、集成、全局 token |

## 4. 一级导航分配

一级导航必须稳定。下面是基于当前需求重新分配后的一级导航。后续新增工具优先挂在已有一级域下，只有当工具代表新的长期产品域时才新增一级导航。

| L1 ID | 名称 | 定义 | 典型工具 |
| --- | --- | --- | --- |
| `brand-assets` | viaim 品牌资产 | 对内外开放的品牌资料、产品资料、视觉资产和下载中心 | PDF/PNG/SVG 预览、字体包、产品界面、品牌 skill |
| `toolbox` | 工具箱 | 单点效率工具和导入导出工具 | 切图调整、格式转换、批量处理 |
| `open-design` | OpenDesign | OpenDesign 作为开放的复杂一级域，承载生成、项目、agent、设计系统等能力 | OpenDesign 工作台、AI 生图、反向提示词、结构拆分 |
| `figma-projects` | Figma 项目 | Figma 文件、项目状态、成员和协作管理 | 文件状态、成员管理、权限分析 |
| `skill-platform` | Skill 平台 | skill 文件的内部/外部资源管理、提取、调优和版本治理 | 品牌 skill、产品设计 skill、skill 调优 |
| `design-daily` | 设计日报 | 设计日报、趋势、资料和历史查阅 | 日报列表、专题归档、来源索引 |
| `system` | 系统设置 | 账号、权限、主题、token、集成配置 | 设置、权限、审计日志 |

## 5. 二级导航建议

二级导航表达当前一级域下的工作方式，而不是工具清单。

| L2 ID | 名称 | 适用场景 |
| --- | --- | --- |
| `dashboard` | 工作台 | 当前域的总览、状态和最近任务 |
| `map` | 资产地图 | 文件、项目、工具、资源关系浏览 |
| `manage` | 管理 | CRUD、分组、权限、配置 |
| `operate` | 操作 | 真实执行工具、导入导出、批量处理 |
| `review` | 巡检 | 质量检查、差异比对、规范校验 |
| `history` | 历史 | 运行记录、版本、日志、归档 |
| `settings` | 设置 | 当前域或工具的配置项 |

## 6. 路由组合规则

`L1 + L2` 是工作区路由的唯一上游键。不同的一级导航和二级导航组合，必须切换到不同的 `L3 Package Navigation + L4 Workbench Canvas + L5 Inspector Panel`。

这意味着：

1. L3 不是全局固定列表，而是当前 `L1/L2 route` 下的包导航。
2. L4 工作台不是全局占位，而是当前 `L1/L2/L3` 对应的主操作 surface。
3. L5 属性栏不是全局固定表格，而是跟随当前 `L1/L2/L3/L4` 上下文切换 section。
4. 切换 L1 时，默认重置 L2 到该 L1 的默认视图，并重置 L3 到该 L1/L2 下的默认包。
5. 切换 L2 时，保留 L1，但必须重新计算 L3/L4/L5。
6. 切换 L3 时，只切换 L4/L5，不反向改变 L1/L2。

推荐数据结构：

```ts
type WorkspaceRoute = {
  l1Domain: string;
  l2View: string;
  defaultL3Package: string;
  l3Packages: L3Package[];
  workbench: WorkbenchDefinition;
  inspector: InspectorDefinition;
};
```

当前已知需求路由分配：

| L1 一级导航 | L2 二级导航 | L3 三级导航 | L4 工作台 | L5 属性栏 | 最低权限 |
| --- | --- | --- | --- | --- | --- |
| `brand-assets` viaim 品牌资产 | `public-library` 公开资料库 | 品牌规范 / 视觉资产 / 产品素材 / 字体包 / 产品界面 / 品牌 skill | 资源预览、筛选、PDF/PNG/SVG 查看、下载列表 | selection、asset metadata、download status | `viewer` |
| `toolbox` 工具箱 | `image-tools` 图片工具 | 切图调整 | 图片导入、切图参数、生成预览、结果下载 | parameters、preview status、export logs | `viewer` |
| `open-design` OpenDesign | `workspace` 工作台 | Projects / Runs / Agents / Templates | OpenDesign 项目与运行工作台 | run status、agent、project metadata | `designer` |
| `open-design` OpenDesign | `ai-create` AI 创作 | AI 生图 / 反向提示词 / 结构化拆分 | 生图、图片反推 prompt、结构化分析结果 | prompt params、model status、generation logs | `designer` |
| `open-design` OpenDesign | `integrations` 集成 | GitHub Repo / Local Runtime / Export | 外部仓库、runtime、导出配置 | integration status、risk、logs | `owner` |
| `figma-projects` Figma 项目 | `file-status` 设计文件管理状态 | 文件列表 / 页面状态 / 变更记录 / 权限状态 | Figma 文件表格、状态分析、变更检查 | file metadata、known people、analysis status | `designer` |
| `figma-projects` Figma 项目 | `member-management` 成员管理 | 成员 / 角色 / 空间 / 文件权限 | 成员表、角色分配、权限核查 | account、permissions、audit logs | `owner` |
| `skill-platform` Skill 平台 | `library` skill 文件库 | 品牌 skill / 产品设计 skill / 外部 skill / 内部 skill | skill 文件浏览、版本、来源、适用范围 | skill metadata、source、permission | `viewer` |
| `skill-platform` Skill 平台 | `tuning` 文件管理与调优 | 产品设计 skill 调优 / Prompt 模板 / 评估记录 | skill 编辑、调优、测试、版本草稿 | validation、diff、publish status | `designer` |
| `skill-platform` Skill 平台 | `resource-extraction` 资源提取 | 内部资源 / 外部资源 / 导入队列 | skill 资源提取、清洗、结构化入库 | source status、risk、logs | `designer` |
| `design-daily` 设计日报 | `browse` 日报查阅 | 最新日报 / 历史归档 / 专题 / 来源索引 | 日报阅读、筛选、搜索、收藏 | source metadata、coverage、tags | `viewer` |
| `design-daily` 设计日报 | `manage` 日报管理 | 发布队列 / 草稿 / 来源配置 | 日报编辑、发布、来源管理 | publish status、source health、logs | `owner` |
| `system` 系统设置 | `account-permission` 账号与权限 | 成员 / 角色 / 授权 / 审计 | 权限配置和成员管理 | account、permissions、audit logs | `owner` |
| `system` 系统设置 | `appearance` 外观与 token | 主题 / 字号 / 颜色 / 布局 token | 主题配置、保存、重置 | tokens、preview、change status | `designer` |
| `system` 系统设置 | `future-lab` 扩展预留 | 待归类工具 / 实验功能 / Backlog | 未成熟工具登记和评估 | risk、owner、integration state | `owner` |

AI 生图、图片反向提示词和结构化拆分暂时归入 `open-design / ai-create`，因为它们会与 OpenDesign 的生成、agent、模板和设计上下文高度耦合。若未来发展成独立的通用图片服务，再拆成 `toolbox / ai-media`。

## 7. 三级导航和包结构

三级导航是左侧包导航。它只属于当前 `L1 + L2` 组合，负责组织该路由下的工具包、资源包或项目包。

```
L3 Package
├── package id
├── package label
├── package type
│   ├── tool
│   ├── integration
│   ├── library
│   ├── project
│   ├── automation
│   └── settings
├── module entries
└── permission scope
```

三级导航判断规则：

1. 如果入口会打开一个可执行功能，归为 `tool`。
2. 如果入口代表外部系统连接，归为 `integration`。
3. 如果入口主要浏览/管理素材、模板、组件，归为 `library`。
4. 如果入口代表一组长期文件或项目，归为 `project`。
5. 如果入口会触发后台任务、agent 或定时流程，归为 `automation`。
6. 如果入口只调整配置，不承载业务数据，归为 `settings`。

## 8. 工作台区域规则

工作台必须承载“主要动作”，不要把主流程塞进右侧属性栏。

| 工作台类型 | 适用工具 | 主内容 |
| --- | --- | --- |
| `blank-canvas` | 尚未接入工具 | 空白占位、接入说明 |
| `table-workbench` | 项目管理、资产管理 | 表格、筛选、批量操作 |
| `canvas-workbench` | 视觉编辑、切图、排版 | 画布、预览、拖拽区 |
| `form-workbench` | 配置生成、导入导出 | 表单、参数、执行按钮 |
| `queue-workbench` | agent、自动化、批处理 | 队列、进度、日志 |
| `iframe-workbench` | 外部应用嵌入 | iframe 容器、状态栏、打开外部按钮 |

## 9. 右侧属性栏规则

右侧属性栏只展示当前上下文的次级信息和操作，不承担核心导航。

| Inspector Section | 内容 |
| --- | --- |
| `selection` | 当前选中工具、文件、项目、资源 |
| `account` | 登录状态、角色、权限 |
| `properties` | 当前对象参数 |
| `tokens` | 当前主题、颜色、字体、布局 token |
| `status` | 同步状态、队列状态、运行状态 |
| `logs` | 最近操作、错误、审计记录 |

## 10. 工具功能属性

新增工具时必须登记以下属性。

| 属性 | 可选值 | 用途 |
| --- | --- | --- |
| `tool_kind` | `native` / `external` / `embedded` / `cli` / `agent` | 决定接入方式 |
| `surface` | `canvas` / `table` / `form` / `queue` / `iframe` / `settings` | 决定工作台形态 |
| `data_source` | `none` / `local-file` / `browser` / `figma` / `github` / `feishu` / `api` | 决定数据权限和同步 |
| `execution` | `manual` / `batch` / `background` / `scheduled` | 决定任务和状态模型 |
| `persistence` | `none` / `localStorage` / `indexedDB` / `file` / `cloud` / `git` | 决定保存策略 |
| `permission` | `viewer` / `designer` / `owner` | 决定可见性和操作权限 |
| `risk_level` | `low` / `medium` / `high` | 决定是否需要确认、日志和回滚 |
| `integration_state` | `planned` / `stub` / `connected` / `stable` / `archived` | 决定 UI 状态 |

## 11. 推荐文档目录

当前只创建本入口文档。后续工具增多后，按下面目录拆分。

```
docs/
└── product-framework/
    ├── README.md
    ├── 00-shell-contract.md
    ├── 01-navigation-taxonomy.md
    ├── 02-tool-registry-schema.md
    ├── 03-tool-intake-template.md
    ├── 04-permission-and-account.md
    ├── 05-workbench-surfaces.md
    ├── 06-inspector-schema.md
    ├── 07-settings-and-tokens.md
    ├── 08-integration-patterns.md
    ├── 09-compatibility-checklist.md
    ├── registries/
    │   ├── tools.md
    │   ├── skills.md
    │   ├── integrations.md
    │   └── permissions.md
    └── decisions/
        └── YYYY-MM-DD-short-decision.md
```

## 12. 新工具纳入判断流程

后续你补充一个工具或技能时，按下面顺序判断。

1. 判断它是不是独立产品域。
   - 是：进入 L1 候选。
   - 否：进入已有 L1。
2. 判断它是工作流还是工具入口。
   - 工作流：进入 L2。
   - 工具入口：进入当前 L1/L2 下的 L3。
3. 确定 `L1 + L2` 路由组合。
   - 每个组合必须生成自己的 L3/L4/L5。
4. 判断主操作方式。
   - 表格、画布、表单、队列、iframe、设置。
5. 判断右侧属性栏需要什么。
   - selection、properties、status、logs、tokens、permissions。
6. 判断权限和账号依赖。
   - 是否需要飞书登录、GitHub、Figma、Open Design、本地文件权限。
7. 判断状态和风险。
   - 是否会写文件、调用 API、删除资源、推送代码、触发后台任务。
8. 输出登记结果。

## 13. 工具登记模板

```md
## Tool: <工具名称>

- `tool_id`:
- `display_name`:
- `one_line_value`:
- `l1_domain`:
- `l2_view`:
- `l3_package`:
- `workbench_surface`:
- `inspector_sections`:
- `tool_kind`:
- `data_source`:
- `execution`:
- `persistence`:
- `permission`:
- `risk_level`:
- `integration_state`:

### 主要功能

- 

### 输入

- 

### 输出

- 

### 兼容要求

- 

### 需要的设置项

- 

### 需要的权限

- 

### 初始实现建议

- 
```

## 14. 默认归类规则

| 用户补充内容 | 默认层级 |
| --- | --- |
| 单个小工具 | L3 package + L4 workbench |
| 一组同类工具 | L1 或 L2，视长期稳定性决定 |
| 外部应用接入 | L3 integration + L4 iframe/form |
| 项目管理 | L1 `figma-ops` 或 `asset-governance` + L2 `manage` |
| 切图/导出/格式转换 | L1 `toolbox` + L2 `operate` |
| 图库/模板/素材 | L1 `asset-governance` + L2 `map` 或 `manage` |
| 账号、权限、主题 | L1 `system` + L2 `settings` |
| agent、自动任务 | L1 `automation` + L2 `operate` 或 `history` |

## 15. 判定输出格式

后续每次你补充一个工具，我默认输出：

```md
### 判定结果

- L1:
- L2:
- L3:
- L4:
- L5:
- Tool kind:
- Surface:
- Data source:
- Permission:
- Risk:

### 为什么这样放

### 需要新增的配置

### 需要新增的 UI 区域

### 是否影响现有框架
```
