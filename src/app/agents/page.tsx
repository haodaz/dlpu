'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Input, Button, Spin, Tag } from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  ThunderboltOutlined,
  SearchOutlined,
  EditOutlined,
  ReadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  isTyping?: boolean;
};

export default function AgentsPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: '您好！我是大连工业大学智能评价引擎的**总评价AI司令**。您可以向我查询底层数据状态、交流评价标准，或者让我直接为您运行一次全景评价。'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }]);
    setInputValue('');

    // Simulate typing
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isTyping: true }]);

    // Smart Routing Logic
    let responseText = '';
    
    if (text.includes('数据') || text.includes('查询')) {
      await new Promise(r => setTimeout(r, 1000));
      responseText = '正在为您检索系统大盘数据...\n目前底层共收录了 1,128 个全景数据节点，覆盖了 T01-T19 全部模板。最近一次数据更新是在今天上午，T19 校友追踪模块新增了 3 条高管校友访谈记录。需要我为您深入分析某个特定模块吗？';
    } else if (text.includes('填报') || text.includes('提供') || text.includes('T03')) {
      await new Promise(r => setTimeout(r, 1000));
      responseText = '针对 T03 产业白皮书模块，我建议您重点补充以下信息以提升评级：\n1. **产业生命周期判定**：补充该产业是处于成长期还是成熟期的数据支撑。\n2. **关键岗位能力矩阵**：不要仅列出岗位名称，必须附带详细的硬技能(如PLC编程)和软技能要求。\n需要我为您生成一份标准的填报示例吗？';
    } else if (text.includes('标准') || text.includes('T11')) {
      await new Promise(r => setTimeout(r, 1000));
      responseText = '《包装机械设计》等主干课程的 T11 评价标准极其严格（适用“使命型17项指标体系”）：\n- **优秀级标准**：要求产业需求节点与课程目标完全闭环映射，不仅无空壳节点，且实战项目的真实企业合同驱动率需达到 70% 以上。\n- **关键红线**：一旦出现“挂名课程”或“180万以上高价设备使用率低于10%”，会直接被判定为不合格。';
    } else if (text.includes('Run') || text.includes('评价') || text.includes('跑')) {
      // Evaluation Flow
      await new Promise(r => setTimeout(r, 800));
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: '正在唤醒 9 位微专家智能体，准备拉起全景评价引擎，请稍候...', isTyping: false } : m));
      
      setIsEvaluating(true);
      const evalMsgId = (Date.now() + 2).toString();
      setMessages(prev => [...prev, { id: evalMsgId, role: 'assistant', content: <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center gap-3 w-64"><Spin size="large" /><div className="text-sm text-slate-500 font-bold">引擎运算中 (Tool Calling)...</div><div className="text-xs text-slate-400">正在进行跨模板矩阵比对</div></div> }]);

      // Call actual evaluation API
      try {
        await fetch('/api/evaluation', { method: 'POST' });
        await new Promise(r => setTimeout(r, 2000)); // Add visual delay
      } catch (e) {
        console.error(e);
      }

      setIsEvaluating(false);
      
      setMessages(prev => prev.filter(m => m.id !== evalMsgId)); // Remove loader
      
      const finalMsgId = (Date.now() + 3).toString();
      setMessages(prev => [...prev, { id: finalMsgId, role: 'assistant', content: (
        <div>
          <p className="font-bold text-emerald-600 mb-2"><CheckCircleOutlined className="mr-1" /> 评价任务执行完毕！</p>
          <p>本次全景诊断得分为 <strong>78分 (合格 C)</strong>。总线推理发现该专业呈现典型的“两端强劲、中间塌陷”的哑铃型发展格局。</p>
          <div className="mt-3">
            <Button type="primary" onClick={() => router.push('/')}>前往工作台查看雷达图报告</Button>
          </div>
        </div>
      ) }]);
      return;
    } else {
      await new Promise(r => setTimeout(r, 1000));
      responseText = '收到。作为您的评价司令，我可以帮您执行特定的核查任务。您可以尝试点击右侧的快捷技能，或者告诉我具体需要分析哪个维度的教学指标。';
    }

    setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: responseText, isTyping: false } : m));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const skills = [
    { icon: <SearchOutlined />, text: '查询目前的大连工业大学全景数据' },
    { icon: <EditOutlined />, text: '提供 T03 产业白皮书的补充填报信息' },
    { icon: <ReadOutlined />, text: '解释《包装机械设计》的 T11 评价标准' },
    { icon: <PlayCircleOutlined />, text: '立刻 Run 一次全新的宏观评价分析', isAction: true },
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 rounded-xl overflow-hidden">
      
      {/* ============== 左侧对话区 (Chat Area) ============== */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
        <div className="h-14 border-b border-slate-100 flex items-center px-6 bg-slate-50/50 shrink-0">
          <h2 className="font-bold text-slate-800 m-0">总司令对话终端 (ChatOps)</h2>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Avatar size={40} icon={<RobotOutlined />} className="bg-blue-600 shrink-0 mt-1" />
              )}
              
              <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
              }`}>
                {msg.isTyping ? (
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                ) : (
                  typeof msg.content === 'string' ? msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== msg.content.toString().split('\n').length - 1 && <br />}
                    </React.Fragment>
                  )) : msg.content
                )}
              </div>

              {msg.role === 'user' && (
                <Avatar size={40} icon={<UserOutlined />} className="bg-slate-300 shrink-0 mt-1" />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative">
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="在此输入指令与司令交流，按 Enter 发送..."
              autoSize={{ minRows: 2, maxRows: 5 }}
              className="pr-14 rounded-xl py-3 resize-none bg-slate-50 border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-colors"
              disabled={isEvaluating}
            />
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              className="absolute right-3 bottom-3"
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isEvaluating}
            />
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-400">AI 可能会产生误差，请以最终落地的全景数据报告为准。</span>
          </div>
        </div>
      </div>

      {/* ============== 右侧智能体面板 (Character Panel) ============== */}
      <div className="w-80 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        
        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center border-b border-slate-100 bg-gradient-to-b from-blue-50/50 to-white">
          <div className="relative mb-4 mt-2">
            <Avatar size={80} icon={<RobotOutlined />} className="bg-blue-600 shadow-md" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <h2 className="text-xl font-black text-slate-800 m-0 mb-1">总评价 AI 司令</h2>
          <div className="flex gap-2 mt-1">
            <Tag color="blue">模型: DeepSeek V3</Tag>
            <Tag color="cyan">状态: 待命 (Idle)</Tag>
          </div>
          <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            我是整个评价系统的大脑。我负责统筹调度 9 位微专家智能体，执行从数据入库到图谱编织、再到矩阵打分的完整 ChatOps 工作流。
          </p>
        </div>

        {/* Skill Panel */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-4">
            <ThunderboltOutlined className="text-amber-500" />
            <h3 className="font-bold text-slate-700 m-0">快捷指令库 (Skills)</h3>
          </div>
          
          <div className="space-y-3">
            {skills.map((skill, index) => (
              <div 
                key={index}
                onClick={() => {
                  if (!isEvaluating) {
                    handleSend(skill.text);
                  }
                }}
                className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                  skill.isAction 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50'
                } ${isEvaluating ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${skill.isAction ? '' : 'text-slate-400'}`}>
                    {skill.icon}
                  </div>
                  <div className="leading-tight">
                    {skill.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
