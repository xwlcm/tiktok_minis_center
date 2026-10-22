<template>
  <div class="modules-page">
    <!-- ── 页头 ─────────────────────────────────────────── -->
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-eyebrow">WORKSPACE</p>
        <h1 class="page-title">模块管理</h1>
        <p class="page-desc">
          调整左侧侧边栏的显示与顺序，自定义一级、二级菜单。配置保存在当前浏览器。
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
        <article
          v-for="(group, groupIndex) in menuStore.groups"
          :key="group.key"
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
              class="mini-btn"
              title="上移"
              :disabled="groupIndex === 0"
              @click="menuStore.moveGroup(group.key, -1)"
            >
              <IconUp />
            </button>
            <button
              type="button"
              class="mini-btn"
              title="下移"
              :disabled="groupIndex === menuStore.groups.length - 1"
              @click="menuStore.moveGroup(group.key, 1)"
            >
              <IconDown />
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

              <span class="group-spacer" />

              <a-switch
                size="small"
                :model-value="!item.hidden"
                :disabled="group.locked"
                @change="menuStore.toggleItem(group.key, item.key)"
              />
              <button
                type="button"
                class="mini-btn"
                title="上移"
                :disabled="itemIndex === 0"
                @click="menuStore.moveItem(group.key, item.key, -1)"
              >
                <IconUp />
              </button>
              <button
                type="button"
                class="mini-btn"
                title="下移"
                :disabled="itemIndex === group.children.length - 1"
                @click="menuStore.moveItem(group.key, item.key, 1)"
              >
                <IconDown />
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
                <dt>自定义</dt>
              <dd>{{ menuStore.customCount }}</dd>
            </div>
          </dl>
        </div>

        <div class="side-card">
          <p class="side-title">操作提示</p>
          <ul class="tips">
              <li>双击二级菜单名称可直接重命名。</li>
              <li>点击一级菜单左侧图标可更换图标。</li>
              <li>关闭开关即从左侧侧边栏隐藏，不会删除配置。</li>
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconDelete,
  IconDown,
  IconEye,
  IconPlus,
  IconRefresh,
  IconUp,
} from '@arco-design/web-vue/es/icon'
import {
  FEATURES,
  findPageTitle,
  ICON_OPTIONS,
  PAGE_CATALOG,
  resolveMenuIcon,
  type MenuGroupDef,
} from '@/config/menu.ts'
import { useMenuStore } from '@/stores/menu.ts'

defineOptions({ name: 'ModuleManager' })

const menuStore = useMenuStore()

/* ── 常量 ─────────────────────────────────────────────── */

const ICON_POPOVER_STYLE = {
  padding: '8px',
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(31, 80, 132, 0.14)',
  borderRadius: '12px',
  boxShadow: '0 18px 44px rgba(23, 54, 92, 0.39)',
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
  color: rgba(22, 41, 63, 0.92);
}

.page-desc {
  margin: 8px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: rgba(22, 41, 63, 0.54);
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

/* ─── 一级菜单卡 ─────────────────────────────────────────── */
.group-card {
  border-radius: 15px;
  border: 1px solid rgba(31, 80, 132, 0.11);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.72) 100%);
  overflow: hidden;
  transition: border-color 0.18s ease, opacity 0.18s ease;
}

.group-card:hover {
  border-color: rgba(31, 80, 132, 0.18);
}

.group-card--muted {
  opacity: 0.58;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 13px;
  border-bottom: 1px solid rgba(31, 80, 132, 0.09);
  flex-wrap: wrap;
}

.group-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(31, 80, 132, 0.14);
  border-radius: 9px;
  background: linear-gradient(145deg, rgba(76, 157, 228, 0.16) 0%, rgba(76, 157, 228, 0.12) 100%);
  color: rgba(22, 41, 63, 0.92);
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
  color: rgba(22, 41, 63, 0.54);
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
  color: rgba(22, 41, 63, 0.92);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--mc-font-family);
  outline: none;
  transition: border-color 0.16s ease, background 0.16s ease;
}
.group-name:hover {
  border-color: rgba(31, 80, 132, 0.14);
  background: rgba(76, 157, 228, 0.04);
}
.group-name:focus {
  border-color: rgba(76, 157, 228, 0.4);
  background: rgba(76, 157, 228, 0.05);
}

.group-name--readonly {
  display: inline-flex;
  align-items: center;
  color: rgba(22, 41, 63, 0.74);
}

.group-count {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.32);
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
  color: rgba(22, 41, 63, 0.57);
  background: rgba(76, 157, 228, 0.06);
  border: 1px solid rgba(31, 80, 132, 0.09);
  white-space: nowrap;
}
.badge--custom {
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.1);
  border-color: rgba(76, 157, 228, 0.22);
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
  border: 1px solid rgba(31, 80, 132, 0.11);
  border-radius: 6px;
  background: transparent;
  color: rgba(22, 41, 63, 0.46);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
  flex-shrink: 0;
}
.mini-btn:hover:not(:disabled) {
  background: rgba(76, 157, 228, 0.07);
  color: rgba(22, 41, 63, 0.92);
  border-color: rgba(31, 80, 132, 0.22);
}
.mini-btn:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}
.mini-btn--danger:hover:not(:disabled) {
  background: rgba(224, 87, 110, 0.12);
  border-color: rgba(224, 87, 110, 0.3);
  color: #E0576E;
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
  color: rgba(22, 41, 63, 0.92);
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
  border: 1px solid rgba(76, 157, 228, 0.35);
  border-radius: 6px;
  background: rgba(76, 157, 228, 0.06);
  color: rgba(22, 41, 63, 0.92);
  font-size: 12.5px;
  font-family: var(--mc-font-family);
  outline: none;
}

.item-path {
  font-family: var(--mc-font-mono);
  font-size: 10.5px;
  color: rgba(22, 41, 63, 0.27);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.item-empty {
  margin: 8px 10px;
  font-size: 12px;
  color: rgba(22, 41, 63, 0.35);
}

.add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 6px 4px 0;
  padding: 8px;
  border: 1px dashed rgba(31, 80, 132, 0.18);
  border-radius: 9px;
  background: transparent;
  color: rgba(22, 41, 63, 0.46);
  font-size: 12px;
  font-family: var(--mc-font-family);
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
}
.add-item-btn:hover:not(:disabled) {
  border-color: rgba(76, 157, 228, 0.35);
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
  color: rgba(22, 41, 63, 0.35);
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
  border: 1px solid rgba(31, 80, 132, 0.11);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.66) 100%);
}

.side-title {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(22, 41, 63, 0.41);
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
  border: 1px solid rgba(31, 80, 132, 0.07);
}

.stat dt {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.43);
  margin-bottom: 4px;
}

.stat dd {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  font-family: var(--mc-font-mono);
  color: rgba(22, 41, 63, 0.92);
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
  color: rgba(22, 41, 63, 0.54);
}
.tips li::marker {
  color: rgba(76, 157, 228, 0.5);
}
.tips kbd {
  font-family: var(--mc-font-mono);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid rgba(31, 80, 132, 0.18);
  color: rgba(22, 41, 63, 0.68);
}

.side-card--note {
  border-style: dashed;
}

.note-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: rgba(22, 41, 63, 0.46);
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
  color: rgba(22, 41, 63, 0.57);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}
.icon-cell:hover {
  background: rgba(76, 157, 228, 0.08);
  color: rgba(22, 41, 63, 0.92);
}
.icon-cell--active {
  background: rgba(76, 157, 228, 0.12);
  border-color: rgba(76, 157, 228, 0.35);
  color: #4c9de4;
}

/* ─── 表单 ───────────────────────────────────────────────── */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(22, 41, 63, 0.68);
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
