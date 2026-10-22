<template>
  <div class="far-page">
    <!-- 页头 -->
    <div class="far-header">
      <div>
        <div class="far-title">强弹规则</div>
        <div class="far-subtitle">强弹规则只对广告链接进入的用户生效；每条规则 = 规则名称 + A首页 / B短剧页 / C广告结果 / D计算时间 四组细粒度策略，一个弹窗配完</div>
      </div>
      <a-button type="primary" size="large" class="far-add-btn" @click="openForm()">
        <template #icon><icon-plus /></template>
        新增规则
      </a-button>
    </div>

    <!-- 概览统计 -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon--total"><icon-file /></div>
        <div>
          <div class="stat-num">{{ stat.total }}</div>
          <div class="stat-label">规则总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--on"><icon-check-circle /></div>
        <div>
          <div class="stat-num">{{ stat.enabled }}</div>
          <div class="stat-label">启用中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--default"><icon-safe /></div>
        <div>
          <div class="stat-num">{{ stat.fallback }}</div>
          <div class="stat-label">兜底规则</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--app"><icon-apps /></div>
        <div>
          <div class="stat-num">{{ stat.boundApps }}</div>
          <div class="stat-label">已绑定应用</div>
        </div>
      </div>
    </div>

    <!-- 规则列表 -->
    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="ruleList"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="{ pageSize: 20, showTotal: true }"
      >
        <template #ruleName="{ record }">
          <div class="rule-name-cell">
            <div class="rule-name-line">
              <span class="rule-name">{{ record.ruleName }}</span>
              <a-tag v-if="record.isDefault === 1" color="orangered" size="small">兜底</a-tag>
            </div>
            <span class="rule-id">ID: {{ record.id }}</span>
          </div>
        </template>
        <template #rewarded="{ record }">
          <div class="param-cell">
            <span>首次 <strong>{{ toSeconds(record.showRewardedVideoAdTimeout) }}</strong> 秒</span>
            <span class="param-sub">每 {{ toSeconds(record.showRewardedVideoAdInterval) }} 秒再弹</span>
          </div>
        </template>
        <template #interstitial="{ record }">
          <div class="param-cell">
            <span>首次 <strong>{{ toSeconds(record.showInterstitialAdTimeout) }}</strong> 秒</span>
            <span class="param-sub">每 {{ toSeconds(record.showInterstitialAdInterval) }} 秒再弹</span>
          </div>
        </template>
        <template #forceLimit="{ record }">
          <div class="param-cell">
            <span>{{ record.maxForceCount > 0 ? `最多 ${record.maxForceCount} 次` : '不限次数' }}</span>
            <span class="param-sub">{{ record.resetIntervalHours > 0 ? `${record.resetIntervalHours} 小时后重置` : '永不重置' }}</span>
          </div>
        </template>
        <template #dramaForce="{ record }">
          <a-tag v-if="record.forceOnDramaPage === 1" color="orangered" size="small">开启</a-tag>
          <a-tag v-else color="gray" size="small">关闭</a-tag>
        </template>
        <template #boundApps="{ record }">
          <div v-if="record.clientKeys && record.clientKeys.length" class="bound-apps">
            <a-tooltip v-for="ck in record.clientKeys" :key="ck" :content="ck">
              <a-tag size="small">{{ appNameOf(ck) }}</a-tag>
            </a-tooltip>
          </div>
          <span v-else class="unbound-text">{{ record.isDefault === 1 ? '全局兜底生效' : '未绑定应用' }}</span>
        </template>
        <template #status="{ record }">
          <a-switch
            v-if="record.isDefault !== 1"
            :model-value="record.status === 1"
            :loading="togglingId === record.id"
            checked-text="启用"
            unchecked-text="禁用"
            @change="(val: string | number | boolean) => handleToggleStatus(record, !!val)"
          />
          <a-tag v-else color="green" size="small">常驻启用</a-tag>
        </template>
        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="primary" size="small" @click="openForm(record)">
              <template #icon><icon-edit /></template>
              编辑配置
            </a-button>
            <a-popconfirm
              v-if="record.isDefault !== 1"
              content="确定要删除该规则吗？已绑定的应用将回落全局兜底规则。"
              type="warning"
              @ok="handleDelete(record)"
            >
              <a-button type="text" size="small" status="danger">
                <template #icon><icon-delete /></template>
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
      </ResizableTable>
    </div>

    <!-- 新增/编辑弹窗：分区卡片式布局 -->
    <a-modal
      v-model:visible="formVisible"
      :title="editingRule ? `编辑配置 · ${editingRule.ruleName}` : '新增强弹规则'"
      :ok-loading="submitting"
      ok-text="保存全部配置"
      width="1100px"
      :body-style="{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '16px 20px' }"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <!-- ① 基础信息 -->
        <section class="block-card">
          <div class="block-head">
            <span class="block-badge">①</span>
            <span class="block-title">规则名称</span>
            <span class="block-tip">给规则起个好记的名字，方便绑定应用时识别</span>
          </div>
          <a-form-item field="ruleName" label="规则名称" hide-asterisk>
            <a-input v-model="form.ruleName" placeholder="如：标准强弹策略" :max-length="64" allow-clear />
          </a-form-item>
        </section>

        <!-- ② 细粒度策略：场景导航 + 分组配置（基础调度参数已全部并入各场景） -->
        <section class="block-card">
          <div class="block-head">
            <span class="block-badge">②</span>
            <span class="block-title">细粒度策略</span>
            <span class="block-tip">点左侧切换场景；默认值即现网行为，不修改就不改变线上表现</span>
          </div>

          <!-- 场景状态条 -->
          <div class="scene-strip">
            <div class="scene-chip">
              <span class="scene-dot" :class="strategyHome.rewardedEnabled ? 'scene-dot--on' : 'scene-dot--off'"></span>
              <span>A 首页场景</span>
              <span class="scene-state">{{ strategyHome.rewardedEnabled ? '已启用' : '已停用' }}</span>
            </div>
            <div class="scene-chip">
              <span class="scene-dot" :class="form.forceOnDramaPage === 1 ? 'scene-dot--on' : 'scene-dot--off'"></span>
              <span>B 短剧页</span>
              <span class="scene-state">{{ form.forceOnDramaPage === 1 ? '已启用' : '已停用' }}</span>
            </div>
            <div class="scene-chip">
              <span class="scene-dot scene-dot--cfg"></span>
              <span>C 结果处理</span>
              <span class="scene-state">中断{{ strategyResult.interruptAction === 'stop' ? '停弹' : '续弹' }} · 重试{{ strategyResult.retryEnabled ? '开' : '关' }}</span>
            </div>
            <div class="scene-chip">
              <span class="scene-dot scene-dot--cfg"></span>
              <span>D 计算时间</span>
              <span class="scene-state">切后台 激励{{ strategyTiming.rewardedOnHide === 'pause' ? '暂停' : '清空' }} · 插屏{{ strategyTiming.interstitialOnHide === 'pause' ? '暂停' : '清空' }}</span>
            </div>
          </div>

          <div class="scene-body">
            <!-- 左侧场景导航 -->
            <div class="scene-nav">
              <div
                v-for="s in sceneNavItems"
                :key="s.key"
                class="scene-nav-item"
                :class="{ 'scene-nav-item--active': activeScene === s.key }"
                @click="activeScene = s.key"
              >
                <span class="scene-key">{{ s.key }}</span>
                <span class="scene-nav-name">{{ s.name }}</span>
              </div>
            </div>

            <!-- 右侧当前场景配置 -->
            <div class="scene-panel">
              <!-- A 首页场景 -->
              <template v-if="activeScene === 'A'">
                <div class="scene-panel-head">
                  <div>
                    <div class="scene-panel-title">A 首页场景：登录后首页的激励强弹与插屏</div>
                    <div class="scene-panel-sub">总开关关闭后首页不会触发任何强弹</div>
                  </div>
                  <a-switch v-model="strategyHome.rewardedEnabled" checked-text="启用" unchecked-text="停用" />
                </div>
                <template v-if="strategyHome.rewardedEnabled">
                  <div class="group-label">激励视频强弹</div>
                  <a-row :gutter="16">
                    <a-col :span="6">
                      <a-form-item label="首次弹出时间（秒）" extra="进首页后多久弹第一次激励广告">
                        <a-input-number v-model="form.rewardedTimeoutSec" :min="0" :max="3600" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="间隔多久再弹（秒）" extra="两次激励强弹之间间隔多久">
                        <a-input-number v-model="form.rewardedIntervalSec" :min="1" :max="86400" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="预加载广告素材" extra="提前加载广告，弹出更快；关闭则弹出时才加载">
                        <a-switch v-model="strategyHome.rewardPreloadEnabled" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="广告首次预加载时间（秒）" extra="进入首页后等几秒再预加载，避开开场广告">
                        <a-input-number v-model="strategyHome.rewardPreloadDelaySec" :min="0" :max="3600" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <a-row :gutter="16">
                    <a-col :span="6">
                      <a-form-item label="切换页面时重置强弹次数" extra="打开=每次换页面次数清零重新累计；关闭=全天累计">
                        <a-switch v-model="strategyHome.resetOnRouteChange" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <div class="group-label">插屏广告</div>
                  <a-row :gutter="16">
                    <a-col :span="6">
                      <a-form-item label="首页插屏是否弹出" extra="关闭后首页不再自动弹插屏">
                        <a-switch v-model="strategyHome.interstitialEnabled" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="弹出范围" extra="强弹规则只对广告链接进入的用户生效，普通用户走原有正常广告逻辑">
                        <a-input :model-value="'仅广告链接进入的用户'" readonly />
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="首次弹出时间（秒）" extra="广告链接用户进首页后多久弹第一次">
                        <a-input-number v-model="strategyHome.firstDelaySec" :min="0" :max="3600" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="间隔多久再弹（秒）" extra="两次插屏之间间隔多久">
                        <a-input-number v-model="strategyHome.periodSec" :min="1" :max="86400" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <div class="group-label">强弹次数上限</div>
                  <a-row :gutter="16">
                    <a-col :span="6">
                      <a-form-item label="强弹次数上限" extra="0=不限次数；达到上限后不再强弹">
                        <a-input-number v-model="form.maxForceCount" :min="0" :max="9999" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="重置时间（小时）" extra="0=永不重置；达到该时间后次数清零重新累计">
                        <a-input-number v-model="form.resetIntervalHours" :min="0" :max="720" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                </template>
                <div v-else class="scene-off">该场景已停用：首页不会触发激励强弹与插屏。打开右上角开关即可启用。</div>
              </template>

              <!-- B 短剧页场景 -->
              <template v-else-if="activeScene === 'B'">
                <div class="scene-panel-head">
                  <div>
                    <div class="scene-panel-title">B 短剧页场景：看短剧时的强弹节奏与解锁倒计时</div>
                    <div class="scene-panel-sub">总开关关闭后短剧页不会触发任何强弹</div>
                  </div>
                  <a-switch
                    v-model="form.forceOnDramaPage"
                    :checked-value="1"
                    :unchecked-value="0"
                    checked-text="启用"
                    unchecked-text="停用"
                  />
                </div>
                <template v-if="form.forceOnDramaPage === 1">
                <a-row :gutter="16">
                  <a-col :span="6">
                    <a-form-item label="每隔多久再弹一次（秒）" extra="0=看剧期间只弹一次；填数字则按间隔循环弹">
                      <a-input-number v-model="strategyDrama.dramaForceIntervalSec" :min="0" :max="86400" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item label="强弹次数上限" extra="0=不限次数；达到上限后短剧页不再强弹">
                      <a-input-number v-model="form.dramaMaxForceCount" :min="0" :max="9999" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item label="重置时间（小时）" extra="0=永不重置；与首页次数上限相互独立">
                      <a-input-number v-model="strategyDrama.dramaResetHours" :min="0" :max="720" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item label="解锁倒计时时长（秒）" extra="0=跟随激励首次延迟；倒计时结束自动弹广告，无需用户手动点解锁">
                      <a-input-number v-model="strategyDrama.unlockCountdownSec" :min="0" :max="3600" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <div class="scene-off">广告完整看完后固定刷新当前页面；中途关掉后固定按上面的间隔继续弹（代码内置，不可配置）。</div>
                </template>
                <div v-else class="scene-off">该场景已停用：短剧页不会触发强弹与解锁倒计时广告。打开右上角开关即可启用。</div>
              </template>

              <!-- C 广告结果处理 -->
              <template v-else-if="activeScene === 'C'">
                <div class="scene-panel-head">
                  <div>
                    <div class="scene-panel-title">C 广告结果处理：看完 / 中途关掉 / 播放失败后怎么办</div>
                    <div class="scene-panel-sub">三类结果各自独立配置，互不影响</div>
                  </div>
                </div>
                <div class="group-label">广告没看完就关掉</div>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="处理方式" extra="自动继续弹=稍后自动补弹；本轮不再弹=不再打扰">
                      <a-select v-model="strategyResult.interruptAction">
                        <a-option value="auto_repull">自动继续弹</a-option>
                        <a-option value="stop">本轮不再弹</a-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="再弹前等多久（秒）" extra="0=跟随激励循环间隔；填数字则按该延迟再弹">
                      <a-input-number v-model="strategyResult.interruptRepullDelaySec" :min="0" :max="86400" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <div class="group-label">广告播放失败（加载出错）</div>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="失败后自动重试" extra="关闭后失败即停，等下一个正常周期">
                      <a-switch v-model="strategyResult.retryEnabled" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="一轮最多重试几次" extra="超过该次数后停止，防止无限重试">
                      <a-input-number v-model="strategyResult.maxRetryCount" :min="1" :max="50" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="重试次数用完后" extra="等下一周期=下个正常节拍再试；全部停止=本轮彻底停">
                      <a-select v-model="strategyResult.afterRetryExhausted">
                        <a-option value="wait_next_cycle">等下一个周期</a-option>
                        <a-option value="stop_all">全部停止</a-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                </a-row>
                <div class="scene-off">重试等待时间已内置在客户端（SDK报错 500 毫秒 / 弹出失败 5 秒 / 程序异常 1 秒），不再单独配置。</div>
              </template>

              <!-- D 计算时间配置 -->
              <template v-else>
                <div class="scene-panel-head">
                  <div>
                    <div class="scene-panel-title">D 计算时间配置：切后台 / 回前台 / 广告卡住时，激励与插屏各自怎么处理</div>
                    <div class="scene-panel-sub">激励与插屏独立计时互不抢占，谁先到时间就先弹谁</div>
                  </div>
                </div>
                <div class="group-label">激励广告</div>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="用户回到小程序后" extra="用户切走再回来时，激励强弹计时怎么处理">
                      <a-select v-model="strategyTiming.rewardedOnShow">
                        <a-option value="continue">接着原来的时间算</a-option>
                        <a-option value="restart_delay">重新从头计时</a-option>
                        <a-option value="immediate">马上弹一次广告</a-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="用户切走（进后台）时" extra="暂停=回来后继续；清空=回来后重新开始">
                      <a-select v-model="strategyTiming.rewardedOnHide">
                        <a-option value="pause">暂停弹出</a-option>
                        <a-option value="destroy">清空全部强弹任务</a-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="广告卡住时自动恢复（秒）" extra="激励广告状态异常卡死超过该时间后自动恢复">
                      <a-input-number v-model="strategyTiming.rewardedStuckResetSec" :min="30" :max="3600" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="上限次数" extra="0=不限次数；与首页场景的次数上限独立计数互不冲突，重置周期跟随首页重置时间">
                      <a-input-number v-model="strategyTiming.rewardedMaxForceCount" :min="0" :max="9999" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="全局触发计时器（秒）" extra="0=关闭；时间一到强制触发一次激励弹出，已有广告展示时跳过本次">
                      <a-input-number v-model="strategyTiming.rewardedGlobalTriggerSec" :min="0" :max="86400" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <div class="group-label">插屏广告</div>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="用户回到小程序后" extra="用户切走再回来时，插屏计时怎么处理">
                      <a-select v-model="strategyTiming.interstitialOnShow">
                        <a-option value="continue">接着原来的时间算</a-option>
                        <a-option value="restart_delay">重新从头计时</a-option>
                        <a-option value="immediate">马上弹一次广告</a-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="用户切走（进后台）时" extra="暂停=回来后继续；清空=回来后重新开始">
                      <a-select v-model="strategyTiming.interstitialOnHide">
                        <a-option value="pause">暂停弹出</a-option>
                        <a-option value="destroy">清空全部强弹任务</a-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="广告卡住时自动恢复（秒）" extra="插屏状态异常卡死超过该时间后自动恢复">
                      <a-input-number v-model="strategyTiming.interstitialStuckResetSec" :min="30" :max="3600" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="上限次数" extra="0=不限次数；与首页场景的次数上限独立计数互不冲突，重置周期跟随首页重置时间">
                      <a-input-number v-model="strategyTiming.interstitialMaxForceCount" :min="0" :max="9999" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="全局触发计时器（秒）" extra="0=关闭；时间一到强制触发一次插屏弹出，已有广告展示时跳过本次">
                      <a-input-number v-model="strategyTiming.interstitialGlobalTriggerSec" :min="0" :max="86400" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </template>
            </div>
          </div>
        </section>

        <!-- ③ 绑定应用 -->
        <section class="block-card">
          <div class="block-head">
            <span class="block-badge">③</span>
            <span class="block-title">绑定应用</span>
            <span class="block-tip">未绑定的应用自动使用全局兜底规则；一个应用只能绑一条规则</span>
          </div>
          <a-form-item field="clientKeys" label="选择应用" hide-asterisk>
            <a-select
              v-model="form.clientKeys"
              multiple
              allow-clear
              placeholder="选择要绑定的应用"
              :options="appOptions"
              :loading="appLoading"
            />
          </a-form-item>
        </section>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdForceRule' })
import { ref, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  fetchForceAdRuleList,
  createForceAdRule,
  updateForceAdRule,
  deleteForceAdRule,
  enableForceAdRule,
  disableForceAdRule,
  bindForceAdRuleApps,
} from '@/api/ad.ts'
import { fetchAppListAll } from '@/api/app.ts'
import type { ForceAdRule } from '@/types/drama.ts'
import type { App } from '@/types/app.ts'
import ResizableTable from '@/components/ResizableTable/index.vue'
import {
  DEFAULT_HOME,
  DEFAULT_DRAMA,
  DEFAULT_RESULT,
  DEFAULT_TIMING,
  parseStrategyForms,
  buildStrategyJson,
  type HomeForm,
  type DramaForm,
  type ResultForm,
  type TimingForm,
} from './force-strategy/types.ts'

const loading = ref(false)
const submitting = ref(false)
const togglingId = ref<string | null>(null)
const formVisible = ref(false)
const editingRule = ref<ForceAdRule | null>(null)
const formRef = ref()
const ruleList = ref<ForceAdRule[]>([])
const appList = ref<App[]>([])
const appLoading = ref(false)

const form = ref({
  ruleName: '',
  rewardedTimeoutSec: 60,
  rewardedIntervalSec: 300,
  interstitialTimeoutSec: 15,
  interstitialIntervalSec: 180,
  // 播放页解锁固定激励，不再支持配置切换，提交时固定为 rewarded。
  adPattern: 'rewarded',
  maxForceCount: 0,
  resetIntervalHours: 0,
  forceOnDramaPage: 0,
  dramaMaxForceCount: 0,
  dramaForceDelaySec: 0,
  clientKeys: [] as string[],
})

// ─── 细粒度策略表单（A 首页 / B 短剧页 / C 广告结果 / D 计算时间配置），默认值与现网行为一致 ───
const strategyHome = ref<HomeForm>({ ...DEFAULT_HOME })
const strategyDrama = ref<DramaForm>({ ...DEFAULT_DRAMA })
const strategyResult = ref<ResultForm>({ ...DEFAULT_RESULT })
const strategyTiming = ref<TimingForm>({ ...DEFAULT_TIMING })

// 场景导航：当前选中的策略场景。
const activeScene = ref<'A' | 'B' | 'C' | 'D'>('A')
const sceneNavItems = [
  { key: 'A' as const, name: '首页场景' },
  { key: 'B' as const, name: '短剧页场景' },
  { key: 'C' as const, name: '广告结果处理' },
  { key: 'D' as const, name: '计算时间配置' },
]

const formRules = {
  ruleName: [{ required: true, message: '请输入规则名称' }],
  rewardedTimeoutSec: [{ required: true, message: '请输入激励视频首次延迟' }],
  rewardedIntervalSec: [{ required: true, message: '请输入激励视频循环间隔' }],
  interstitialTimeoutSec: [{ required: true, message: '请输入插屏首次延迟' }],
  interstitialIntervalSec: [{ required: true, message: '请输入插屏循环间隔' }],
}

const columns = ref([
  { title: '规则名称', slotName: 'ruleName', width: 200, resizable: true, minWidth: 140 },
  { title: '激励视频节奏', slotName: 'rewarded', width: 190, resizable: true, minWidth: 150 },
  { title: '插屏广告节奏', slotName: 'interstitial', width: 190, resizable: true, minWidth: 150 },
  { title: '次数上限/重置', slotName: 'forceLimit', width: 160, resizable: true, minWidth: 130 },
  { title: '短剧页强弹', slotName: 'dramaForce', width: 100, resizable: true, minWidth: 80 },
  { title: '绑定应用', slotName: 'boundApps', width: 240, resizable: true, minWidth: 170 },
  { title: '状态', slotName: 'status', width: 100, resizable: true, minWidth: 80 },
  { title: '操作', slotName: 'operations', width: 140, resizable: true, minWidth: 120 },
])

const appOptions = ref<{ label: string; value: string }[]>([])

// 顶部概览统计
const stat = computed(() => ({
  total: ruleList.value.length,
  enabled: ruleList.value.filter((r) => r.status === 1).length,
  fallback: ruleList.value.filter((r) => r.isDefault === 1).length,
  boundApps: ruleList.value.reduce((sum, r) => sum + (r.clientKeys?.length ?? 0), 0),
}))

function toSeconds(ms?: number) {
  return ms != null ? Math.round(ms / 1000) : '—'
}

function appNameOf(clientKey: string) {
  return appList.value.find((a) => a.clientKey === clientKey)?.appName ?? clientKey
}

async function fetchList() {
  loading.value = true
  try {
    const data = await fetchForceAdRuleList()
    ruleList.value = Array.isArray(data) ? data : []
  } catch {
    ruleList.value = []
  } finally {
    loading.value = false
  }
}

async function fetchApps() {
  appLoading.value = true
  try {
    const data = await fetchAppListAll()
    appList.value = Array.isArray(data) ? data : []
    appOptions.value = appList.value.map((a) => ({
      label: `${a.appName}（${a.clientKey}）`,
      value: a.clientKey,
    }))
  } catch {
    appList.value = []
    appOptions.value = []
  } finally {
    appLoading.value = false
  }
}

function openForm(rule?: ForceAdRule) {
  editingRule.value = rule ?? null
  // 策略表单：解析该规则已保存的配置；未配置/损坏时回落默认值（与现网行为一致）。
  const parsed = parseStrategyForms(rule?.strategyConfig)
  strategyHome.value = parsed.home
  strategyDrama.value = parsed.drama
  strategyResult.value = parsed.result
  strategyTiming.value = parsed.timing
  activeScene.value = 'A'

  if (rule) {
    form.value = {
      ruleName: rule.ruleName,
      rewardedTimeoutSec: toSeconds(rule.showRewardedVideoAdTimeout) as number,
      rewardedIntervalSec: toSeconds(rule.showRewardedVideoAdInterval) as number,
      interstitialTimeoutSec: toSeconds(rule.showInterstitialAdTimeout) as number,
      interstitialIntervalSec: toSeconds(rule.showInterstitialAdInterval) as number,
      adPattern: 'rewarded',
      maxForceCount: rule.maxForceCount ?? 0,
      resetIntervalHours: rule.resetIntervalHours ?? 0,
      forceOnDramaPage: rule.forceOnDramaPage ?? 0,
      dramaMaxForceCount: rule.dramaMaxForceCount ?? 0,
      dramaForceDelaySec: toSeconds(rule.dramaForceDelay ?? 0) as number,
      clientKeys: [...(rule.clientKeys ?? [])],
    }
  } else {
    form.value = {
      ruleName: '',
      rewardedTimeoutSec: 60,
      rewardedIntervalSec: 300,
      interstitialTimeoutSec: 15,
      interstitialIntervalSec: 180,
      adPattern: 'rewarded',
      maxForceCount: 0,
      resetIntervalHours: 0,
      forceOnDramaPage: 0,
      dramaMaxForceCount: 0,
      dramaForceDelaySec: 0,
      clientKeys: [],
    }
  }
  formVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  editingRule.value = null
}

async function handleSave() {
  const errors = await formRef.value.validate()
  if (errors) return

  submitting.value = true
  try {
    const payload: Partial<ForceAdRule> = {
      ruleName: form.value.ruleName,
      showRewardedVideoAdTimeout: form.value.rewardedTimeoutSec * 1000,
      showRewardedVideoAdInterval: form.value.rewardedIntervalSec * 1000,
      showInterstitialAdTimeout: form.value.interstitialTimeoutSec * 1000,
      showInterstitialAdInterval: form.value.interstitialIntervalSec * 1000,
      // 累计成功阈值已不在界面配置：编辑时保留原值，新增时回落默认值。
      adSuccessCount: editingRule.value?.adSuccessCount ?? 100,
      adPattern: form.value.adPattern,
      maxForceCount: form.value.maxForceCount ?? 0,
      resetIntervalHours: form.value.resetIntervalHours ?? 0,
      forceOnDramaPage: form.value.forceOnDramaPage ?? 0,
      dramaMaxForceCount: form.value.dramaMaxForceCount ?? 0,
      dramaForceDelay: (form.value.dramaForceDelaySec ?? 0) * 1000,
      // 策略随规则整体保存：四组全量写入（默认值=现网行为），策略天然与规则绑定。
      strategyConfig: buildStrategyJson(strategyHome.value, strategyDrama.value, strategyResult.value, strategyTiming.value),
    }

    let ruleId: string
    if (editingRule.value) {
      ruleId = editingRule.value.id
      await updateForceAdRule(ruleId, payload)
    } else {
      ruleId = await createForceAdRule(payload)
    }
    // 全量覆盖绑定关系（空列表表示清空）
    await bindForceAdRuleApps(ruleId, form.value.clientKeys)
    Message.success(editingRule.value ? '规则更新成功' : '规则创建成功')
    formVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

async function handleToggleStatus(rule: ForceAdRule, active: boolean) {
  togglingId.value = rule.id
  try {
    if (active) {
      await enableForceAdRule(rule.id)
    } else {
      await disableForceAdRule(rule.id)
    }
    rule.status = active ? 1 : 0
    Message.success(`规则已${active ? '启用' : '禁用'}`)
  } catch {
    // 错误由拦截器处理
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(rule: ForceAdRule) {
  try {
    await deleteForceAdRule(rule.id)
    Message.success('规则已删除')
    fetchList()
  } catch {
    // 错误由拦截器处理
  }
}

onMounted(() => {
  fetchList()
  fetchApps()
})
</script>

<style scoped>
.far-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 页头 ── */
.far-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.far-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
}
.far-title-tag {
  transform: translateY(1px);
}
.far-subtitle {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  margin-top: 4px;
}
.far-add-btn {
  border-radius: 8px;
  background: linear-gradient(135deg, #4c9de4 0%, #c9465d 100%);
  border: none;
}
.far-add-btn:hover {
  opacity: 0.9;
}

/* ── 概览统计 ── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--mc-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.42));
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 18px;
}
.stat-icon--total {
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.12);
}
.stat-icon--on {
  color: #23c343;
  background: rgba(35, 195, 67, 0.12);
}
.stat-icon--default {
  color: #ff7d00;
  background: rgba(255, 125, 0, 0.12);
}
.stat-icon--app {
  color: #93A6F0;
  background: rgba(155, 126, 196, 0.12);
}
.stat-num {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--mc-text-primary);
}
.stat-label {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

/* ── 表格卡片 ── */
.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}
.rule-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rule-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.rule-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--mc-text-primary);
}
.rule-id {
  font-size: 11px;
  color: var(--mc-text-tertiary);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.param-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--mc-text-primary);
}
.param-cell strong {
  color: var(--mc-primary);
  font-weight: 600;
}
.param-sub {
  font-size: 11px;
  color: var(--mc-text-tertiary);
}
.bound-apps {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.unbound-text {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}
.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── 弹窗分区卡片 ── */
.block-card {
  background: var(--mc-bg-page, rgba(76, 157, 228, 0.04));
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  padding: 14px 16px 4px;
  margin-bottom: 14px;
}
.block-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.block-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: linear-gradient(135deg, #F2748A 0%, #c9465d 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.block-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--mc-text-primary);
}
.block-tip {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}
.group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--mc-text-secondary);
  margin: 10px 0 8px;
  padding-left: 8px;
  border-left: 3px solid var(--mc-primary);
}

/* ── 策略场景导航布局 ── */
.scene-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.scene-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--mc-text-primary);
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: 8px;
}
.scene-state {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: var(--mc-text-tertiary);
}
.scene-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.scene-dot--on {
  background: #23c343;
  box-shadow: 0 0 6px rgba(35, 195, 67, 0.6);
}
.scene-dot--off {
  background: #86909c;
}
.scene-dot--cfg {
  background: #4c9de4;
  box-shadow: 0 0 6px rgba(76, 157, 228, 0.5);
}

.scene-body {
  display: flex;
  gap: 12px;
}
.scene-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 150px;
  flex-shrink: 0;
}
.scene-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--mc-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.scene-nav-item:hover {
  background: var(--mc-bg-card);
}
.scene-nav-item--active {
  color: var(--mc-text-primary);
  font-weight: 600;
  background: var(--mc-bg-card);
  border-color: var(--mc-primary);
  box-shadow: var(--mc-shadow-xs);
}
.scene-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background: rgba(76, 157, 228, 0.15);
  color: var(--mc-primary);
  font-size: 11px;
  font-weight: 700;
}
.scene-nav-item--active .scene-key {
  background: var(--mc-primary);
  color: #fff;
}
.scene-panel {
  flex: 1;
  min-width: 0;
  padding: 12px 16px 4px;
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: 8px;
}
.scene-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 4px;
  border-bottom: 1px dashed var(--mc-border);
}
.scene-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--mc-text-primary);
}
.scene-panel-sub {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  margin-top: 2px;
}
.scene-off {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  padding: 10px 0;
}
</style>
