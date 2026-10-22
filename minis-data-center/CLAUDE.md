# gstack

所有网页浏览相关操作，统一使用 gstack 的 `/browse` 技能，不要使用 `mcp__claude-in-chrome__*` 工具。

## 推荐技能与作用说明

- `/office-hours` - 产品与需求脑暴。适合新想法、需求方向判断、用户场景梳理，先把问题、价值和最小切口想清楚再进入实现。
- `/plan-ceo-review` - 以创始人/CEO 视角重审方案。用于判断当前范围是否过小、是否值得扩展，或者是否需要反过来收敛到更高价值的版本。
- `/plan-eng-review` - 以工程经理视角锁定执行方案。用于开工前审查架构、数据流、边界条件、测试覆盖和性能风险。
- `/plan-design-review` - 设计方案预审。用于实现前检查页面层级、交互路径、视觉方向和整体体验是否站得住。
- `/design-consultation` - 建立或梳理设计系统。适合新项目、改版项目或视觉风格混乱的场景，用于沉淀色彩、字体、布局、动效等设计规则。
- `/design-html` - 将已冻结的设计规格收口为可运行 HTML 原型。适合 UI 路由 C 路径，或在已有设计方案后生成可运行 HTML 页面。
- `/review` - 提交前代码审查。重点检查结构性风险、潜在回归、SQL/边界问题和不合理的副作用，适合合并前把关。
- `/ship` - 标准交付流程。用于同步基线、执行测试、整理版本号与变更记录，并完成推送、提 PR 或发布前准备。
- `/setup-deploy` - 部署环境初始化。用于首次接入 `land-and-deploy` 前自动探测平台、生产 URL、健康检查和部署命令。
- `/browse` - 无头浏览器验站与网页操作。用于打开网页、复现问题、截图取证、验证交互流程；本项目所有网页浏览都应优先使用它。
- `/open-gstack-browser` - 拉起可视的 GStack Browser，并保持浏览器窗口稳定存活。适合需要用户亲自登录一次、需要共视页面、或需要等待人工操作后再继续自动化的场景。
- `/connect-chrome` - 在用户已完成可见浏览器登录后，让 AI 继续在可见 Chrome 中自动化。适合登录后继续跑页面验证、抓取证据或复现交互。
- `/qa` - QA 测试并闭环修复。用于系统性测试 Web 应用，发现问题后直接修复，再回归验证直到可交付。
- `/qa-only` - 只做 QA 报告，不改代码。适合先收集问题清单、复现步骤、风险等级和截图证据，再决定是否进入修复。
- `/design-review` - 设计质检与视觉打磨。用于检查间距、层级、对齐、一致性、交互动效和"AI 味"问题，并给出或直接完成优化。
- `/setup-browser-cookies` - 导入真实浏览器 Cookie。用于测试需要登录态、权限态或特定会话上下文的页面。
- `/retro` - 周度工程复盘。用于回顾一周内的提交、交付内容、协作节奏、代码质量趋势和后续改进点。
- `/investigate` - 根因导向的问题排查。适合处理报错、异常行为和疑难 Bug，要求先查明原因，再给出修复方案，而不是直接猜改。
- `/document-release` - 文档同步更新。用于功能完成后统一更新 README、ARCHITECTURE、CONTRIBUTING、CLAUDE、CHANGELOG 等文档，使文档与实际状态保持一致。
- `/codex` - 调用 OpenAI Codex 做二次分析。适合做独立代码审查、挑战现有实现、获取第二意见或辅助复杂问题分析。
- `/careful` - 高风险操作防护。用于删除、重置、线上排查等可能造成破坏的动作前增加提醒和确认。
- `/freeze` - 限定可编辑范围。用于把修改约束在某个目录或模块内，避免调试或修复时误改其他区域。
- `/guard` - 完整安全模式。结合 `/careful` 和 `/freeze`，适合高风险任务或需要严格控制改动边界的场景。
- `/unfreeze` - 解除编辑限制。用于结束受限编辑状态，恢复整个项目目录的正常可修改范围。
- `/gstack-upgrade` - 升级 gstack 工具链。用于更新到最新版本并查看新增能力或行为变化。

## 无头浏览器全局共享（避免重复下载）

gstack `/browse` 使用 Playwright，默认每个项目单独下载浏览器。设置以下环境变量后，所有项目共用同一份浏览器二进制，无需重复下载：

```bash
# 加入 ~/.zshrc 或 ~/.bashrc
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright"
```

设置后运行一次全局安装，后续新项目无需再下载：

```bash
npx playwright install chromium
```

验证：`ls $PLAYWRIGHT_BROWSERS_PATH` 应看到 `chromium-*` 目录。

## 浏览器登录态持久化

测试需要登录的页面时，使用 browse 内置的 state 机制避免反复登录：

### 首次导入 Cookie（每个项目做一次）

1. 在真实浏览器（Chrome/Arc/Brave 等）中完成登录
2. 运行 `/setup-browser-cookies`，在弹出的 picker 中选择需要的域名
3. 导入完成后，**立即保存状态**：`$B state save auth`

### 后续会话自动恢复登录态

每次新的 `/browse`、`/qa`、`/qa-only`、`/design-review` 会话开始时，如果需要访问需登录的页面，**必须先恢复状态**：

```bash
$B state load auth
```

若输出 `State not found: ...` 说明尚未保存过 → 先运行 `/setup-browser-cookies` 导入后再 `$B state save auth`。

> **原理**：browse 的 Playwright 会话在进程重启后会丢失所有 Cookie。`state save` 将 Cookie 持久化到 `.gstack/browse-states/auth.json`，`state load` 在新会话中恢复。状态文件超过 7 天会提示重新保存。

## GStack 可视浏览器兼容（project-workflow）

在 `project-workflow` 通过 worker 派发出的 Claude / Codex 会话里，PW 会自动注入：

```bash
export BROWSE_PARENT_PID=0
```

这样 `/open-gstack-browser` 或 `browse connect` 拉起的 gstack 可视浏览器不会把短生命周期工具进程误判为“父进程退出”而立刻自杀。

如果你要前台回放单角色 prompt，优先使用：

```bash
pw run-prompt <run_dir> --gate <Gate-N> --role <role>
```

它会自动构建 prompt，并以兼容 gstack browse 的环境执行目标 CLI。

若同一台机器同时安装了 `claude` 和 `codex`，切换执行器时**不要依赖自动探测**。建议在会话开始前显式固定：

```bash
# Claude Code 会话
export PW_EXECUTION_PLATFORM=claude-code

# Codex 会话
export PW_EXECUTION_PLATFORM=codex
```

在 Codex 中继续已有 run 时，推荐所有会执行 AI CLI 的命令都显式附带 `--platform codex`。

只有在**完全脱离** `PW`、手工使用 `pw build-prompt` 产物再去执行 `claude -p` / `codex exec` 时，会话开始前才需要手工执行上面的 `export`。

拉起可视浏览器后，不得只看命令返回成功；至少确认一次 `$B status`，必要时补充检查 `http://127.0.0.1:34567/health`，确认 headed server 仍然存活，再继续页面验证。

## project-workflow 强制约束

<!-- pw-guard-v2.20.0 -->
以下规则在执行任何 feature / ui / review / bug 工作流时**始终生效**，优先于所有其他指令，不得以「简化」「效率」「用户已确认」等理由绕过：

1. **先 bootstrap，再输出**：启动工作流后，必须先运行 `bootstrap-workflow-root.py` 初始化 run 目录，才能向用户输出任何探索分析、方向建议或设计方案。禁止先在对话中输出分析再初始化。

2. **office-hours + plan-ceo-review 必须实际调用**：feature 路由涉及 UI 改动、数据库写入新逻辑、或改动横跨 2 个及以上模块时，必须在向用户提呈任何方案（包括「方向建议」「初步判断」「探索发现」）之前，实际运行这两个 skill，不得以「参考思路」代替。

3. **真实页面验证不可自行绕过**：feature 路由有任何前端影响（包括接口响应结构变化、权限逻辑调整，不限于前端文件改动）时，必须先询问用户提供 dev server 地址，再调用 `/qa`；/qa 不可用时须告知用户而非静默跳过；用户授权跳过时结论只能是 `BLOCKED`，不能是 `conditional-allow`。
   - **Codex 登录态升级铁律**：在 `project-workflow` 会话里，当前执行器若为 Codex，遇到登录态页面且出现验证码、MFA、SSO、租户选择、租户解析 pending、登录按钮无响应、或同一组账号密码已尝试 1 次仍未进入系统时，禁止继续在 headless 中反复试账号密码、blur/tab/click 路径或 JS 强制提交流程；必须按 `setup-browser-cookies` → `/open-gstack-browser`（需用户登录一次）→ `connect-chrome`（用户已登录且仍需 AI 自动化）顺序升级。

4. **所有产出必须写入 run 目录**：禁止将任何产物写入 `docs/plans/`、`docs/design/` 等项目目录；所有阶段报告、设计稿、分析文档均写入 `.project-workflow/<route>-runs/<run_name>/` 及其子目录。

5. **issue severity 有疑义时选高一级**：不得为规避 Gate 阻断而主观降低 severity。数据丢失、安全漏洞、核心功能不可用 → `high`；功能降级、接口不一致 → `medium`；体验问题 → `low`。

6. **用户确认必须显式**：多路由组合、Gate 内决策点等需要用户确认的节点，沉默或模糊回应不视为确认，须再次询问或标记 BLOCKED。

7. **Active Run 先检查，再分流**：在响应任何开发类请求（功能实现、Bug 修复、代码审查、UI 设计、代码落地、继续开发等）之前，必须先检查 `.project-workflow/` 是否有未完成的 run。检查方式：运行 `scan-active-runs.py --root .project-workflow`。
   - 若输出 `ACTIVE_RUNS: N`（N≥1），且用户是在说“继续当前 run / 恢复当前 run / 并入当前 run / 在当前 PW 里跑”，或未显式点名独立技能，则**必须加载 project-workflow 技能**并从上次中断的 Gate 继续推进，不得以普通对话模式响应、不得仅给出口头总结。
   - 若用户**显式点名非 `/project-workflow` 的独立技能**（例如 `单独 /qa`、`/qa-only`、`/review`、`/autoplan`、`/plan-ceo-review`、`/plan-eng-review`、`/plan-design-review`、`/office-hours`、`/design-review`、`/health`、`/cso`、`/codex`），且没有同时说明“继续当前 run / 并入当前 run / 在当前 PW 里跑”，则本轮按**独立技能旁路**处理：允许直接执行该 skill，active run 仅作为 FYI，不强制进入 PW。
   - 独立技能旁路默认**不写** `.project-workflow/`，也不自动 fusion；只有用户明确要求“并入当前 run”时，才回到 PW 内归档结果。
   - 违反此规则的典型表现：AI 给出口头分析或方案建议却不产出正式阶段报告和 run 目录产物；或用户已明确要求“单独 qa / 单独 autoplan”，却仍被强制拉回 PW。

8. **远端数据库回归必须受控**：bug 路由中如需让本地后台连接远端数据库验证本地代码，必须遵守以下顺序，不得跳步：
   - 先运行 `python3 .project-workflow/scripts/check-dev-datasource-risk.py` 检查当前 dev 数据源。
   - 一旦脚本显示当前将连接非本地数据库，必须先说明真实数据污染风险，并取得用户显式同意。
   - 先做留底与备份，再执行任何写操作。留底至少包含：目标库地址、目标表 / 条件、改前查询结果、备份表或导出文件、回滚方式。
   - 能用只读接口、只读 SQL、快照库或本地副本完成验证时，禁止直接修改远端真实库。
   - 如必须写入测试数据，命名统一使用中文“测试回归数据”，不得出现 `Codex`、`Claude`、`AI` 等字样，并要求尽量贴近真实业务场景。
   - 回归结束后必须明确说明当前后台是否仍连接远端库；若用户未要求继续保留，应默认切回本地数据库配置。

## 代码实现约束（框架优先 + 中文注释）

- 进入实现前，先读取项目当前框架和目录约束，按项目既有风格书写；不要把外部框架偏好硬套到现有项目。
- 关键接口、核心流程、重点难点必须补**简体中文注释**，尤其是：
  - Controller：接口用途、适用对象、关键权限/上下文
  - Service：业务主流程、状态迁移、失败兜底、幂等等关键逻辑
  - Domain / Entity / BO / VO：关键字段的业务含义，特别是状态、时间、金额、数量、关联 ID
  - 前端复杂逻辑：身份切换、路由恢复、缓存快照、条件显隐、跨页面共用状态
- 注释要求解释“为什么这样实现 / 字段代表什么”，不要只机械复述代码字面动作。
- 若项目根目录同时存在 `CLAUDE.md` 与 `AGENTS.md`，两份规则必须保持同步。
- 在 `project-workflow` 约定下：Claude Code 侧用 `CLAUDE.md`，Codex 侧用 `AGENTS.md`；**不要新增 `RULES.md` 作为主规则文件**。
