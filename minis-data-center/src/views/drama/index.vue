<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">短剧列表</div>
        <div class="page-subtitle">管理平台内所有短剧内容</div>
      </div>
      <div class="page-actions">
        <a-button @click="$router.push('/drama/tags')">
          <template #icon><icon-tag /></template>
          标签管理
        </a-button>
        <a-button type="primary" @click="$router.push('/drama/upload')">
          <template #icon><icon-upload /></template>
          上传短剧
        </a-button>
      </div>
    </div>

    <div class="toolbar">
      <a-input-search
        v-model="keyword"
        placeholder="搜索短剧名称..."
        allow-clear
        style="width: 280px"
        @search="handleSearch"
        @clear="handleSearch"
      />
    </div>

    <div v-if="tagList.length" class="tag-filter">
      <span class="tag-filter-label">标签筛选</span>
      <div class="tag-filter-list">
        <button
          class="tag-filter-item"
          :class="{ active: !activeTag }"
          @click="selectTag('')"
        >
          全部
        </button>
        <button
          v-for="tag in tagList"
          :key="tag.id"
          class="tag-filter-item"
          :class="{ active: activeTag === tag.id }"
          @click="selectTag(tag.id)"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="dramaStore.list"
        :loading="loading"
        :pagination="{
          total: dramaStore.total,
          current: dramaStore.currentPage,
          pageSize: dramaStore.pageSize,
          showTotal: true,
          showPageSize: true,
        }"
        row-key="id"
        :bordered="false"
        @page-change="handlePageChange"
      >
        <template #cover="{ record }">
          <a-image
            v-if="record.coverUrl"
            :src="record.coverUrl"
            width="56"
            height="38"
            fit="cover"
            style="border-radius: 4px; display: block"
          />
          <div v-else class="cover-placeholder">
            <icon-video-camera
              style="font-size: 18px; color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent)"
            />
          </div>
        </template>
        <template #name="{ record }">
          <span class="drama-name" @click="goDetail(record.id)">{{
            record.name
          }}</span>
        </template>
        <template #tags="{ record }">
          <div class="tag-list">
            <template v-if="record.tags">
              <a-tag
                v-for="tag in parseTags(record.tags)"
                :key="tag"
                size="small"
                >{{ tag }}</a-tag
              >
            </template>
            <span v-else class="empty-text">—</span>
          </div>
        </template>
        <template #episodes="{ record }">
          <div class="episode-count">
            <span>{{ record.totalEpisodes ?? 0 }}</span>
            <span class="episode-unit"> 集</span>
          </div>
          <div>
            <span class="episode-free"
              >免费 {{ record.freeEpisodes ?? 0 }} 集</span
            >
          </div>
        </template>
        <template #unlockMode="{ record }">
          <a-tag :color="unlockModeColor(record.unlockMode)" size="small">{{ unlockModeLabel(record.unlockMode) }}</a-tag>
        </template>
        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="primary" size="small" @click="goDetail(record.id)"
              >详情</a-button
            >
            <a-button type="text" size="small" @click="handleCopyNamingTemplate(record)"
              >复制推广名称</a-button
            >
            <a-popconfirm
              content="确认删除该短剧？删除后不可恢复。"
              @ok="handleDelete(record.id)"
            >
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
      </ResizableTable>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'DramaList' })
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Message, Modal } from "@arco-design/web-vue";
import { useDramaStore } from "@/stores/drama.ts";
import { useAppStore } from "@/stores/app.ts";
import { deleteDrama, fetchTagList } from "@/api/drama.ts";
import { renderNamingTemplate } from "@/api/adAccount.ts";
import type { Tag } from "@/types/drama.ts";
import { unlockModeLabel, unlockModeColor } from "@/types/drama.ts";
import ResizableTable from "@/components/ResizableTable/index.vue";
import { useAsyncLock } from "@/composables/useAsyncLock.ts";

const router = useRouter();
const dramaStore = useDramaStore();
const appStore = useAppStore();
const loading = ref(false);
const keyword = ref("");
const activeTag = ref<number | string>("");
const tagList = ref<Tag[]>([]);

function parseTags(tags: string | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean);
}

const columns = ref([
  {
    title: "封面",
    slotName: "cover",
    width: 76,
    resizable: true,
    minWidth: 60,
  },
  { title: "名称", slotName: "name", width: 200, resizable: true, minWidth: 120 },
  { title: "短剧ID", dataIndex: "id", width: 120, resizable: true, minWidth: 80 },
  { title: "标签", slotName: "tags", width: 180, resizable: true, minWidth: 100 },
  {
    title: "集数",
    slotName: "episodes",
    width: 160,
    resizable: true,
    minWidth: 120,
  },
  {
    title: "解锁模式",
    slotName: "unlockMode",
    width: 120,
    resizable: true,
    minWidth: 90,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    width: 160,
    resizable: true,
    minWidth: 120,
  },
  {
    title: "操作",
    slotName: "operations",
    width: 180,
    resizable: true,
    minWidth: 140,
  },
]);

async function fetchList() {
  loading.value = true;
  try {
    await dramaStore.fetchList({
      name: keyword.value || undefined,
      tagIds: activeTag.value ? [activeTag.value] : undefined,
    });
  } finally {
    loading.value = false;
  }
}

async function loadTags() {
  try {
    const res = await fetchTagList()
    const tags = res && typeof res === 'object' && 'rows' in res ? res.rows : Array.isArray(res) ? res : []
    tagList.value = tags.filter((t: Tag) => t.status === 1);
  } catch {
    // ignore
  }
}

function selectTag(tagId: number | string) {
  activeTag.value = tagId;
  dramaStore.currentPage = 1;
  fetchList();
}

function handleSearch() {
  dramaStore.currentPage = 1;
  fetchList();
}

function handlePageChange(page: number) {
  dramaStore.currentPage = page;
  fetchList();
}

function goDetail(id: string) {
  router.push(`/drama/${id}`)
}

const { runWithKey } = useAsyncLock();

async function handleDelete(id: string) {
  await runWithKey(id, async () => {
    try {
      await deleteDrama(id);
      Message.success("删除成功");
      await fetchList();
    } catch (e: any) {
      const msg = e?.message || "";
      // 后端返回展位引用警告时，弹出二次确认
      if (msg.includes("首页展位引用")) {
        Modal.warning({
          title: "高危操作确认",
          content: msg + "\n确认删除将同时移除相关展位配置。",
          okText: "确认删除",
          cancelText: "取消",
          hideCancel: false,
          onOk: async () => {
            await runWithKey(`${id}-force`, async () => {
              await deleteDrama(id, true);
              Message.success("删除成功，已同步清理展位引用");
              await fetchList();
            });
          },
        });
      }
      // 其他错误由 axios 拦截器已处理
    }
  });
}

watch(
  () => appStore.currentClientKey,
  () => {
    dramaStore.currentPage = 1;
    activeTag.value = "";
    keyword.value = "";
    loadTags();
    fetchList();
  },
);

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fallback below
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

async function handleCopyNamingTemplate(record: any) {
  const dramaName = record.name || ''
  const dramaId = String(record.id || '')
  if (!dramaName || !dramaId) {
    Message.warning('未获取到短剧信息')
    return
  }

  // 优先调用后端渲染接口，确保始终使用最新保存的命名模板（含分隔符和日期格式）
  let text = ''
  try {
    const res = await renderNamingTemplate({ dramaName, dramaId })
    text = res?.renderedName || ''
  } catch {
    // 渲染接口异常时兜底使用默认模板格式，不影响复制功能
  }
  if (!text) {
    const now = new Date()
    const startDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    text = `${dramaName}-drama_${dramaId}_${startDate}`
  }

  try {
    const copied = await copyText(text)
    if (copied) {
      Message.success('推广系列名称已复制到剪贴板')
    } else {
      throw new Error('copy command returned false')
    }
  } catch {
    Modal.info({
      title: '推广系列名称已生成',
      content: text,
      okText: '知道了',
    })
  }
}

onMounted(() => {
  loadTags();
  fetchList();
});
</script>

<style scoped>
.cover-placeholder {
  width: 56px;
  height: 38px;
  border-radius: 4px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
}
.page-subtitle {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  margin-top: 2px;
}
.page-actions {
  display: flex;
  gap: 8px;
}

.toolbar {
  margin-bottom: 12px;
}

.tag-filter {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 14px;
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: 10px;
}
.tag-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
  white-space: nowrap;
  padding-top: 5px;
  flex-shrink: 0;
}
.tag-filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-filter-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.tag-filter-item:hover {
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  border-color: color-mix(in srgb, var(--mc-text-primary) 34%, transparent);
  background: rgba(76, 157, 228, 0.07);
}
.tag-filter-item.active {
  border-color: #4c9de4;
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.1);
}
.tag-filter-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}

.drama-name {
  font-weight: 500;
  color: var(--mc-text-primary);
  cursor: pointer;
  transition: color var(--mc-transition);
}
.drama-name:hover {
  color: var(--mc-primary);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-text {
  color: var(--mc-text-disabled);
  font-size: 13px;
}

.episode-count {
  font-weight: 600;
  color: var(--mc-text-primary);
}
.episode-free {
  font-size: 11px;
  color: rgba(76, 157, 228, 0.7);
}

.row-actions {
  display: flex;
  gap: 4px;
}
</style>
