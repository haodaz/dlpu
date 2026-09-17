'use client';
import React, { useState, useMemo } from 'react';
import { Select, Input, Tag, Tooltip, Progress } from 'antd';
import {
  FormOutlined,
  SearchOutlined,
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  getAllUploadMaterials,
  getUploadMaterialsByCategory,
  getUploadStat,
  getUploadRecords,
  uploadCategories,
  type UploadMaterial,
  type UploadStatus,
} from '@/lib/my-uploads';
import { indicators } from '@/lib/indicators';

type TabKey = 'materials' | 'records';
type StatusFilter = 'all' | UploadStatus;
type CatFilter = string; // 'all' | MaterialCategoryKey

export default function MyUploadsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('materials');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // 让数据可响应操作
  const [version, setVersion] = useState(0);
  const stat = useMemo(() => getUploadStat(), [version]);
  const groups = useMemo(() => getUploadMaterialsByCategory(), [version]);
  const records = useMemo(() => getUploadRecords(), [version]);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAction = (action: string, materialId: string) => {
    const m = getAllUploadMaterials().find((x) => x.id === materialId);
    if (!m) return;
    if (action === 'upload') {
      setShowUploadModal(true);
      showToast(`准备上传：${m.name}`, 'info');
    } else if (action === 'view') {
      showToast(`查看：${m.name}（详情页开发中）`, 'info');
    } else if (action === 'edit') {
      showToast(`编辑：${m.name}（编辑页开发中）`, 'info');
    } else if (action === 'delete') {
      showToast(`已标记删除：${m.name}（mock，数据未实际删除）`, 'warn');
    }
  };

  // 材料筛选
  const filteredGroups = useMemo(() => {
    return groups.map((g) => ({
      ...g,
      items: g.items.filter((m) => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (catFilter !== 'all' && m.category !== catFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!m.name.toLowerCase().includes(q) && !m.sourceSystem.toLowerCase().includes(q) && !m.relatedIndicators.join(' ').toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    })).filter((g) => g.items.length > 0);
  }, [groups, search, statusFilter, catFilter]);

  // 上传记录筛选
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.materialName.toLowerCase().includes(q) && !r.fileName.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, search, statusFilter]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      {/* ===== 顶部 ===== */}
      <div className="px-8 py-8 shrink-0 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center text-white text-2xl shadow-sm">
            <FormOutlined />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">我的上传</h1>
            <p className="text-sm text-slate-500 m-0 mt-1">学校需上传的材料清单，系统自动映射到关联指标。</p>
          </div>
        </div>

        {/* 统计卡 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
          <StatCard icon={<AppstoreOutlined />} label="材料总数" value={stat.total} unit="种" color="#1677ff" bg="#eff6ff" />
          <StatCard icon={<CheckCircleOutlined />} label="已完成" value={stat.completed} unit="种" color="#059669" bg="#ecfdf5" />
          <StatCard icon={<CloudUploadOutlined />} label="已上传" value={stat.uploaded} unit="种" color="#7c3aed" bg="#f5f3ff" />
          <StatCard icon={<ExclamationCircleOutlined />} label="待上传" value={stat.pending} unit="种" color="#d97706" bg="#fffbeb" />
          <StatCard icon={<DatabaseOutlined />} label="覆盖指标" value={stat.coveredIndicators} unit="项" color="#0891b2" bg="#ecfeff" />
        </div>

        {/* 上传进度条 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-700">整体上传进度</span>
            <span className="text-xs text-slate-500">{stat.completed + stat.uploaded} / {stat.total} · 完成率 {stat.completionRate}%</span>
          </div>
          <Progress percent={stat.completionRate} strokeColor={{ '0%': '#059669', '100%': '#1677ff' }} className="m-0" />
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-slate-500">已完成 {stat.completed}</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-slate-500">已上传 {stat.uploaded}</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-slate-500">处理中 {stat.processing}</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-slate-500">待上传 {stat.pending}</span></span>
          </div>
        </div>

        {/* 上传入口按钮 */}
        <div className="mt-5 flex items-center gap-3">
          <button onClick={() => setShowUploadModal(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
            <UploadOutlined /> 上传新材料
          </button>
          <span className="text-xs text-slate-400">支持 Excel / Word / PDF / 签章文件</span>
        </div>
      </div>

      {/* ===== Tab 切换 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-4">
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm inline-flex">
          <TabButton active={tab === 'materials'} onClick={() => setTab('materials')} icon={<AppstoreOutlined />} label="材料清单" count={stat.total} />
          <TabButton active={tab === 'records'} onClick={() => setTab('records')} icon={<FileTextOutlined />} label="上传记录" count={records.length} />
        </div>
      </div>

      {/* ===== 筛选栏 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder={tab === 'materials' ? '搜索材料名称/来源/指标' : '搜索材料/文件名'}
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="flex-1 min-w-[200px] max-w-xs"
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              className="w-36"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'pending', label: '待上传' },
                { value: 'uploaded', label: '已上传' },
                { value: 'processing', label: '处理中' },
                { value: 'completed', label: '已完成' },
              ]}
            />
            {tab === 'materials' && (
              <Select
                value={catFilter}
                onChange={(v) => setCatFilter(v)}
                className="w-40"
                options={[{ value: 'all', label: '全部类型' }, ...uploadCategories.map((c) => ({ value: c.key, label: c.name }))]}
              />
            )}
            <span className="text-sm text-slate-400 ml-auto">
              共 {tab === 'materials' ? filteredGroups.reduce((s, g) => s + g.items.length, 0) : filteredRecords.length} 项
            </span>
          </div>
        </div>
      </div>

      {/* ===== 内容区 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-12">
        {tab === 'materials' ? (
          <MaterialsTab groups={filteredGroups} router={router} onAction={handleAction} />
        ) : (
          <RecordsTab records={filteredRecords} />
        )}
      </div>

      {/* ===== 上传弹窗 ===== */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}

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
            {toast.type === 'success' ? <CheckCircleOutlined /> : toast.type === 'warn' ? <ExclamationCircleOutlined /> : <InfoCircleOutlined />}
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Tab 按钮 ----------
function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${active ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      {icon} {label} <span className={`text-[10px] px-1.5 py-0 rounded-full ${active ? 'bg-white/20' : 'bg-slate-200'}`}>{count}</span>
    </button>
  );
}

// ---------- 统计卡 ----------
function StatCard({ icon, label, value, unit, color, bg }: { icon: React.ReactNode; label: string; value: number; unit: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: bg, color }}>{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-800">{value}</span>
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- 材料清单 Tab ----------
function MaterialsTab({ groups, router, onAction }: { groups: ReturnType<typeof getUploadMaterialsByCategory>; router: ReturnType<typeof useRouter>; onAction: (action: string, materialId: string) => void }) {
  if (groups.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400 text-sm">暂无匹配的材料</div>;
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const completed = g.items.filter((m) => m.status === 'completed').length;
        const uploaded = g.items.filter((m) => m.status === 'uploaded').length;
        const processing = g.items.filter((m) => m.status === 'processing').length;
        const pending = g.items.filter((m) => m.status === 'pending').length;
        return (
          <div key={g.category.key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ borderLeft: `4px solid ${g.category.color}` }}>
            {/* 分组标题 */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: g.category.bg, color: g.category.color, border: `1px solid ${g.category.border}` }}>
                  {g.category.name}
                </span>
                <span className="text-sm text-slate-500">（{g.items.length} 种）</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600 font-bold">已完成 {completed}</span>
                <span className="text-slate-300">/</span>
                <span className="text-purple-600 font-bold">已上传 {uploaded}</span>
                <span className="text-slate-300">/</span>
                <span className="text-blue-600 font-bold">处理中 {processing}</span>
                <span className="text-slate-300">/</span>
                <span className="text-amber-600 font-bold">待上传 {pending}</span>
              </div>
            </div>
            {/* 表头 */}
            <div className="grid grid-cols-[280px_1fr_100px_140px] items-center px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-400 text-center">
              <span>内容</span>
              <span>对应指标</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            {/* 材料行 */}
            <div className="divide-y divide-slate-50">
              {g.items.map((m) => (
                <MaterialRow key={m.id} material={m} onViewIndicator={(iid) => router.push(`/metrics/detail?id=${iid}`)} onAction={onAction} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- 材料行（grid 四列布局：内容 / 对应指标 / 状态 / 操作） ----------
function MaterialRow({ material, onViewIndicator, onAction }: { material: UploadMaterial; onViewIndicator: (iid: string) => void; onAction: (action: string, materialId: string) => void }) {
  const statusBadge = {
    pending: { text: '待上传', color: '#d97706', bg: '#fffbeb', icon: <ExclamationCircleOutlined /> },
    uploaded: { text: '已上传', color: '#7c3aed', bg: '#f5f3ff', icon: <CloudUploadOutlined /> },
    processing: { text: '处理中', color: '#1677ff', bg: '#eff6ff', icon: <LoadingOutlined /> },
    completed: { text: '已完成', color: '#059669', bg: '#ecfdf5', icon: <CheckCircleOutlined /> },
  }[material.status];

  return (
    <div className="grid grid-cols-[280px_1fr_100px_140px] items-center hover:bg-slate-50 transition-colors">
      {/* ===== 第 1 列：内容（编号 + 名称 + 格式 + 来源） ===== */}
      <div className="flex items-start gap-3 px-5 py-3.5 min-w-0 border-r border-slate-100">
        <span className="text-xs font-mono text-slate-400 w-8 shrink-0 pt-0.5">#{material.no}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800 truncate">{material.name}</span>
            <Tag className="m-0 text-[10px] px-1.5 py-0 leading-4 shrink-0">{material.format}</Tag>
            {material.notes && (
              <Tooltip title={material.notes}>
                <span className="text-[10px] text-slate-400 cursor-help">备注</span>
              </Tooltip>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">来源：{material.sourceSystem}</div>
        </div>
      </div>

      {/* ===== 第 2 列：对应指标 ===== */}
      <div className="flex items-center justify-center gap-1 flex-wrap px-3 py-3.5 border-r border-slate-100">
        {material.relatedIndicators.map((iid) => (
          <button key={iid} onClick={() => onViewIndicator(iid)} className="cursor-pointer">
            <Tag className="m-0 text-[10px] px-1.5 py-0 leading-4 hover:bg-blue-50">{iid}</Tag>
          </button>
        ))}
        {material.relatedIndicators.length === 0 && <span className="text-xs text-slate-300">—</span>}
      </div>

      {/* ===== 第 3 列：状态 ===== */}
      <div className="flex items-center justify-center px-3 py-3.5 border-r border-slate-100">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1" style={{ color: statusBadge.color, backgroundColor: statusBadge.bg }}>
          {statusBadge.icon} {statusBadge.text}
        </span>
      </div>

      {/* ===== 第 4 列：操作 ===== */}
      <div className="flex items-center justify-center px-3 py-3.5">
        {material.status === 'pending' ? (
          <button onClick={() => onAction('upload', material.id)} className="text-xs text-green-600 hover:text-green-700 font-bold px-3 py-1 rounded-lg hover:bg-green-50 flex items-center gap-1 border border-green-200 transition-colors whitespace-nowrap">
            <UploadOutlined /> 上传
          </button>
        ) : (
          <div className="flex items-center gap-0.5">
            <Tooltip title="查看">
              <button onClick={() => onAction('view', material.id)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"><EyeOutlined /></button>
            </Tooltip>
            <Tooltip title="编辑">
              <button onClick={() => onAction('edit', material.id)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"><EditOutlined /></button>
            </Tooltip>
            <Tooltip title="删除">
              <button onClick={() => onAction('delete', material.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"><DeleteOutlined /></button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- 上传记录 Tab ----------
function RecordsTab({ records }: { records: ReturnType<typeof getUploadRecords> }) {
  if (records.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400 text-sm">暂无上传记录</div>;
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 表头 */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
        <span className="flex-1">文件名</span>
        <span className="w-32">材料</span>
        <span className="w-24 text-center">映射指标</span>
        <span className="w-20 text-center">大小</span>
        <span className="w-32 text-center">上传时间</span>
        <span className="w-16 text-center">状态</span>
        <span className="w-20 text-center">操作</span>
      </div>
      {/* 行 */}
      <div className="divide-y divide-slate-50">
        {records.map((r) => {
          const statusBadge = {
            uploaded: { text: '已上传', color: '#7c3aed', bg: '#f5f3ff' },
            processing: { text: '处理中', color: '#1677ff', bg: '#eff6ff' },
            completed: { text: '已完成', color: '#059669', bg: '#ecfdf5' },
            pending: { text: '待上传', color: '#d97706', bg: '#fffbeb' },
          }[r.status];
          return (
            <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-sm">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <FileTextOutlined className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{r.fileName}</div>
                  <div className="text-xs text-slate-400">{r.fileType} · {r.fileSize}</div>
                </div>
              </div>
              <div className="w-32 text-xs text-slate-600 truncate">{r.materialName}</div>
              <div className="w-24 flex items-center gap-1 flex-wrap">
                {r.mappedIndicators.slice(0, 2).map((iid) => (
                  <Tag key={iid} className="m-0 text-[10px] px-1.5 py-0 leading-4">{iid}</Tag>
                ))}
                {r.mappedIndicators.length > 2 && <span className="text-xs text-slate-400">+{r.mappedIndicators.length - 2}</span>}
              </div>
              <div className="w-20 text-center text-xs text-slate-500">{r.fileSize}</div>
              <div className="w-32 text-center text-xs text-slate-500">
                {new Date(r.uploadedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="w-16 text-center">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: statusBadge.color, backgroundColor: statusBadge.bg }}>{statusBadge.text}</span>
              </div>
              <div className="w-20 text-center flex items-center justify-center gap-1">
                <button className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"><EyeOutlined /></button>
                <button className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><DeleteOutlined /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- 上传弹窗 ----------
function UploadModal({ onClose }: { onClose: () => void }) {
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const materials = getAllUploadMaterials();
  const filteredMaterials = selectedCat ? materials.filter((m) => m.category === selectedCat) : materials;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudUploadOutlined className="text-green-600 text-xl" />
            <h2 className="text-base font-bold text-slate-800 m-0">上传新材料</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Step 1: 选择材料类型 */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">① 选择材料类型</label>
            <Select
              value={selectedCat}
              onChange={(v) => { setSelectedCat(v); setSelectedMaterial(''); }}
              className="w-full"
              placeholder="请选择材料类型"
              options={uploadCategories.map((c) => ({ value: c.key, label: c.name }))}
            />
          </div>

          {/* Step 2: 选择具体材料 */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">② 选择具体材料</label>
            <Select
              value={selectedMaterial}
              onChange={setSelectedMaterial}
              className="w-full"
              placeholder="请选择材料"
              showSearch
              optionFilterProp="label"
              options={filteredMaterials.map((m) => ({
                value: m.id,
                label: `#${m.no} ${m.name} (关联 ${m.relatedIndicators.join('、')})`,
              }))}
            />
            {selectedMaterial && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                {(() => {
                  const m = materials.find((x) => x.id === selectedMaterial);
                  if (!m) return null;
                  return (
                    <div className="text-xs space-y-1">
                      <div><span className="text-slate-500">材料名称：</span><span className="font-bold text-slate-700">{m.name}</span></div>
                      <div><span className="text-slate-500">来源系统：</span><span className="text-slate-700">{m.sourceSystem}</span></div>
                      <div><span className="text-slate-500">格式要求：</span><span className="text-slate-700">{m.format}</span></div>
                      <div><span className="text-slate-500">关联指标：</span>{m.relatedIndicators.map((iid) => <Tag key={iid} className="m-0 text-[10px]">{iid}</Tag>)}</div>
                      {m.notes && <div className="text-amber-600"><span className="text-slate-500">备注：</span>{m.notes}</div>}
                      <div className="pt-2 border-t border-blue-200 mt-2">
                        <button
                          onClick={() => {
                            const header = ['编号', '名称', '说明/填写指引'];
                            const row1 = ['示例 001', '填写第一条数据', '替换为真实数据，保留表头'];
                            const row2 = ['示例 002', '填写第二条数据', '多写几行也可以'];
                            const csv = '\uFEFF' + [header.join(','), row1.join(','), row2.join(',')].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${m.name}_标准模板.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <DownloadOutlined /> 下载标准模板
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Step 3: 上传文件 */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">③ 上传文件</label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-green-400 hover:bg-green-50/30 transition-colors cursor-pointer">
              <InboxOutlined className="text-3xl text-slate-300 mb-2" />
              <div className="text-sm text-slate-500 mb-1">点击或拖拽文件到此处上传</div>
              <div className="text-xs text-slate-400">支持 Excel/Word/PDF/图片，单个文件不超过 50MB</div>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {file && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                <FileTextOutlined className="text-green-600" />
                <span className="text-xs font-bold text-slate-700 flex-1">{file.name}</span>
                <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            )}
          </div>

          {/* 提示 */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-xs text-amber-700 font-bold mb-1">上传后流程：</div>
            <ol className="text-xs text-amber-600 space-y-0.5 m-0 pl-4 list-decimal">
              <li>系统自动解析文件内容</li>
              <li>AI 自动映射到关联指标（根据材料类型）</li>
              <li>用户确认映射结果</li>
              <li>数据进入"已上传"状态，可在 AI 预填数据中查看</li>
            </ol>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100">取消</button>
          <button
            disabled={!selectedMaterial || !file}
            className="text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed px-5 py-2 rounded-lg flex items-center gap-1 transition-colors"
          >
            <UploadOutlined /> 开始上传
          </button>
        </div>
      </div>
    </div>
  );
}
