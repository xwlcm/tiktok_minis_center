<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->


## project-workflow 强制重入

<!-- pw-agents-guard-v2.20.0 -->

本项目使用 project-workflow 全链路工作流管理开发过程。以下规则**始终生效**：

**Active Run 先检查，再分流**：在响应任何开发类请求（功能实现、Bug 修复、代码审查、UI 设计、代码落地、继续开发等）之前，必须先检查 `.project-workflow/` 是否有未完成的 run。

检查方法（在项目根目录运行）：
```bash
python3 <skill_dir>/scripts/scan-active-runs.py --root .project-workflow
```

若当前由 Codex 接管，建议在会话开始前显式固定：
```bash
export PW_EXECUTION_PLATFORM=codex
```

其中 `<skill_dir>` 按以下顺序查找 project-workflow 技能目录：
1. `<项目根>/.claude/skills/project-workflow`
2. `<项目根>/.agents/skills/project-workflow`
3. `$HOME/.claude/skills/project-workflow`
4. `$HOME/.agents/skills/project-workflow`

**若输出 `ACTIVE_RUNS: N`（N≥1）**：
- 用户是在说“继续当前 run / 恢复当前 run / 并入当前 run / 在当前 PW 里跑”，或未显式点名独立技能时：必须加载 project-workflow 技能（`/project-workflow`），从上次中断的 Gate 继续推进
- 用户**显式点名独立技能**（如 `单独 /qa`、`/review`、`/autoplan`）且未要求并入当前 run 时：本轮允许直接执行该 skill，active run 仅作 FYI，不强制进入 PW
- 只有进入 PW 路径时，所有开发产出才必须写入 `.project-workflow/` 对应 run 目录

**若输出 `NO_ACTIVE_RUNS` 或 `NO_WORKFLOW_ROOT`**：
- 若用户明确要求启动工作流，加载 `/project-workflow` 技能
- 否则正常响应

此规则适用于同一会话内的所有后续消息，不仅限于首次调用工作流时。

## 登录态页面验证强制升级（Codex）

以下规则适用于 `project-workflow` 会话中由 Codex 执行的页面验证场景：

1. **headless 登录最多只做 1 次 sanity check**：只要已经用同一组账号密码尝试过 1 次，仍未进入系统，就不得继续在 headless 里反复试 blur/tab/click/select/JS 提交。
2. **出现以下任一信号必须立刻升级**：验证码、MFA、SSO、租户选择、租户解析 pending、登录按钮无响应、点击后无提交请求、或任何认证前置链路卡住。
3. **升级顺序固定**：
   - 可复用真实浏览器登录态：优先 `/setup-browser-cookies`
   - 仍需用户亲自登录一次：立即 `/open-gstack-browser`，并保持 headed + 持久 PTY 会话，明确等待用户操作
   - 用户已完成可见浏览器登录，且后续仍需 AI 继续自动化：再使用 `/connect-chrome`
4. **禁止把“继续猜登录路径”当作主策略**：Codex 不得以多轮选择器试探、重复点击按钮、或 JS 强制提交来替代人工登录或 cookie 注入。
5. **页面验证报告必须留痕**：至少记录触发升级的信号、采用的升级路径、用户是否已完成登录、以及恢复自动化时的起始页面。

## 远端数据库回归安全规则

以下规则适用于所有 bug 排查 / 回归 / 修复场景，尤其是“本地后台连接远端数据库验证本地代码”这类高风险动作：

1. **默认本地库优先**：除非用户明确要求，或已经证明本地样本无法复现且必须使用远端真实数据，否则禁止将本地后台直接切到远端数据库。
2. **先检测，再提示风险**：重启本地后台前，先运行：
   `python3 .project-workflow/scripts/check-dev-datasource-risk.py`
   一旦检测到后台将连接非 `127.0.0.1` / `localhost` 的数据库，必须先向用户明确提示“当前将使用远端数据库，存在污染真实数据风险”，并取得显式同意后才能启动或重启后台。
3. **先备份，再写操作**：任何会修改远端数据的回归动作，必须先留痕并备份。至少包括：目标库地址、目标表 / 条件、删前 / 改前查询结果、备份表或导出文件名、回滚方式。没有备份与留底，不得执行写操作。
4. **优先只读验证**：能用只读接口、只读 SQL、快照库、本地导入副本完成验证时，禁止直接改远端真实库。只有在用户确认且只读无法完成验证时，才允许对远端库做最小写入。
5. **测试数据必须真实且可回收**：远端测试数据不得出现 `Codex`、`Claude`、`AI` 等字样；统一使用中文“测试回归数据”作为标记，并尽量贴近真实业务场景。写入后必须记录主键 / 业务单号 / 时间范围，便于回滚清理。
6. **测试结束默认收口**：完成远端库回归后，必须明确告知用户当前后台是否仍连接远端库；若用户未要求继续保留，应将配置切回本地数据库，并说明前端是否需要刷新。
7. **回滚路径必须可执行**：凡是执行过远端数据变更，最终报告中必须给出“已回滚”或“保留原因 + 具体留存记录”。不能只说“应该可以恢复”。

## 代码实现约束（框架优先 + 中文注释）

1. 进入实现前，必须先读取项目当前框架和目录约束，按项目既有风格书写。
2. 关键 Controller / Service / Domain / BO / VO / 前端复杂状态逻辑必须补**简体中文注释**。
3. 接口注释要说明“用途 / 适用对象 / 关键权限或上下文”；字段注释要说明“业务含义”，不能只重复字段名。
4. 若项目根目录同时存在 `CLAUDE.md` 与 `AGENTS.md`，两份规则必须保持同步。
5. 在当前工作流约定下，Codex 侧项目规则文件使用 `AGENTS.md`，**不是 `RULES.md`**。
