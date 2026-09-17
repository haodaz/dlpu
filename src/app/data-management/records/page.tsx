'use client';
import React, { useState, useMemo, Suspense } from 'react';
import { Select, Input, Tag, Tooltip, Drawer, Descriptions } from 'antd';
import {
  SwapOutlined,
  SearchOutlined,
  DownOutlined,
  FileTextOutlined,
  RobotOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  HistoryOutlined,
  GlobalOutlined,
  PlusOutlined,
  ExportOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getAllDataRecords,
  getDataRecordById,
  actionConfig,
  statusConfig,
  materialCategories,
  type DataRecord,
  type ActionType,
  type RecordStatus,
} from '@/lib/data-management';
import { indicators } from '@/lib/indicators';

type StatusFilter = 'all' | RecordStatus;
type ActionFilter = 'all' | ActionType;

function RecordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<DataRecord | null>(null);

  const allRecords = useMemo(() => getAllDataRecords(), []);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (actionFilter !== 'all' && r.action !== actionFilter) return false;
      if (catFilter !== 'all' && r.category !== catFilter) return false;
      // 时间筛选
      if (timeFilter !== 'all') {
        const days = parseInt(timeFilter);
        const cutoff = new Date('2026-09-15T10:00:00').getTime() - days * 86400000;
        const t = new Date(r.timestamp).getTime();
        if (t < cutoff) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!r.materialName.toLowerCase().includes(q) && !r.summary.toLowerCase().includes(q) && !r.relatedIndicators.join(' ').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allRecords, search, statusFilter, actionFilter, catFilter, timeFilter]);

  // 统计
  const stats = useMemo(() => {
    return {
      total: allRecords.length,
      completed: allRecords.filter((r) => r.status === 'completed').length,
      pending: allRecords.filter((r) => r.status === 'pending').length,
      failed: allRecords.filter((r) => r.status === 'failed').length,
      aiPrefill: allRecords.filter((r) => r.action === 'ai-prefill').length,
      upload: allRecords.filter((r) => r.action === 'upload').length,
      modify: allRecords.filter((r) => r.action === 'modify').length,
      confirm: allRecords.filter((r) => r.action === 'confirm').length,
      supplement: allRecords.filter((r) => r.action === 'supplement').length,
    };
  }, [allRecords]);

  // 导出记录（mock）
  const handleExport = () => {
    showToast(`已导出 ${filtered.length} 条提交记录为 CSV（mock）`, 'success');
  };

  // 轻提示
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  };

  const openDetail = (id: string) => {
    const r = getDataRecordById(id);
    if (r) {
      setActiveRecord(r);
      setDrawerOpen(true);
      router.replace('/data-management/records');
    }
  };

  // 预生成某个材料的历史版本
  const versionsOf = (record: DataRecord) => {
    const sameMaterial = allRecords.filter((r) => r.materialCode === record.materialCode && r.materialName === record.materialName && r.id !== record.id);
    return [record, ...sameMaterial].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((r, i) => ({
      version: sameMaterial.length + 1 - i,
      timestamp: r.timestamp,
      action: r.action,
      summary: r.summary,
      changes: r.changes,
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      {/* ===== 顶部 ===== */}
      <div className="px-8 py-8 shrink-0 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-sm">
            <SwapOutlined />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">提交记录</h1>
            <p className="text-sm text-slate-500 m-0 mt-1">记录每次填报的提交动作 — 确认、修改、补充的完整提交流水。</p>
          </div>
        </div>

        {/* 提示条 */}
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm">
          <InfoCircleOutlined className="text-amber-600" />
          <span className="text-amber-700">这里记录的是<strong>提交流水</strong>，最终确认成果请查看
            <button onClick={() => router.push('/filling-results/by-indicator')} className="text-blue-600 hover:underline font-bold mx-1">【填报成果】</button>
          </span>
        </div>

        {/* 概览卡 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <MiniStat icon={<FileTextOutlined />} label="总提交" value={stats.total} color="#1677ff" />
          <MiniStat icon={<CheckCircleOutlined />} label="确认" value={stats.confirm} color="#059669" />
          <MiniStat icon={<EditOutlined />} label="修改" value={stats.modify} color="#1677ff" />
          <MiniStat icon={<PlusOutlined />} label="补充" value={stats.supplement} color="#9333ea" />
          <MiniStat icon={<SwapOutlined />} label="待处理/失败" value={stats.pending + stats.failed} color="#d97706" />
        </div>
      </div>

      {/* ===== 筛选栏 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="搜索材料/摘要/指标"
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="flex-1 min-w-[200px] max-w-xs"
            />
            <Select
              value={actionFilter}
              onChange={(v) => setActionFilter(v)}
              className="w-28"
              options={[
                { value: 'all', label: '全部动作' },
                { value: 'confirm', label: '确认' },
                { value: 'modify', label: '修改' },
                { value: 'supplement', label: '补充' },
                { value: 'upload', label: '上传' },
                { value: 'ai-prefill', label: 'AI 预填' },
                { value: 'revoke', label: '撤回' },
              ]}
            />
            <Select
              value={timeFilter}
              onChange={(v) => setTimeFilter(v)}
              className="w-32"
              options={[
                { value: 'all', label: '全部时间' },
                { value: '1', label: '近 1 天' },
                { value: '7', label: '近 7 天' },
                { value: '30', label: '近 30 天' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              className="w-28"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'completed', label: '已完成' },
                { value: 'pending', label: '进行中' },
                { value: 'failed', label: '失败' },
                { value: 'revoked', label: '已撤回' },
              ]}
            />
            <Select
              value={catFilter}
              onChange={(v) => setCatFilter(v)}
              className="w-36"
              options={[
                { value: 'all', label: '全部材料类型' },
                ...materialCategories.map((c) => ({ value: c.key, label: c.name })),
              ]}
            />
            <button
              onClick={handleExport}
              className="ml-auto flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors"
            >
              <ExportOutlined /> 导出记录
            </button>
            <span className="text-sm text-slate-400">共 {filtered.length} 条</span>
          </div>
        </div>
      </div>

      {/* ===== 列表 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-12">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-[180px_100px_80px_80px_1fr_160px_80px] gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
            <span>时间</span>
            <span>材料</span>
            <span>动作</span>
            <span>状态</span>
            <span>内容摘要</span>
            <span>关联指标</span>
            <span className="text-center">操作</span>
          </div>
          {/* 行 */}
          <div className="divide-y divide-slate-50">
            {filtered.map((r) => {
              const act = actionConfig[r.action];
              const st = statusConfig[r.status];
              const cat = materialCategories.find((c) => c.key === r.category);
              return (
                <div key={r.id} className="grid grid-cols-[180px_100px_80px_80px_1fr_160px_80px] gap-2 px-5 py-3 hover:bg-slate-50 transition-colors text-sm items-center">
                  {/* 时间 */}
                  <span className="text-xs text-slate-500 font-mono">{r.timestamp}</span>
                  {/* 材料 */}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{r.materialName}</div>
                    {r.materialCode && <span className="text-[10px] font-mono text-slate-400">{r.materialCode}</span>}
                  </div>
                  {/* 动作 */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-center" style={{ color: act.color, backgroundColor: act.bg }}>
                    {act.label}
                  </span>
                  {/* 状态 */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-center" style={{ color: st.color, backgroundColor: st.bg }}>
                    {st.label}
                  </span>
                  {/* 摘要 + Payload */}
                  <div className="min-w-0">
                    <div className="text-slate-700 truncate">{r.summary}</div>
                    <Tooltip title={r.payloadSummary}>
                      <code className="text-[10px] text-slate-400 font-mono truncate block cursor-help">{r.payloadSummary}</code>
                    </Tooltip>
                  </div>
                  {/* 关联指标 */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {r.relatedIndicators.slice(0, 2).map((iid) => (
                      <Tag key={iid} className="m-0 text-[10px] px-1.5 py-0 leading-4">{iid}</Tag>
                    ))}
                    {r.relatedIndicators.length > 2 && <span className="text-xs text-slate-400">+{r.relatedIndicators.length - 2}</span>}
                  </div>
                  {/* 操作 */}
                  <button onClick={() => openDetail(r.id)} className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-0.5 justify-center">
                    详情 <EyeOutlined />
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-16 text-center text-slate-400 text-sm">暂无匹配的记录</div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 详情抽屉 ===== */}
      <Drawer
        title={activeRecord ? (
          <div>
            <div className="text-base font-bold text-slate-800">{activeRecord.materialName}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {activeRecord.timestamp} · {actionConfig[activeRecord.action].label} · {statusConfig[activeRecord.status].label}
            </div>
          </div>
        ) : ''}
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={activeRecord && (
          <div className="flex items-center gap-2">
            {activeRecord.status === 'completed' && (
              <>
                <Tooltip title="撤回">
                  <button className="text-amber-600 hover:bg-amber-50 p-1.5 rounded"><UndoOutlined /></button>
                </Tooltip>
                <Tooltip title="重新提交">
                  <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><RedoOutlined /></button>
                </Tooltip>
              </>
            )}
            <Tooltip title="历史版本">
              <button className="text-slate-600 hover:bg-slate-100 p-1.5 rounded"><HistoryOutlined /></button>
            </Tooltip>
          </div>
        )}
      >
        {activeRecord && (
          <div className="space-y-5">
            {/* 基本信息 */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-2">基本信息</h3>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="材料名称">{activeRecord.materialName}</Descriptions.Item>
                {activeRecord.materialCode && <Descriptions.Item label="模板编号">{activeRecord.materialCode}</Descriptions.Item>}
                <Descriptions.Item label="数据来源">
                  <span className="text-xs" style={{ color: actionConfig[activeRecord.action].color }}>
                    {actionConfig[activeRecord.action].label}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="操作人">{activeRecord.operator}</Descriptions.Item>
                <Descriptions.Item label="发生时间">{activeRecord.timestamp}</Descriptions.Item>
                <Descriptions.Item label="关联指标">
                  <div className="flex items-center gap-1 flex-wrap">
                    {activeRecord.relatedIndicators.map((iid) => {
                      const ind = indicators.find((x) => x.id === iid);
                      return (
                        <Tag key={iid} className="m-0 text-[10px] px-1.5 py-0 leading-4">
                          {iid} {ind?.name || ''}
                        </Tag>
                      );
                    })}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Payload 探针">
                  <code className="text-[10px] text-slate-600 font-mono bg-slate-100 rounded px-2 py-1 block break-all">{activeRecord.payloadSummary}</code>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* 内容摘要 */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-2">内容摘要</h3>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-slate-700">{activeRecord.summary}</div>
            </div>

            {/* 修改差异 */}
            {activeRecord.changes && activeRecord.changes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-2">修改差异</h3>
                <div className="space-y-2">
                  {activeRecord.changes.map((c, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">{c.field}</div>
                      <div className="grid grid-cols-2 gap-0">
                        <div className="p-3 border-r border-slate-100">
                          <div className="text-[10px] text-slate-400 mb-1">修改前</div>
                          <div className="text-xs text-red-600 line-through">{c.before}</div>
                        </div>
                        <div className="p-3">
                          <div className="text-[10px] text-slate-400 mb-1">修改后</div>
                          <div className="text-xs text-green-600 font-bold">{c.after}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI 原文 vs 我的修改 */}
            {activeRecord.aiOriginal && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-2">AI 预填原文 vs 我的修改</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                    <div className="text-[10px] text-cyan-600 font-bold mb-1"><RobotOutlined /> AI 原文</div>
                    <div className="text-xs text-slate-700">{activeRecord.aiOriginal}</div>
                  </div>
                  {activeRecord.myModified && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-[10px] text-blue-600 font-bold mb-1"><EditOutlined /> 我的修改</div>
                      <div className="text-xs text-slate-700">{activeRecord.myModified}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 历史版本时间线 */}
            {(() => {
              const versions = versionsOf(activeRecord);
              if (versions.length < 2) return null;
              return (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1">
                    <HistoryOutlined /> 历史版本（{versions.length} 条）
                  </h3>
                  <div className="relative">
                    {versions.map((v, i) => {
                      const act = actionConfig[v.action];
                      const isCurrent = i === 0;
                      return (
                        <div key={i} className="flex gap-3 pb-3">
                          {/* 时间线点 */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-300' : ''}`}
                              style={{ backgroundColor: act.color }}
                            >
                              V{v.version}
                            </div>
                            {i < versions.length - 1 && <div className="w-0.5 flex-1 bg-slate-200" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold" style={{ color: act.color }}>{act.label}</span>
                              <span className="text-[10px] text-slate-400">{v.timestamp}</span>
                              {isCurrent && <span className="text-[10px] font-bold px-1.5 py-0 rounded bg-blue-100 text-blue-600">当前</span>}
                            </div>
                            <div className="text-xs text-slate-600">{v.summary}</div>
                            {v.changes && v.changes.length > 0 && (
                              <div className="mt-1 text-[10px] text-slate-400">
                                变更 {v.changes.length} 处字段
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Drawer>

      {/* ===== Toast 轻提示 ===== */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-[fadeIn_0.2s_ease-out]">
          <div
            className="px-5 py-3 rounded-lg shadow-lg text-sm font-bold flex items-center gap-2"
            style={{
              backgroundColor: toast.type === 'success' ? '#ecfdf5' : toast.type === 'warn' ? '#fffbeb' : '#eff6ff',
              color: toast.type === 'success' ? '#059669' : toast.type === 'warn' ? '#d97706' : '#1677ff',
              border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : toast.type === 'warn' ? '#fde68a' : '#bfdbfe'}`,
            }}
          >
            {toast.type === 'success' ? <CheckCircleOutlined /> : toast.type === 'warn' ? <InfoCircleOutlined /> : <InfoCircleOutlined />}
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataRecordsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50"><div className="text-slate-400">加载中…</div></div>}>
      <RecordsContent />
    </Suspense>
  );
}

// ---------- 迷你统计卡 ----------
function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm flex items-center gap-3">
      <div className="text-sm" style={{ color }}>{icon}</div>
      <div>
        <div className="text-[10px] text-slate-500">{label}</div>
        <div className="text-lg font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
