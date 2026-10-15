'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme, Segmented, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  FileDoneOutlined,
  BookOutlined,
  FormOutlined,
  RobotOutlined,
  UserOutlined,
  SettingOutlined,
  SwapOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  BellOutlined,
  SearchOutlined,
  BarChartOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  ApartmentOutlined,
  ProfileOutlined,
  BarsOutlined,
  LinkOutlined,
  TableOutlined,
  AppstoreOutlined,
  ReadOutlined,
  CloudUploadOutlined,
  TeamOutlined,
  CrownOutlined,
  CloudServerOutlined,
  ScheduleOutlined,
  FundViewOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { PRODUCT_NAME, PRODUCT_TAGLINE, TENANT_NAME } from '@/lib/brand';
import SpecMode from '@/components/spec/SpecMode';
import { useViewVisibility } from '@/lib/diagnosis-state';
import { useDegradedReason } from '@/lib/synced-store';
import DegradedBanner from '@/components/DegradedBanner';

const { Header, Sider, Content } = Layout;

export type Role = 'user' | 'admin';

interface NavItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  children?: NavItem[];
}

// 取叶子节点 key
const collectLeafKeys = (items: NavItem[]): string[] =>
  items.flatMap((i) => (i.children ? collectLeafKeys(i.children) : [i.key]));

// 找到某个叶子 key 所属的分组 key 链
const findParentKeys = (items: NavItem[], target: string, parents: string[] = []): string[] | null => {
  for (const item of items) {
    if (item.key === target) return parents;
    if (item.children) {
      const found = findParentKeys(item.children, target, [...parents, item.key]);
      if (found) return found;
    }
  }
  return null;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<Role>('user');
  const router = useRouter();
  const pathname = usePathname();

  // 从 localStorage 读取角色
  useEffect(() => {
    const savedRole = localStorage.getItem('app_role') as Role | null;
    if (savedRole === 'admin' || savedRole === 'user') {
      setRole(savedRole);
    }
  }, []);

  // 角色切换时持久化并跳转首页
  const handleRoleChange = (value: string) => {
    const newRole = value as Role;
    setRole(newRole);
    localStorage.setItem('app_role', newRole);
    if (newRole === 'admin') {
      router.push(visible.decision ? '/decision' : visible.management ? '/admin' : '/admin/data-sources');
    } else {
      router.push('/');
    }
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 专业教师视角菜单(按需触达:只保留"我要做的事",其余收进内部参考)
  const userMenuItems: NavItem[] = [
    { key: '/', icon: <DashboardOutlined />, label: '我的待办' },
    { key: '/data-management/ai-prefill', icon: <FormOutlined />, label: '待填报指标' },
    { key: '/data-management/records', icon: <SwapOutlined />, label: '填报记录' },
    {
      key: 'grp-internal-user',
      icon: <BookOutlined />,
      label: '内部参考',
      children: [
        { key: '/data-management/my-uploads', icon: <CloudUploadOutlined />, label: '我的材料' },
        { key: '/templates', icon: <ProfileOutlined />, label: '模板库' },
        { key: '/knowledge-base', icon: <ReadOutlined />, label: '知识库' },
      ],
    },
  ];

  // 管理员视角菜单:三种页面视角(按开会叙事顺序)+ 内部参考(默认收起)
  const adminMenuItems: NavItem[] = [
    { key: '/decision', icon: <FundProjectionScreenOutlined />, label: '宏观决策分析' },
    { key: '/industry-report', icon: <ExperimentOutlined />, label: '产业分析报告' },
    {
      key: 'grp-management',
      icon: <BarChartOutlined />,
      label: '管理分析',
      children: [
        { key: '/admin', icon: <FundViewOutlined />, label: '诊断分析' },
        { key: '/rectification', icon: <FileDoneOutlined />, label: '整改报告与跟踪' },
        { key: '/admin/review', icon: <LineChartOutlined />, label: '回看与比较' },
        { key: '/admin/reports', icon: <FileTextOutlined />, label: '评价结果' },
        { key: '/admin/tasks', icon: <ScheduleOutlined />, label: '评价任务' },
        { key: '/admin/users', icon: <TeamOutlined />, label: '用户与权限' },
      ],
    },
    {
      key: 'grp-upload',
      icon: <CloudUploadOutlined />,
      label: '数据上传',
      children: [
        { key: '/admin/data-sources', icon: <CloudServerOutlined />, label: '数据源接入' },
        { key: '/admin/industry-log', icon: <DatabaseOutlined />, label: '产业检索日志' },
        { key: '/admin/templates', icon: <ProfileOutlined />, label: '模板与范本' },
      ],
    },
    {
      key: 'grp-internal-admin',
      icon: <BookOutlined />,
      label: '内部参考',
      children: [
        { key: '/evaluations', icon: <FileTextOutlined />, label: 'AI评价 · 报告生成' },
        { key: '/reports/detail', icon: <FileTextOutlined />, label: 'AI评价 · 报告列表' },
        { key: '/agents', icon: <RobotOutlined />, label: 'AI智能体' },
        { key: '/filling-results/by-indicator', icon: <TableOutlined />, label: '填报成果 · 按指标' },
        { key: '/panoramic', icon: <AppstoreOutlined />, label: '填报成果 · 按板块' },
        { key: '/admin/universities', icon: <DashboardOutlined />, label: '高校看板' },
        { key: '/knowledge-base', icon: <ReadOutlined />, label: '知识库' },
        { key: '/data-flow', icon: <ClusterOutlined />, label: '数据流' },
        { key: '/logic', icon: <ApartmentOutlined />, label: '逻辑说明' },
      ],
    },
  ];

  // 三视角可见范围:由「用户与权限」页开关(先做前端显隐,后接权限)
  const [visible] = useViewVisibility();
  const degradedReason = useDegradedReason();
  const VIEW_KEYS: Record<string, keyof typeof visible> = {
    '/decision': 'decision',
    '/industry-report': 'decision',
    'grp-management': 'management',
    'grp-upload': 'upload',
  };
  const menuItems = role === 'admin' ? adminMenuItems.filter((i) => !VIEW_KEYS[i.key] || visible[VIEW_KEYS[i.key]]) : userMenuItems;

  // 指标页不再是菜单入口,只能从评价结论下钻;下钻时菜单高亮其来源页
  const DRILL_DOWN_ALIASES: Record<string, string> = {
    '/metrics': role === 'admin' ? '/admin' : '/data-management/ai-prefill',
    '/admin/indicators': '/admin/reports',
    '/admin/major': '/admin',
    '/admin/indicator-analysis': '/admin',
  };
  const aliasKey = Object.entries(DRILL_DOWN_ALIASES).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'),
  )?.[1];

  // 当前高亮项:取与路径前缀匹配的最长叶子 key,保证下钻子页面时菜单仍有选中
  const selectedKey =
    aliasKey ??
    collectLeafKeys(menuItems)
      .filter((k) => pathname === k || (k !== '/' && pathname.startsWith(k + '/')))
      .sort((a, b) => b.length - a.length)[0] ?? pathname;

  // 自动展开当前项所在分组(其余分组保持用户手动开合)
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  useEffect(() => {
    const parents = findParentKeys(menuItems, selectedKey);
    if (parents && parents.length) {
      setOpenKeys((prev) => Array.from(new Set([...prev, ...parents])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, role]);

  return (
    <Layout hasSider style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Sider 
        width={256} 
        theme="light" 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        style={{ 
          overflow: 'auto', 
          height: '100vh', 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          bottom: 0,
          borderRight: '1px solid #f1f5f9',
          boxShadow: '1px 0 10px rgba(0,0,0,0.02)',
          zIndex: 100
        }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
          {!collapsed ? (
            <div className="relative w-full h-9">
               <Image src="/fanglue_logo.png" alt={`${PRODUCT_NAME} Logo`} fill className="object-contain object-left" priority />
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-sm">
              方
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/dlpu_logo.png" alt="DLPU Logo" fill className="object-contain" />
            </div>
            <h1 className="text-slate-800 font-bold text-base leading-tight m-0">
              {TENANT_NAME}
            </h1>
          </div>
        )}
        <div data-spec="sidebar">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          style={{ borderRight: 0, padding: '12px 8px' }}
          items={menuItems as MenuProps['items']}
          onClick={({ key }) => router.push(key)}
          className="custom-menu"
        />
        </div>
      </Sider>

      {/* Main Layout Area - Margin dynamically updates based on collapsed state */}
      <Layout 
        style={{ 
          marginLeft: collapsed ? 80 : 256, 
          transition: 'all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
          background: '#f8fafc' 
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            height: 64,
            lineHeight: '64px'
          }}
        >
          {/* 左侧：当前视角标识 */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
              role === 'admin'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {role === 'admin' ? '管理员视角' : '专业教师视角'}
            </span>
            <span className="text-sm text-slate-400 font-medium hidden md:inline">
              {PRODUCT_TAGLINE}
            </span>
          </div>

          {/* 右侧：角色切换 + 操作区 */}
          <div className="flex items-center gap-4">
            <SpecMode />
            {/* 角色切换按钮 */}
            <Tooltip title="切换教师/管理员视角">
              <span data-spec="topbar" className="inline-flex">
              <Segmented
                value={role}
                onChange={handleRoleChange}
                size="small"
                options={[
                  { label: '教师', value: 'user', icon: <UserOutlined /> },
                  { label: '管理员', value: 'admin', icon: <CrownOutlined /> },
                ]}
              />
              </span>
            </Tooltip>

            <SearchOutlined className="text-lg text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
            <div className="relative">
              <BellOutlined className="text-lg text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </div>
            <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录', danger: true }] }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm">
                <Avatar size="small" style={{ backgroundColor: role === 'admin' ? '#7c3aed' : '#1677ff', fontWeight: 'bold' }}>郝</Avatar>
                <span className="text-sm font-bold text-slate-700">郝壮</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '24px 32px 48px', overflow: 'initial' }}>
          <DegradedBanner reason={degradedReason} />
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
