<template>
  <div class="modules-page">
    <!-- ── 页头 ─────────────────────────────────────────── -->
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-eyebrow">WORKSPACE</p>
        <h1 class="page-title">模块管理</h1>
        <p class="page-desc">
          调整侧边栏与顶部菜单的显示与顺序。点「编辑」可在「上级菜单」里把任意菜单切到一级、二级或顶部。
        </p>
      </div>
      <div class="page-head-actions">
        <a-button size="small" @click="handleShowAll">
          <template #icon><IconEye /></template>
          全部显示
        </a-button>
        <a-button size="small" @click="handleReset">
          <template #icon><IconRefresh /></template>
          恢复默认
        </a-button>
        <a-button type="primary" size="small" @click="openGroupModal">
          <template #icon><IconPlus /></template>
          新增一级菜单
        </a-button>
      </div>
    </header>

    <div class="modules-body">
      <!-- ── 菜单配置列表 ─────────────────────────────── -->
      <section class="group-stack">
        <!-- ── 顶部菜单 ─────────────────────────────── -->
        <article v-if="menuStore.topItems.length" class="top-card" data-group-key="__top">
          <header class="top-card-head">
            <span class="top-card-icon"><IconToTop /></span>
            <div class="top-card-meta">
              <p class="top-card-title">顶部菜单</p>
              <p class="top-card-desc">横向展示在命令栏下方，任何页面都能一键直达</p>
            </div>
            <span class="group-spacer" />
            <span class="group-count">{{ menuStore.topItems.length }} 个</span>
          </header>
          <div class="top-list">
            <div v-for="(item, index) in menuStore.topItems" :key="item.key" class="top-chip">
              <component :is="resolveMenuIcon(item.icon)" class="top-chip-icon" />
              <span class="top-chip-label">{{ item.label }}</span>
              <code class="top-chip-path">{{ item.key }}</code>
              <span class="group-spacer" />
              <button
                type="button"
                class="mini-btn mini-btn--layer"
                title="编辑菜单"
                @click="openEditTop(item, index)"
              >
                <IconEdit />
              </button>
              <button
                type="button"
                class="mini-btn"
                title="还原为侧边栏二级菜单"
                @click="restoreToSidebar(item)"
              >
                <IconUndo />
              </button>
            </div>
          </div>
        </article>

        <article
          v-for="(group, groupIndex) in menuStore.groups"
          :key="group.key"
          :data-group-key="group.key"
          class="group-card"
          :class="{ 'group-card--muted': group.hidden && !group.locked }"
        >
          <!-- 一级菜单头 -->
          <header class="group-head">
            <a-popover
              v-if="!group.locked"
              trigger="click"
              position="bottom"
              :content-style="ICON_POPOVER_STYLE"
            >
              <button type="button" class="group-icon" :title="group.label">
                <component :is="resolveMenuIcon(group.icon)" />
              </button>
              <template #content>
                <div class="icon-grid">
                  <button
                    v-for="icon in ICON_OPTIONS"
                    :key="icon"
                    type="button"
                    class="icon-cell"
                    :class="{ 'icon-cell--active': icon === group.icon }"
                    :title="icon"
                    @click="menuStore.setGroupIcon(group.key, icon)"
                  >
                    <component :is="resolveMenuIcon(icon)" />
                  </button>
                </div>
              </template>
            </a-popover>
            <span v-else class="group-icon group-icon--locked">
              <component :is="resolveMenuIcon(group.icon)" />
            </span>

            <input
              v-if="!group.locked"
              class="group-name"
              :value="group.label"
              maxlength="16"
              @change="menuStore.renameGroup(group.key, ($event.target as HTMLInputElement).value)"
            />
            <span v-else class="group-name group-name--readonly">{{ group.label }}</span>

            <span v-if="group.locked" class="badge badge--lock">固定</span>
            <span v-else-if="group.custom" class="badge badge--custom">自定义</span>
            <span v-if="group.permission" class="badge">{{ PERMISSION_LABEL[group.permission] }}</span>
            <span v-if="group.hidden && !group.locked" class="badge badge--off">已隐藏</span>
            <span v-if="group.disabled" class="badge badge--off">已停用</span>

            <span class="group-count">{{ group.children.length }} 个</span>
            <span class="group-spacer" />

            <a-switch
              size="small"
              :model-value="!group.hidden"
              :disabled="group.locked"
              @change="menuStore.toggleGroup(group.key)"
            />
            <button
              type="button"
              class="mini-btn mini-btn--layer"
              title="编辑菜单"
              :disabled="group.locked"
              @click="openEditGroup(group, groupIndex)"
            >
              <IconEdit />
            </button>
            <button
              type="button"
              class="mini-btn mini-btn--danger"
              title="删除一级菜单"
              :disabled="group.locked"
              @click="confirmRemoveGroup(group)"
            >
              <IconDelete />
            </button>
          </header>

          <!-- 二级菜单列表 -->
          <div class="item-list">
            <div
              v-for="(item, itemIndex) in group.children"
              :key="item.key"
              class="item-row"
              :class="{ 'item-row--muted': item.hidden }"
            >
              <span class="item-bullet" />

              <input
                v-if="editingKey === group.key + '|' + item.key"
                v-model="editingLabel"
                class="item-input"
                maxlength="16"
                @blur="commitRename(group.key, item.key)"
                @keydown.enter.prevent="commitRename(group.key, item.key)"
                @keydown.esc.prevent="cancelRename"
              />
              <button
                v-else
                type="button"
                class="item-label"
                title="双击重命名"
                @dblclick="startRename(group.key, item.key, item.label)"
              >
                {{ item.label }}
              </button>

              <code class="item-path">{{ item.key }}</code>

              <span v-if="item.feature && !FEATURES[item.feature]" class="badge badge--off">
                功能未开启
              </span>
              <span v-if="item.custom" class="badge badge--custom">自定义</span>
              <span v-if="item.hidden" class="badge badge--off">已隐藏</span>
              <span v-if="item.disabled" class="badge badge--off">已停用</span>

              <span class="group-spacer" />

              <a-switch
                size="small"
                :model-value="!item.hidden"
                :disabled="group.locked"
                @change="menuStore.toggleItem(group.key, item.key)"
              />
              <button
                type="button"
                class="mini-btn mini-btn--layer"
                title="编辑菜单"
                :disabled="group.locked"
                @click="openEditItem(group, item, itemIndex)"
              >
                <IconEdit />
              </button>
              <button
                type="button"
                class="mini-btn mini-btn--danger"
                title="移除"
                :disabled="group.locked"
                @click="menuStore.removeItem(group.key, item.key)"
              >
                <IconDelete />
              </button>
            </div>

            <p v-if="!group.children.length" class="item-empty">
              这个一级菜单下还没有页面，先把已有页面挂进来吧。
            </p>

            <button
              type="button"
              class="add-item-btn"
              :disabled="group.locked"
              @click="openItemModal(group.key)"
            >
              <IconPlus />
              <span>添加二级菜单</span>
            </button>
          </div>
        </article>

        <p v-if="!menuStore.groups.length" class="stack-empty">
            还没有任何一级菜单，先点击右上角「新增一级菜单」。
          </p>
      </section>

      <!-- ── 右侧概览 ─────────────────────────────────── -->
      <aside class="side">
        <div class="side-card">
          <p class="side-title">当前配置</p>
          <dl class="stat-grid">
            <div class="stat">
                <dt>一级菜单</dt>
              <dd>{{ menuStore.totalGroups }}</dd>
            </div>
            <div class="stat">
              <dt>二级菜单</dt>
              <dd>{{ menuStore.totalItems }}</dd>
            </div>
            <div class="stat">
                <dt>已隐藏</dt>
              <dd>{{ menuStore.hiddenCount }}</dd>
            </div>
            <div class="stat">
              <dt>顶部菜单</dt>
              <dd>{{ menuStore.totalTop }}</dd>
            </div>
            <div class="stat">
              <dt>停用</dt>
              <dd>{{ menuStore.disabledCount }}</dd>
            </div>
            <div class="stat">
                <dt>自定义</dt>
              <dd>{{ menuStore.customCount }}</dd>
            </div>
          </dl>
        </div>

        <div class="side-card">
          <p class="side-title">操作提示</p>
          <ul class="tips">
              <li>点「编辑」打开菜单配置，改「上级菜单」即可切换层级。</li>
              <li>上级菜单选「一级菜单」= 侧边栏一级，选「顶部菜单」= 顶部栏。</li>
              <li>菜单类型「目录」用于一级分组，「菜单」用于页面入口。</li>
              <li>显示排序控制同级顺序；隐藏/停用都不会删除配置。</li>
              <li>双击二级菜单名称可快速重命名。</li>
              <li>「模块管理」为固定模块，避免把自己关在门外。</li>
              <li>按 <kbd>Ctrl</kbd> + <kbd>K</kbd> 可在任意页面搜索模块。</li>
          </ul>
        </div>

        <div class="side-card side-card--note">
          <p class="side-title">配置范围</p>
          <p class="note-text">
              布局是该浏览器下的个人偏好，不会影响其他成员。换设备或清除站点数据后恢复默认。
          </p>
        </div>
      </aside>
    </div>

      <!-- ── 新增一级菜单 ────────────────────────────────── -->
    <a-modal
      v-model:visible="groupModalVisible"
        title="新增一级菜单"
      :mask-closable="false"
      @before-ok="submitGroup"
    >
      <div class="form-row">
        <label class="form-label">名称</label>
          <a-input v-model="groupForm.label" placeholder="例如：内容运营" maxlength="16" show-word-limit />
      </div>
      <div class="form-row">
        <label class="form-label">图标</label>
        <div class="icon-grid icon-grid--form">
          <button
            v-for="icon in ICON_OPTIONS"
            :key="icon"
            type="button"
            class="icon-cell"
            :class="{ 'icon-cell--active': icon === groupForm.icon }"
            :title="icon"
            @click="groupForm.icon = icon"
          >
            <component :is="resolveMenuIcon(icon)" />
          </button>
        </div>
      </div>
    </a-modal>

    <!-- ── 添加二级菜单 ───────────────────────────────── -->
    <a-modal
      v-model:visible="itemModalVisible"
      title="添加二级菜单"
      :mask-closable="false"
      @before-ok="submitItem"
    >
      <div class="form-row">
        <label class="form-label">页面</label>
        <a-select
          v-model="itemForm.path"
          placeholder="选择要挂载的页面"
          allow-search
          :options="pageOptions"
          @change="handlePagePicked"
        />
      </div>
      <div class="form-row">
        <label class="form-label">显示名称</label>
          <a-input v-model="itemForm.label" placeholder="默认为页面标题" maxlength="16" />
      </div>
    </a-modal>

    <!-- ── 编辑菜单 ──────────────────────────────────── -->
    <a-modal
      v-model:visible="editVisible"
      title="编辑菜单"
      :mask-closable="false"
      :width="560"
      @before-ok="submitEdit"
    >
      <div class="form-row">
        <label class="form-label form-label--required">上级菜单</label>
        <a-select
          v-model="editForm.parent"
          :options="parentOptions"
          :disabled="editTarget?.kind === 'group' || editForm.type === 'dir'"
          placeholder="选择上级菜单"
        />
      </div>

      <div v-if="editTarget?.kind !== 'group'" class="form-row">
        <label class="form-label form-label--required">菜单类型</label>
        <a-radio-group v-model="editForm.type" type="button" size="small" @change="handleTypeChange">
          <a-radio value="dir">目录</a-radio>
          <a-radio value="menu">菜单</a-radio>
        </a-radio-group>
        <span class="form-hint">目录作为一级分组；菜单可放在一级、二级或顶部。</span>
      </div>

      <div class="form-row">
        <label class="form-label form-label--required">菜单名称</label>
        <a-input v-model="editForm.label" placeholder="例如：短剧列表" maxlength="16" show-word-limit />
      </div>

      <div class="form-row">
        <label class="form-label">菜单图标</label>
        <div class="icon-grid icon-grid--form">
          <button
            v-for="icon in ICON_OPTIONS"
            :key="icon"
            type="button"
            class="icon-cell"
            :class="{ 'icon-cell--active': icon === editForm.icon }"
            :title="icon"
            @click="editForm.icon = icon"
          >
            <component :is="resolveMenuIcon(icon)" />
          </button>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">权限标识</label>
        <a-input :model-value="editPermission" disabled placeholder="无需权限" />
      </div>

      <div class="form-row">
        <label class="form-label">路由地址</label>
        <a-input :model-value="editForm.path" disabled placeholder="目录无需路由" />
      </div>

      <div class="form-row">
        <label class="form-label">显示排序</label>
        <a-input-number v-model="editForm.order" :min="1" :max="orderMax" :step="1" style="width: 140px" />
        <span class="form-hint">同级菜单内排序，数字越小越靠前。</span>
      </div>

      <div class="form-row">
        <label class="form-label">是否显示</label>
        <a-radio-group v-model="editForm.visible">
          <a-radio :value="true">显示</a-radio>
          <a-radio :value="false">隐藏</a-radio>
        </a-radio-group>
      </div>

      <div class="form-row">
        <label class="form-label">状态</label>
        <a-radio-group v-model="editForm.enabled">
          <a-radio :value="true">正常</a-radio>
          <a-radio :value="false">停用</a-radio>
        </a-radio-group>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconToTop,
  IconUndo,
} from '@arco-design/web-vue/es/icon'
import {
  FEATURES,
  findPageTitle,
  ICON_OPTIONS,
  PAGE_CATALOG,
  resolveMenuIcon,
  type MenuGroupDef,
  type MenuItemDef,
  type TopMenuItem,
} from '@/config/menu.ts'
import { useMenuStore } from '@/stores/menu.ts'

defineOptions({ name: 'ModuleManager' })

const menuStore = useMenuStore()

/* ── 常量 ─────────────────────────────────────────────── */

const ICON_POPOVER_STYLE = {
  padding: '8px',
  background: 'color-mix(in srgb, var(--mc-bg-card) 98%, transparent)',
  border: '1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent)',
  borderRadius: '12px',
  boxShadow: '0 18px 44px rgba(0, 0, 0, 0.6)',
}

const PERMISSION_LABEL: Record<string, string> = {
  canViewDashboard: '看板权限',
  canManageDrama: '短剧权限',
  canViewUser: '用户权限',
  canManageAd: '广告权限',
  canSwitchApp: '应用权限',
  canManageAccounts: '系统权限',
}

  /* ── 行内重命名 ───────────────────────────────────────── */

const editingKey = ref('')
const editingLabel = ref('')

function startRename(groupKey: string, itemKey: string, label: string) {
  editingKey.value = `${groupKey}|${itemKey}`
  editingLabel.value = label
}

function commitRename(groupKey: string, itemKey: string) {
  const next = editingLabel.value.trim()
  if (next) menuStore.renameItem(groupKey, itemKey, next)
  cancelRename()
}

function cancelRename() {
  editingKey.value = ''
  editingLabel.value = ''
}

/* ── 一级菜单：删除确认 ───────────────────────────────── */

function confirmRemoveGroup(group: MenuGroupDef) {
  Modal.confirm({
      title: `删除一级菜单「${group.label}」？`,
    content: group.children.length
        ? `该菜单下有 ${group.children.length} 个二级菜单会一并移除，仅影响当前浏览器的菜单配置。`
        : '该菜单下暂无二级菜单。',
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: () => menuStore.removeGroup(group.key),
  })
}

async function handleReset() {
  menuStore.reset()
    Message.success('已恢复默认菜单')
}

function handleShowAll() {
  for (const group of menuStore.groups) {
    if (group.hidden && !group.locked) menuStore.toggleGroup(group.key)
    for (const item of group.children) {
      if (item.hidden) menuStore.toggleItem(group.key, item.key)
    }
  }
    Message.success('已显示全部菜单')
}

/* ── 编辑菜单：上级菜单 / 类型 / 排序 / 显示 / 状态 ───── */

type EditTarget =
  | { kind: 'group'; groupKey: string }
  | { kind: 'item'; groupKey: string; itemKey: string }
  | { kind: 'top'; itemKey: string }

const editVisible = ref(false)
const editTarget = ref<EditTarget | null>(null)
const editForm = reactive({
  parent: '0',
  type: 'menu' as 'dir' | 'menu',
  label: '',
  icon: 'apps',
  path: '',
  order: 1,
  visible: true,
  enabled: true,
})

const parentOptions = computed(() => {
  const options = [
    { label: '一级菜单（侧边栏）', value: '0' },
    { label: '顶部菜单', value: 'top' },
  ]
  for (const group of menuStore.groups) {
    if (editTarget.value?.kind === 'group' && group.key === editTarget.value.groupKey) continue
    options.push({ label: `挂到：${group.label}`, value: group.key })
  }
  return options
})

const orderMax = computed(() => {
  const target = editTarget.value
  if (!target) return 1
  if (target.kind === 'group') return Math.max(menuStore.groups.length, 1)
  if (target.kind === 'top') return Math.max(menuStore.topItems.length, 1)
  const group = menuStore.groups.find(item => item.key === target.groupKey)
  return Math.max(group?.children.length ?? 1, 1)
})

const editPermission = computed(() => {
  const target = editTarget.value
  if (!target) return ''
  if (target.kind === 'group') {
    const group = menuStore.groups.find(item => item.key === target.groupKey)
    return group?.permission ? PERMISSION_LABEL[group.permission] : ''
  }
  if (target.kind === 'top') {
    const item = menuStore.topItems.find(entry => entry.key === target.itemKey)
    return item?.permission ? PERMISSION_LABEL[item.permission] : ''
  }
  const group = menuStore.groups.find(item => item.key === target.groupKey)
  const item = group?.children.find(entry => entry.key === target.itemKey)
  const permission = item?.permission ?? group?.permission
  return permission ? PERMISSION_LABEL[permission] : ''
})

function openEditGroup(group: MenuGroupDef, index: number) {
  editTarget.value = { kind: 'group', groupKey: group.key }
  editForm.parent = '0'
  editForm.type = 'dir'
  editForm.label = group.label
  editForm.icon = group.icon
  editForm.path = ''
  editForm.order = index + 1
  editForm.visible = !group.hidden
  editForm.enabled = !group.disabled
  editVisible.value = true
}

function openEditItem(group: MenuGroupDef, item: MenuItemDef, index: number) {
  editTarget.value = { kind: 'item', groupKey: group.key, itemKey: item.key }
  editForm.parent = group.key
  editForm.type = 'menu'
  editForm.label = item.label
  editForm.icon = item.icon ?? group.icon
  editForm.path = item.key
  editForm.order = index + 1
  editForm.visible = !item.hidden
  editForm.enabled = !item.disabled
  editVisible.value = true
}

function openEditTop(item: TopMenuItem, index: number) {
  editTarget.value = { kind: 'top', itemKey: item.key }
  editForm.parent = 'top'
  editForm.type = 'menu'
  editForm.label = item.label
  editForm.icon = item.icon
  editForm.path = item.key
  editForm.order = index + 1
  editForm.visible = true
  editForm.enabled = !item.disabled
  editVisible.value = true
}

function handleTypeChange(value: unknown) {
  if (value === 'dir') {
    editForm.parent = '0'
    editForm.path = ''
  }
}

/** 保存后滚动到目标分组，避免用户以为“没反应” */
function scrollToGroup(key: string) {
  nextTick(() => {
    const el = document.querySelector(`[data-group-key="${key}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function submitEdit() {
  const target = editTarget.value
  if (!target) return false
  const label = editForm.label.trim()
  if (!label) {
    Message.warning('请填写菜单名称')
    return false
  }

  if (target.kind === 'group') {
    menuStore.updateGroup(target.groupKey, {
      label,
      icon: editForm.icon,
      hidden: !editForm.visible,
      disabled: !editForm.enabled,
    })
    menuStore.setGroupOrder(target.groupKey, editForm.order)
    Message.success('已保存')
    return true
  }

  if (target.kind === 'top') {
    menuStore.updateTopItem(target.itemKey, {
      label,
      icon: editForm.icon,
      disabled: !editForm.enabled,
    })
    if (editForm.parent !== 'top') {
      menuStore.restoreTopItem(target.itemKey, editForm.parent)
      Message.success(editForm.parent === '0' ? '已移到一级菜单' : '已还原到侧边栏')
      const moved = menuStore.groups.find(group =>
        group.children.some(child => child.key === target.itemKey),
      )
      if (moved) scrollToGroup(moved.key)
    } else {
      menuStore.setTopOrder(target.itemKey, editForm.order)
      Message.success('已保存')
      scrollToGroup('__top')
    }
    return true
  }

  const { groupKey, itemKey } = target
  menuStore.updateItem(groupKey, itemKey, {
    label,
    icon: editForm.icon,
    hidden: !editForm.visible,
    disabled: !editForm.enabled,
  })

  const parent = editForm.type === 'dir' ? '0' : editForm.parent
  if (parent === groupKey) {
    menuStore.setItemOrder(groupKey, itemKey, editForm.order)
    Message.success('已保存')
    scrollToGroup(groupKey)
  } else {
    menuStore.relocateItem(groupKey, itemKey, parent)
    if (parent === 'top') {
      menuStore.setTopOrder(itemKey, editForm.order)
      Message.success('已移到顶部菜单')
      scrollToGroup('__top')
    } else if (parent === '0') {
      const created = menuStore.groups.find(group => group.children.some(child => child.key === itemKey))
      if (created) {
        menuStore.setGroupOrder(created.key, editForm.order)
        scrollToGroup(created.key)
      }
      Message.success('已移到一级菜单')
    } else {
      menuStore.setItemOrder(parent, itemKey, editForm.order)
      Message.success('已移到目标分组')
      scrollToGroup(parent)
    }
  }

  return true
}

function restoreToSidebar(item: TopMenuItem) {
  menuStore.restoreTopItem(item.key)
  Message.success(`「${item.label}」已还原到侧边栏`)
}

  /* ── 新增一级菜单 ─────────────────────────────────────── */

const groupModalVisible = ref(false)
const groupForm = reactive({ label: '', icon: 'layers' })

function openGroupModal() {
  groupForm.label = ''
  groupForm.icon = 'layers'
  groupModalVisible.value = true
}

function submitGroup() {
  const label = groupForm.label.trim()
  if (!label) {
      Message.warning('请填写一级菜单名称')
    return false
  }
  menuStore.addGroup(label, groupForm.icon)
    Message.success(`已新增一级菜单「${label}」`)
  return true
}

/* ── 添加二级菜单 ─────────────────────────────────────── */

const itemModalVisible = ref(false)
const itemTargetGroup = ref('')
const itemForm = reactive({ path: '', label: '' })

const pageOptions = computed(() =>
  PAGE_CATALOG.map(page => ({
    label: `${page.section} · ${page.label}`,
    value: page.key,
  })),
)

function openItemModal(groupKey: string) {
  itemTargetGroup.value = groupKey
  itemForm.path = ''
  itemForm.label = ''
  itemModalVisible.value = true
}

function handlePagePicked(value: unknown) {
  const path = typeof value === 'string' ? value : ''
  if (!path) return
  if (!itemForm.label.trim()) itemForm.label = findPageTitle(path)
}

function submitItem() {
  if (!itemForm.path) {
    Message.warning('请选择要挂载的页面')
    return false
  }
  const label = itemForm.label.trim() || findPageTitle(itemForm.path)
  menuStore.addItem(itemTargetGroup.value, { key: itemForm.path, label })
    Message.success(`已添加「${label}」`)
  return true
}

</script>

<style scoped>
.modules-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 8px;
}

/* ─── 页头 ───────────────────────────────────────────────── */
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}

.page-eyebrow {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: rgba(76, 157, 228, 0.6);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}

.page-desc {
  margin: 8px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--mc-text-primary) 66%, transparent);
  max-width: 560px;
}

.page-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ─── 主体网格 ───────────────────────────────────────────── */
.modules-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 268px;
  gap: 16px;
  align-items: start;
}

.group-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

/* ─── 顶部菜单卡 ─────────────────────────────────────────── */
.top-card {
  border-radius: 15px;
  border: 1px dashed color-mix(in srgb, var(--mc-primary) 46%, transparent);
  background:
    linear-gradient(180deg, rgba(76, 157, 228, 0.09) 0%, rgba(76, 157, 228, 0.03) 100%);
  overflow: hidden;
}

.top-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  border-bottom: 1px solid color-mix(in srgb, var(--mc-text-primary) 12%, transparent);
}

.top-card-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: rgba(76, 157, 228, 0.14);
  color: var(--mc-text-primary);
  font-size: 15px;
  flex-shrink: 0;
}

.top-card-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.top-card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}

.top-card-desc {
  margin: 0;
  font-size: 11px;
  color: color-mix(in srgb, var(--mc-text-primary) 48%, transparent);
}

.top-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 11px 13px;
}

.top-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 7px 5px 10px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 15%, transparent);
  background: color-mix(in srgb, var(--mc-bg-card) 92%, transparent);
  min-width: 0;
}

.top-chip-icon {
  font-size: 13px;
  color: rgba(124, 195, 240, 0.9);
}

.top-chip-label {
  font-size: 12.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 94%, transparent);
}

.top-chip-path {
  font-size: 10.5px;
  font-family: var(--mc-font-mono);
  color: color-mix(in srgb, var(--mc-text-primary) 42%, transparent);
}

@media (max-width: 960px) {
  .top-chip-path { display: none; }
}

/* ─── 一级菜单卡 ─────────────────────────────────────────── */
.group-card {
  border-radius: 15px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 17%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--mc-bg-card) 92%, transparent) 0%, color-mix(in srgb, var(--mc-bg-card) 92%, transparent) 100%);
  overflow: hidden;
  transition: border-color 0.18s ease, opacity 0.18s ease;
}

.group-card:hover {
  border-color: color-mix(in srgb, var(--mc-text-primary) 27%, transparent);
}

.group-card--muted {
  opacity: 0.58;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 13px;
  border-bottom: 1px solid color-mix(in srgb, var(--mc-text-primary) 14%, transparent);
  flex-wrap: wrap;
}

.group-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  border-radius: 9px;
  background: linear-gradient(145deg, rgba(76, 157, 228, 0.16) 0%, rgba(76, 157, 228, 0.12) 100%);
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.18s var(--mc-ease-spring), box-shadow 0.18s ease;
  flex-shrink: 0;
}
.group-icon:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(76, 157, 228, 0.16);
}

.group-icon--locked {
  cursor: default;
  background: rgba(76, 157, 228, 0.04);
  color: color-mix(in srgb, var(--mc-text-primary) 66%, transparent);
}
.group-icon--locked:hover {
  transform: none;
  box-shadow: none;
}

.group-name {
  width: 140px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--mc-font-family);
  outline: none;
  transition: border-color 0.16s ease, background 0.16s ease;
}
.group-name:hover {
  border-color: color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  background: rgba(76, 157, 228, 0.04);
}
.group-name:focus {
  border-color: rgba(124, 195, 240, 0.5);
  background: rgba(76, 157, 228, 0.05);
}

.group-name--readonly {
  display: inline-flex;
  align-items: center;
  color: color-mix(in srgb, var(--mc-text-primary) 90%, transparent);
}

.group-count {
  font-size: 11px;
  color: color-mix(in srgb, var(--mc-text-primary) 39%, transparent);
  font-family: var(--mc-font-mono);
}

.group-spacer {
  flex: 1;
  min-width: 6px;
}

/* ─── 徽标 ───────────────────────────────────────────────── */
.badge {
  padding: 1px 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: color-mix(in srgb, var(--mc-text-primary) 70%, transparent);
  background: rgba(76, 157, 228, 0.06);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 14%, transparent);
  white-space: nowrap;
}
.badge--custom {
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.1);
  border-color: rgba(124, 195, 240, 0.28);
}
.badge--off {
  color: rgba(240, 160, 64, 0.85);
  background: rgba(240, 160, 64, 0.1);
  border-color: rgba(240, 160, 64, 0.2);
}
.badge--lock {
  color: rgba(155, 126, 196, 0.9);
  background: rgba(155, 126, 196, 0.1);
  border-color: rgba(155, 126, 196, 0.22);
}

/* ─── 迷你按钮 ───────────────────────────────────────────── */
.mini-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 17%, transparent);
  border-radius: 6px;
  background: transparent;
  color: color-mix(in srgb, var(--mc-text-primary) 56%, transparent);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
  flex-shrink: 0;
}
.mini-btn:hover:not(:disabled) {
  background: rgba(76, 157, 228, 0.07);
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  border-color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent);
}
.mini-btn:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}
.mini-btn--danger:hover:not(:disabled) {
  background: rgba(224, 87, 110, 0.12);
  border-color: rgba(224, 87, 110, 0.3);
  color: #F2748A;
}
.mini-btn--layer:hover:not(:disabled) {
  background: rgba(76, 157, 228, 0.14);
  border-color: rgba(124, 195, 240, 0.42);
  color: #7CC3F0;
}

  /* ─── 二级菜单行 ─────────────────────────────────────────── */
.item-list {
  display: flex;
  flex-direction: column;
  padding: 6px 8px 10px;
  gap: 1px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 9px;
  transition: background 0.14s ease;
}
.item-row:hover {
  background: rgba(76, 157, 228, 0.04);
}
.item-row--muted {
  opacity: 0.48;
}

.item-bullet {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(76, 157, 228, 0.5);
  flex-shrink: 0;
  margin-left: 4px;
}

.item-label {
  min-width: 96px;
  max-width: 180px;
  padding: 0;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  font-size: 12.5px;
  font-family: var(--mc-font-family);
  text-align: left;
  cursor: text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-input {
  width: 130px;
  height: 24px;
  padding: 0 7px;
  border: 1px solid rgba(124, 195, 240, 0.44);
  border-radius: 6px;
  background: rgba(76, 157, 228, 0.06);
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  font-size: 12.5px;
  font-family: var(--mc-font-family);
  outline: none;
}

.item-path {
  font-family: var(--mc-font-mono);
  font-size: 10.5px;
  color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.item-empty {
  margin: 8px 10px;
  font-size: 12px;
  color: color-mix(in srgb, var(--mc-text-primary) 43%, transparent);
}

.add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 6px 4px 0;
  padding: 8px;
  border: 1px dashed color-mix(in srgb, var(--mc-text-primary) 27%, transparent);
  border-radius: 9px;
  background: transparent;
  color: color-mix(in srgb, var(--mc-text-primary) 56%, transparent);
  font-size: 12px;
  font-family: var(--mc-font-family);
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
}
.add-item-btn:hover:not(:disabled) {
  border-color: rgba(124, 195, 240, 0.44);
  background: rgba(76, 157, 228, 0.05);
  color: #4c9de4;
}
.add-item-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stack-empty {
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: color-mix(in srgb, var(--mc-text-primary) 43%, transparent);
}

/* ─── 右侧概览 ───────────────────────────────────────────── */
.side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 0;
}

.side-card {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 17%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--mc-bg-card) 82%, transparent) 0%, color-mix(in srgb, var(--mc-bg-card) 82%, transparent) 100%);
}

.side-title {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--mc-text-primary) 50%, transparent);
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
}

.stat {
  padding: 10px;
  border-radius: 10px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 11%, transparent);
}

.stat dt {
  font-size: 11px;
  color: color-mix(in srgb, var(--mc-text-primary) 52%, transparent);
  margin-bottom: 4px;
}

.stat dd {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  font-family: var(--mc-font-mono);
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  line-height: 1.1;
}

.tips {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 12px;
  line-height: 1.6;
  color: color-mix(in srgb, var(--mc-text-primary) 66%, transparent);
}
.tips li::marker {
  color: rgba(76, 157, 228, 0.5);
}
.tips kbd {
  font-family: var(--mc-font-mono);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 27%, transparent);
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
}

.side-card--note {
  border-style: dashed;
}

.note-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--mc-text-primary) 56%, transparent);
}

/* ─── 图标选择 ───────────────────────────────────────────── */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  width: 216px;
}

.icon-grid--form {
  width: 100%;
  grid-template-columns: repeat(9, 1fr);
}

.icon-cell {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: color-mix(in srgb, var(--mc-text-primary) 70%, transparent);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}
.icon-cell:hover {
  background: rgba(76, 157, 228, 0.08);
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}
.icon-cell--active {
  background: rgba(76, 157, 228, 0.12);
  border-color: rgba(124, 195, 240, 0.44);
  color: #4c9de4;
}

/* ─── 表单 ───────────────────────────────────────────────── */
.form-row {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: center;
  gap: 6px 12px;
  margin-bottom: 14px;
}
.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
}

.form-label--required::before {
  content: '*';
  margin-right: 4px;
  color: #F2748A;
}

.form-hint {
  grid-column: 2;
  font-size: 11px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--mc-text-primary) 42%, transparent);
}

  /* ─── 响应式 ─────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .modules-body {
    grid-template-columns: minmax(0, 1fr);
  }
  .side {
    position: static;
  }
  .stat-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 20px;
  }
  .item-path {
    display: none;
  }
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .icon-grid {
    width: 190px;
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
