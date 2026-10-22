# Skill: 样式体系

## 文件

- `src/styles/tokens.css` — 设计 Token（CSS 变量）：TikTok 双色、语义色、深色背景层次、文字色、圆角、阴影、间距等。
- `src/styles/global.css` — 全局覆盖：Arco Design 深色主题变量 + 全局工具类 + 动画。
- `@tailwindcss/vite` + `tailwindcss@4` — 在 `vite.config.ts` 中引入，提供原子类补充（与 Arco 组件和自定义样式共存）。

## 核心 Token

### TikTok 双色

```css
--tt-red:        #D94466;
--tt-red-dim:    rgba(217,68,102,0.12);
--tt-red-glow:   rgba(217,68,102,0.25);
--tt-cyan:       #5BA8B0;
--tt-cyan-dim:   rgba(91,168,176,0.12);
--tt-cyan-glow:  rgba(91,168,176,0.25);
```

### 语义色

```css
--mc-primary:        #5BA8B0;
--mc-primary-hover:  #6FB8BF;
--mc-success:        #3DB87A;
--mc-warning:        #D4913A;
--mc-danger:         #D94466;
--mc-info:           #8B6AAE;
--mc-teal:           #5BA8B0;
```

### 深色背景层次

```css
--mc-bg-page:    #0C0D12;
--mc-bg-card:    #131620;
--mc-bg-card-2:  #1A1D28;
--mc-bg-hover:   rgba(255,255,255,0.04);
--mc-bg-active:  rgba(91,168,176,0.08);
```

### 文字色

```css
--mc-text-primary:   rgba(255,255,255,0.92);
--mc-text-secondary: rgba(255,255,255,0.60);
--mc-text-tertiary:  rgba(255,255,255,0.35);
--mc-text-disabled:  rgba(255,255,255,0.18);
```

## Arco Design 变量覆盖

通过 `global.css` 覆盖 50+ 个 Arco 变量实现一致的深色主题，关键几条：

```css
--arcoblue-6: #5BA8B0;
--color-bg-1 / 2 / 3 / 4 / 5
--color-text-1 / 2 / 3 / 4
--color-border-1 / 2 / 3 / 4
--color-fill-1 / 2 / 3 / 4
--primary-1 ~ 7
--red-6 / --danger-6: #D94466
--green-6: #3DB87A
--orange-6: #D4913A
```

## 渐变

| 渐变 | 用途 |
|------|------|
| `linear-gradient(135deg, #D94466 0%, #5BA8B0 100%)` | 主按钮 |
| `linear-gradient(135deg, #f5305e 0%, #6FB8BF 100%)` | 主按钮 hover |
| `linear-gradient(90deg, #D94466, #5BA8B0)` | 进度条 / 趋势折线 |
| `linear-gradient(90deg, #D94466, #D4913A)` | 热度条 |

## Tailwind v4

- `@tailwindcss/vite` 插件开启零配置使用。
- 与 Arco 样式叠加时注意：Arco 组件产生的 CSS 先于 Tailwind 工具类，叠加到 Arco 内部元素请配合 `:deep()` 或 CSS 变量覆盖。
- 若 class 之间优先级冲突，优先考虑用 `tokens.css` 的语义类，避免过多原子类。
