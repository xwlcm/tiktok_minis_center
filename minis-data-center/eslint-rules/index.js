'use strict'

/**
 * Minis Data Center — 自定义 ESLint 规则插件
 * 对应 docs/system.txt 第 3.5 节所有强制规范
 *
 * Vue 模板规则依赖 eslint-plugin-vue 提供的 utils.defineTemplateBodyVisitor
 */

let vueUtils
try {
  vueUtils = require('eslint-plugin-vue/dist/utils/index.js').default
} catch {
  vueUtils = null
}

/**
 * 获取 VElement 的标签名（小写）
 */
function getTagName(node) {
  return ((node && (node.rawName || node.name)) || '').toLowerCase()
}

/**
 * 包装 template visitor：
 * - .vue 文件：通过 defineTemplateBodyVisitor 同时处理模板和 script
 * - .ts/.js 文件：直接返回 scriptVisitor
 */
function defineVisitor(context, templateVisitor, scriptVisitor = {}) {
  // 判断是否是 Vue 文件（有 parserServices.defineTemplateBodyVisitor）
  const parserServices = context.sourceCode?.parserServices
  if (
    vueUtils &&
    vueUtils.defineTemplateBodyVisitor &&
    parserServices &&
    parserServices.defineTemplateBodyVisitor
  ) {
    return vueUtils.defineTemplateBodyVisitor(context, templateVisitor, scriptVisitor)
  }
  // 非 Vue 文件（.ts/.js），直接返回 script visitor
  return scriptVisitor
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 1：a-statistic :value 不能绑定字符串字面量
// 规范 3.5.1
// ─────────────────────────────────────────────────────────────────────────────
const noStatisticStringValue = {
  meta: {
    type: 'problem',
    docs: {
      description: 'a-statistic :value 只接受 Number|Object，字符串请用自定义 div 渲染（规范 3.5.1）',
    },
    schema: [],
    messages: {
      stringValue:
        'a-statistic :value 不能绑定字符串字面量。时长、百分比等文本指标请用 <div class="statistic-wrap"> 自定义渲染，参考 docs/system.txt 3.5.1。',
    },
  },
  create(context) {
    return defineVisitor(context, {
      "VAttribute[directive=true][key.name.name='bind'][key.argument.name='value']"(node) {
        const tagName = getTagName(node.parent?.parent)
        if (tagName !== 'a-statistic') return
        const expr = node.value?.expression
        if (expr && expr.type === 'Literal' && typeof expr.value === 'string') {
          context.report({ node, messageId: 'stringValue' })
        }
      },
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 2：a-statistic prefix 必须用插槽，不能用 prop
// 规范 3.5.2
// ─────────────────────────────────────────────────────────────────────────────
const noStatisticPrefixProp = {
  meta: {
    type: 'problem',
    docs: {
      description: 'a-statistic prefix 是插槽不是 prop，用 prop 传值会报 DOM 错误（规范 3.5.2）',
    },
    schema: [],
    messages: {
      prefixProp:
        'a-statistic 不能用 prefix="..." 或 :prefix="..." prop。请改用 <template #prefix>...</template> 插槽，参考 docs/system.txt 3.5.2。',
    },
  },
  create(context) {
    return defineVisitor(context, {
      // 静态 prefix="$"
      "VAttribute[directive=false][key.name='prefix']"(node) {
        const tagName = getTagName(node.parent?.parent)
        if (tagName !== 'a-statistic') return
        context.report({ node, messageId: 'prefixProp' })
      },
      // 动态 :prefix="xxx"
      "VAttribute[directive=true][key.name.name='bind'][key.argument.name='prefix']"(node) {
        const tagName = getTagName(node.parent?.parent)
        if (tagName !== 'a-statistic') return
        context.report({ node, messageId: 'prefixProp' })
      },
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 3：分页 API 返回值必须解构 .list，不能整体赋给数组 ref
// 规范 3.5.3
// 匹配：fetch[A-Z]XxxList，但排除已知非分页的 API（如 fetchTagList、fetchAppList）
// ─────────────────────────────────────────────────────────────────────────────
const PAGINATED_API_RE = /^fetch[A-Z]\w+List$/
// 这些函数返回的是数组而非 { list, total }，不需要解构
const NON_PAGINATED_APIS = new Set([
  'fetchTagList',
  'fetchAppList',
  'fetchPushRules',
  'fetchAdList',
  // 首页运营配置接口 — 返回数组，非分页格式
  'fetchBannerList',
  'fetchHotDramaList',
  'fetchRankList',
])

const requirePaginationListDestructure = {
  meta: {
    type: 'problem',
    docs: {
      description: '分页 API 返回 { list, total }，必须取 .list 赋给数组 ref（规范 3.5.3）',
    },
    schema: [],
    messages: {
      missingList:
        '分页接口返回 { list, total }，请使用 "(await fetchXxxList(...)).list" 或先解构再赋值，参考 docs/system.txt 3.5.3。',
    },
  },
  create(context) {
    const scriptVisitor = {
      AssignmentExpression(node) {
        const right = node.right
        if (right.type !== 'AwaitExpression') return
        const call = right.argument
        if (!call || call.type !== 'CallExpression') return

        const callee = call.callee
        const fnName =
          callee.type === 'Identifier'
            ? callee.name
            : callee.type === 'MemberExpression'
            ? callee.property?.name
            : null

        if (!fnName || !PAGINATED_API_RE.test(fnName)) return
        if (NON_PAGINATED_APIS.has(fnName)) return

        const left = node.left
        if (left.type === 'MemberExpression' && left.property?.name === 'value') {
          context.report({ node, messageId: 'missingList' })
        }
      },
    }
    return defineVisitor(context, {}, scriptVisitor)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 4：a-badge status 不能用 "default"
// 规范 3.5.7
// ─────────────────────────────────────────────────────────────────────────────
const BADGE_VALID_STATUSES = ['normal', 'processing', 'success', 'warning', 'danger']

const noBadgeInvalidStatus = {
  meta: {
    type: 'problem',
    docs: {
      description: 'a-badge status 只接受 normal|processing|success|warning|danger（规范 3.5.7）',
    },
    fixable: 'code',
    schema: [],
    messages: {
      defaultStatus:
        'a-badge status="default" 不存在，请改为 status="normal"，参考 docs/system.txt 3.5.7。',
      invalidStatus:
        'a-badge status="{{ value }}" 不合法。合法值：normal | processing | success | warning | danger，参考 docs/system.txt 3.5.7。',
    },
  },
  create(context) {
    return defineVisitor(context, {
      // 静态 status="xxx"
      "VAttribute[directive=false][key.name='status']"(node) {
        const tagName = getTagName(node.parent?.parent)
        if (tagName !== 'a-badge') return
        const val = node.value?.value
        if (!val) return
        if (val === 'default') {
          context.report({
            node,
            messageId: 'defaultStatus',
            fix(fixer) { return fixer.replaceText(node.value, '"normal"') },
          })
        } else if (!BADGE_VALID_STATUSES.includes(val)) {
          context.report({ node, data: { value: val }, messageId: 'invalidStatus' })
        }
      },
      // 动态 :status="expr"
      "VAttribute[directive=true][key.name.name='bind'][key.argument.name='status']"(node) {
        const tagName = getTagName(node.parent?.parent)
        if (tagName !== 'a-badge') return
        const expr = node.value?.expression
        if (!expr) return

        function checkForDefault(n) {
          if (!n) return
          if (n.type === 'Literal' && n.value === 'default') {
            context.report({ node, messageId: 'defaultStatus' })
          }
          if (n.type === 'ConditionalExpression') {
            checkForDefault(n.consequent)
            checkForDefault(n.alternate)
          }
        }
        checkForDefault(expr)
      },
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 5：Mock.mock() 正则末尾必须兼容 query string
// 规范 3.5.6
// ─────────────────────────────────────────────────────────────────────────────
const requireMockRegexQueryCompat = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Mock.mock() 正则末尾必须用 (\\?.*)? 兼容 query string（规范 3.5.6）',
    },
    schema: [],
    messages: {
      bareEnd:
        'Mock 正则 {{ pattern }} 以裸 $ 结尾，Axios 会自动追加 ?clientKey=xxx 导致匹配失败。请改为 (\\?.*)?$ 结尾，参考 docs/system.txt 3.5.6。',
    },
  },
  create(context) {
    const scriptVisitor = {
      CallExpression(node) {
        const callee = node.callee
        if (
          callee.type !== 'MemberExpression' ||
          callee.object?.name !== 'Mock' ||
          callee.property?.name !== 'mock'
        ) return

        const firstArg = node.arguments[0]
        if (!firstArg || firstArg.type !== 'Literal') return
        if (!(firstArg.value instanceof RegExp)) return

        const src = firstArg.regex?.pattern ?? ''
        // 裸 $ 结尾：末尾是 $ 但没有 (\?.*)? 前缀
        // 合法末尾示例：(\?.*)?$  (\?[^#]*)?$
        // 检测：以 $ 结尾，且不包含 \? 转义（即没有 query string 兼容写法）
        if (/\$$/.test(src) && !src.includes('\\?')) {
          context.report({
            node: firstArg,
            messageId: 'bareEnd',
            data: { pattern: `/${src}/` },
          })
        }
      },
    }
    return defineVisitor(context, {}, scriptVisitor)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 6：Mock handler 提取 ID 必须先 split('?')[0]
// 规范 3.5.6
// ─────────────────────────────────────────────────────────────────────────────
const requireMockUrlSplitQuery = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Mock handler 提取 ID 时必须先 split("?")[0] 剥离 query string（规范 3.5.6）',
    },
    schema: [],
    messages: {
      missingQueryStrip:
        '直接用 url.split("/").pop() 会把 ?clientKey=xxx 带入 ID。请改为 url.split("?")[0].split("/").pop()，参考 docs/system.txt 3.5.6。',
    },
  },
  create(context) {
    const scriptVisitor = {
      CallExpression(node) {
        if (node.callee?.type !== 'MemberExpression') return
        if (node.callee.property?.name !== 'pop') return

        const splitSlash = node.callee.object
        if (splitSlash?.type !== 'CallExpression') return
        if (splitSlash.callee?.property?.name !== 'split') return

        const splitArg = splitSlash.arguments?.[0]
        if (splitArg?.type !== 'Literal' || splitArg.value !== '/') return

        // 如果 split('/') 的调用对象是 MemberExpression（xxx[0]），说明已做了 split('?')[0]
        const obj = splitSlash.callee.object
        if (obj?.type === 'MemberExpression') return

        context.report({ node, messageId: 'missingQueryStrip' })
      },
    }
    return defineVisitor(context, {}, scriptVisitor)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 7：a-range-picker placeholder 必须是数组，不能是字符串
// 规范 3.5.8
// ─────────────────────────────────────────────────────────────────────────────
const noRangePickerStringPlaceholder = {
  meta: {
    type: 'problem',
    docs: {
      description: 'a-range-picker placeholder 必须是数组 [string, string]，不能是字符串（规范 3.5.8）',
    },
    fixable: null,
    schema: [],
    messages: {
      stringPlaceholder:
        'a-range-picker placeholder 必须是数组，如 :placeholder="[\'开始\', \'结束\']"，不能用字符串，参考 docs/system.txt 3.5.8。',
    },
  },
  create(context) {
    return defineVisitor(context, {
      // 静态 placeholder="xxx"（字符串）
      "VAttribute[directive=false][key.name='placeholder']"(node) {
        const tagName = getTagName(node.parent?.parent)
        if (tagName !== 'a-range-picker') return
        context.report({ node, messageId: 'stringPlaceholder' })
      },
      // 动态 :placeholder="'xxx'"（绑定字符串字面量）
      "VAttribute[directive=true][key.name.name='bind'][key.argument.name='placeholder']"(node) {
        const tagName = getTagName(node.parent?.parent)
        if (tagName !== 'a-range-picker') return
        const expr = node.value?.expression
        if (!expr) return
        if (expr.type === 'Literal' && typeof expr.value === 'string') {
          context.report({ node, messageId: 'stringPlaceholder' })
        }
      },
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 规则 8：禁止使用不存在的 Arco Design 图标
// 规范 3.5.9
// ─────────────────────────────────────────────────────────────────────────────
// 已知不存在的图标（遇到新的持续补充）
const INVALID_ARCO_ICONS = new Set([
  'icon-pie-chart',
  'icon-donut-chart',
  'icon-scatter-chart',
  'icon-radar-chart',
  'icon-line-chart',
  'icon-area-chart',
])

const noInvalidArcoIcon = {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止使用不存在的 Arco Design 图标（规范 3.5.9）',
    },
    schema: [],
    messages: {
      invalidIcon:
        '"{{ icon }}" 在 Arco Design 中不存在，会导致组件解析失败。请查阅 https://arco.design/vue/component/icon 确认图标名称，参考 docs/system.txt 3.5.9。',
    },
  },
  create(context) {
    return defineVisitor(context, {
      VElement(node) {
        const tagName = getTagName(node)
        if (INVALID_ARCO_ICONS.has(tagName)) {
          context.report({
            node,
            messageId: 'invalidIcon',
            data: { icon: tagName },
          })
        }
      },
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 导出插件
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  rules: {
    'no-statistic-string-value':              noStatisticStringValue,
    'no-statistic-prefix-prop':               noStatisticPrefixProp,
    'require-pagination-list-destructure':    requirePaginationListDestructure,
    'no-badge-invalid-status':                noBadgeInvalidStatus,
    'require-mock-regex-query-compat':        requireMockRegexQueryCompat,
    'require-mock-url-split-query':           requireMockUrlSplitQuery,
    'no-range-picker-string-placeholder':     noRangePickerStringPlaceholder,
    'no-invalid-arco-icon':                   noInvalidArcoIcon,
  },
}
