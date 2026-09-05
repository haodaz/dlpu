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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={256} 
        theme="light" 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
          {!collapsed ? (
            <div className="relative w-full h-8">
               <Image src="/logo.png" alt="Pingfang Chuangxiang Logo" fill className="object-contain object-left" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
              平
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/dlpu_logo.png" alt="DLPU Logo" fill className="object-contain" />
            </div>
            <h1 className="text-gray-800 font-bold text-base leading-tight m-0">
              大连工业大学<br/>
              <span className="text-xs font-normal text-gray-500 mt-1 inline-block">智能评价工作台</span>
            </h1>
          </div>
        )}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          style={{ borderRight: 0 }}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-6">
            <SearchOutlined className="text-xl text-gray-400 cursor-pointer hover:text-blue-600 transition-colors" />
            <BellOutlined className="text-xl text-gray-400 cursor-pointer hover:text-blue-600 transition-colors" />
            <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录' }] }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>郝</Avatar>
                <span className="text-sm font-medium text-gray-700">郝壮</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
