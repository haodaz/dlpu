'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme, Segmented, Tooltip } from 'antd';
import {
  DashboardOutlined,
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

const { Header, Sider, Content } = Layout;

export type Role = 'user' | 'admin';

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
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 用户视角菜单
  const userMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: 'grp-metrics',
      icon: <BarChartOutlined />,
      label: '指标体系',
      children: [
        { key: '/metrics', icon: <BarsOutlined />, label: '指标总览' },
        { key: '/metrics/detail', icon: <ProfileOutlined />, label: '指标详情' },
      ],
    },
    {
      key: 'grp-filling',
      icon: <FormOutlined />,
      label: '材料填报',
      children: [
        { key: '/data-management/my-uploads', icon: <CloudUploadOutlined />, label: '上传材料' },
        { key: '/data-management/ai-prefill', icon: <RobotOutlined />, label: '指标填报' },
        { key: '/data-management/records', icon: <SwapOutlined />, label: '提交记录' },
      ],
    },
    {
      key: 'grp-results',
      icon: <CheckCircleOutlined />,
      label: '填报成果',
      children: [
        { key: '/filling-results/by-indicator', icon: <TableOutlined />, label: '按指标查看' },
        { key: '/panoramic', icon: <AppstoreOutlined />, label: '按板块查看' },
      ],
    },
    {
      key: 'grp-reports',
      icon: <FileTextOutlined />,
      label: 'AI评价报告',
      children: [
        { key: '/evaluations', icon: <FileTextOutlined />, label: '报告生成' },
        { key: '/reports/detail', icon: <ProfileOutlined />, label: '报告列表' },
      ],
    },
    {
      key: '/agents',
      icon: <RobotOutlined />,
      label: 'AI智能体',
    },
    {
      key: '/knowledge-base',
      icon: <ReadOutlined />,
      label: '知识库',
    },
  ];

  // 管理员视角菜单
  const adminMenuItems = [
    {
      key: 'grp-evaluation-workbench',
      icon: <BarChartOutlined />,
      label: '指标评价工作台',
      children: [
        { key: '/admin', icon: <FundViewOutlined />, label: '首页' },
        { key: '/admin/reports', icon: <FileTextOutlined />, label: '报告列表' },
        { key: '/admin/tasks', icon: <ScheduleOutlined />, label: '任务管理' },
      ],
    },
    {
      key: 'grp-governance-workbench',
      icon: <ApartmentOutlined />,
      label: '院校治理工作台',
      children: [
        { key: '/admin/universities', icon: <DashboardOutlined />, label: '高校看板' },
        { key: '/admin/indicators', icon: <BarsOutlined />, label: '指标查询' },
      ],
    },
    {
      key: 'grp-system-support',
      icon: <SettingOutlined />,
      label: '系统支撑',
      children: [
        { key: '/admin/users', icon: <TeamOutlined />, label: '用户与权限' },
        { key: '/admin/templates', icon: <ProfileOutlined />, label: '指标模板管理' },
        { key: '/admin/data-sources', icon: <CloudServerOutlined />, label: '外部数据源管理' },
      ],
    },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

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
            <div className="relative w-full h-8">
               <Image src="/logo.png" alt="Pingfang Chuangxiang Logo" fill className="object-contain object-left" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-sm">
              平
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/dlpu_logo.png" alt="DLPU Logo" fill className="object-contain" />
            </div>
            <h1 className="text-slate-800 font-bold text-base leading-tight m-0">
              大连工业大学<br/>
              <span className="text-[11px] font-bold text-blue-500 mt-1 inline-block uppercase tracking-wide">Smart Evaluation</span>
            </h1>
          </div>
        )}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          style={{ borderRight: 0, padding: '12px 8px' }}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          className="custom-menu"
        />
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
              {role === 'admin' ? '管理员视角' : '用户视角'}
            </span>
            <span className="text-sm text-slate-400 font-medium hidden md:inline">
              {role === 'admin' ? '指标评价工作台' : '大连工业大学智能评价系统'}
            </span>
          </div>

          {/* 右侧：角色切换 + 操作区 */}
          <div className="flex items-center gap-4">
            {/* 角色切换按钮 */}
            <Tooltip title="切换用户/管理员视角">
              <Segmented
                value={role}
                onChange={handleRoleChange}
                size="small"
                options={[
                  { label: '用户', value: 'user', icon: <UserOutlined /> },
                  { label: '管理员', value: 'admin', icon: <CrownOutlined /> },
                ]}
              />
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
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
