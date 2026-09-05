'use client';

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
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
  SearchOutlined
} from '@ant-design/icons';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页',
    },
    {
      key: '/evaluations',
      icon: <CheckCircleOutlined />,
      label: '评价管理',
    },
    {
      key: '/panoramic',
      icon: <DatabaseOutlined />,
      label: '全景数据',
    },
    {
      key: '/data-flow',
      icon: <SwapOutlined />,
      label: '数据流',
    },
    {
      key: '/templates',
      icon: <FormOutlined />,
      label: '模板管理',
    },
    {
      key: '/agents',
      icon: <RobotOutlined />,
      label: 'AI智能体',
    },
  ];

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
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            borderBottom: '1px solid #f1f5f9',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            height: 64,
            lineHeight: '64px'
          }}
        >
          <div className="flex items-center gap-6">
            <SearchOutlined className="text-lg text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
            <div className="relative">
              <BellOutlined className="text-lg text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </div>
            <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录', danger: true }] }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm">
                <Avatar size="small" style={{ backgroundColor: '#1677ff', fontWeight: 'bold' }}>郝</Avatar>
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
