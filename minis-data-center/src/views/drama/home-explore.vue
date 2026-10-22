<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">More Drama 管理</div>
        <div class="page-subtitle">管理 C 端"更多短剧"模块展示的内容，开启展示的短剧将出现在用户首页</div>
      </div>
    </div>

    <div class="table-card">
      <a-table
        :columns="columns"
        :data="dramaList"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="false"
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
            <icon-video-camera style="font-size: 18px; color: rgba(255, 255, 255, 0.2)" />
          </div>
        </template>
        <template #name="{ record }">
          <span class="drama-name">{{ record.name }}</span>
        </template>
        <template #episodes="{ record }">
          <span>{{ record.totalEpisodes ?? 0 }} 集</span>
        </template>
        <template #display="{ record }">
          <a-switch
            :model-value="record.status === 1"
            :loading="togglingId === record.id"
            checked-text="展示"
            unchecked-text="隐藏"
            @change="(val: string | number | boolean) => handleToggle(record, !!val)"
          />
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { Message } from "@arco-design/web-vue";
import { useDramaStore } from "@/stores/drama.ts";
import { useAppStore } from "@/stores/app.ts";
import { updateDrama } from "@/api/drama.ts";

const dramaStore = useDramaStore();
const appStore = useAppStore();
const loading = ref(false);
const togglingId = ref<string | null>(null);

const dramaList = ref<any[]>([]);

const columns = [
  { title: "封面", slotName: "cover", width: 76 },
  { title: "名称", slotName: "name", width: 200 },
  { title: "集数", slotName: "episodes", width: 80 },
  { title: "C端展示", slotName: "display", width: 120 },
  { title: "创建时间", dataIndex: "createTime", width: 160 },
];

async function fetchList() {
  loading.value = true;
  try {
    // 查询所有短剧（不限状态），让管理员看到全部
    await dramaStore.fetchList({});
    dramaList.value = dramaStore.list;
  } finally {
    loading.value = false;
  }
}

async function handleToggle(record: any, enabled: boolean) {
  togglingId.value = record.id;
  try {
    const newStatus = enabled ? 1 : 2; // 1=上线展示, 2=下线隐藏
    await updateDrama(record.id, { status: newStatus });
    record.status = newStatus;
    Message.success(enabled ? "已开启展示" : "已关闭展示");
  } catch {
    // axios 拦截器已处理
  } finally {
    togglingId.value = null;
  }
}

watch(
  () => appStore.currentClientKey,
  () => fetchList(),
);

onMounted(fetchList);
</script>

<style scoped>
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
.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}
.cover-placeholder {
  width: 56px;
  height: 38px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}
.drama-name {
  font-weight: 500;
  color: var(--mc-text-primary);
}
</style>
