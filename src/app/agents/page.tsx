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
  content: string | React.ReactNode | null;
  isTyping?: boolean;
};

export default function AgentsPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: '您好！我是大连工业大学智能评价引擎的**总评价 AI 司令**。您可以向我查询底层数据状态、交流评价标准，或者让我直接为您运行一次全景评价。'
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

    // Smart Routing Logic for Report Interpretation
    let responseText = '';
    
    if (text.includes('解读') || text.includes('核心发现') || text.includes('报告')) {
      await new Promise(r => setTimeout(r, 1200));
      responseText = `**当前评价报告核心发现**\n\n📊 **总分 88.5 分（良好 B 级）**\n\n四大维度得分率：\n- **A 课程与需求适配性**：92%（优秀）— 产业对接精准，课程映射完整\n- **B 教学实施有效性**：90%（优秀）— 考核闭环管理规范，教学投入深度高\n- **C 运行保障支撑度**：85%（良好）— 资源保障稳健，企业合作真实有效\n- **D 产出与贡献**：82%（良好）— 受校友数据薄弱影响，成为主要短板\n\n **关键发现**：\n1. 17 项指标中 10 项达良好及以上，整体表现稳健\n2. 主要短板在**校友影响力（70 分）**和**企业项目驱动率（65%）**\n3. 数据流健康度达 92%，证据链完整可追溯\n\n需要我深入分析某个维度或指标吗？`;
    } else if (text.includes('维度') || text.includes('差异') || text.includes('短板')) {
      await new Promise(r => setTimeout(r, 1200));
      responseText = `**四大维度得分差异分析**\n\n| 维度 | 得分率 | 等级 | 主要优势 | 主要短板 |\n|------|--------|------|----------|----------|\n| A 课程与需求适配性 | 92% | 优秀 | 产业白皮书三模块齐全，课程 - 产业链映射 100% 覆盖 | 前沿课比例仅 33%，AI 能力覆盖不足 |\n| B 教学实施有效性 | 90% | 优秀 | 考核闭环率 85%，问答响应率 90% | 横向科研转化仅 45%，AI 教师能力 60% |\n| C 运行保障支撑度 | 85% | 良好 | 实验开出率 92%，设备完好率 96% | AI 平台接入率 80%，真实项目驱动率 65% |\n| D 产出与贡献 | 82% | 良好 | 对口就业率 75%，满意度 4.2/5 | 校友追踪覆盖率仅 60%，影响力比例 35% |\n\n📌 **改进优先级建议**：\n1. **第一阶**：提升校友数据追踪覆盖率（从 60% 提升至 80%）\n2. **第二阶**：加强 AI 平台培训，提升接入率（从 80% 提升至 95%）\n3. **第三阶**：拓展企业项目来源，提升真实项目驱动率（从 65% 提升至 80%）\n\n需要我查看具体指标的评分理由吗？`;
    } else if (text.includes('指标') || text.includes('评分理由') || text.includes('扣分点')) {
      await new Promise(r => setTimeout(r, 1200));
      responseText = `**指标评分理由与扣分点示例**\n\n📋 **2.2.1 教学投入深度（92 分 · 优秀）**\n\n✅ **评分理由**：\n- 传道维度：职业指引帖文准确率 95%，学习计划提交率 95%\n- 授业维度：课程依赖矩阵完整，每门课有前置课和后续课标注\n- 解惑维度：问答响应率 90%，接近优秀标准（≥95%）\n\n⚠️ **扣分点**：\n- AI 未检测到 2 处学生提问纳入修订（语义改写而非关键词），教师手动标注，说明 AI 语义理解需加强\n\n📎 **证据链**：课程平台互动数据 Excel、职业指引帖文截图、学习计划提交统计、课程依赖矩阵\n\n---\n\n📋 **4.1.2 毕业生影响力（70 分 · 合格）**\n\n✅ **评分理由**：\n- 校友影响力比例 35%，达到良好标准（≥30%）\n- AI 匹配准确率约 90%\n\n⚠️ **扣分点**：\n- 追踪覆盖率仅 60%，低于参考线，数据基础薄弱\n- 校友数据不全、更新不及时，导致指标参考价值受限\n\n需要我查看其他指标的详细分析吗？`;
    } else if (text.includes('Run') || text.includes('评价') || text.includes('跑')) {
      // Evaluation Flow
      await new Promise(r => setTimeout(r, 800));
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: '正在唤醒 9 位微专家智能体，准备拉起全景评价引擎，请稍候...', isTyping: false } : m));
      
      setIsEvaluating(true);
      const evalMsgId = (Date.now() + 2).toString();
      setMessages(prev => [...prev, { id: evalMsgId, role: 'assistant', content: <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center gap-3 w-64"><Spin size="large" /><div className="text-sm text-slate-500 font-bold">引擎运算中 (Tool Calling)...</div><div className="text-xs text-slate-400">正在进行跨模板矩阵比对</div></div> }]);

      // Mock evaluation (no actual API call)
      await new Promise(r => setTimeout(r, 2000));

      setIsEvaluating(false);
      
      setMessages(prev => prev.filter(m => m.id !== evalMsgId)); // Remove loader
      
      const finalMsgId = (Date.now() + 3).toString();
      setMessages(prev => [...prev, { id: finalMsgId, role: 'assistant', content: (
        <div>
          <p className="font-bold text-emerald-600 mb-2"><CheckCircleOutlined className="mr-1" /> 评价任务执行完毕！</p>
          <p>本次全景诊断得分为 <strong>88.5 分（良好 B 级）</strong>。总线推理发现该专业在四大维度中，课程与需求适配性（92%）与教学实施有效性（90%）表现突出，产出与贡献（82%）受校友数据薄弱影响成为主要短板。</p>
          <div className="mt-3">
            <Button type="primary" onClick={() => router.push('/evaluations')}>前往评价报告查看详细解读</Button>
          </div>
        </div>
      ) }]);
      return;
    } else {
      await new Promise(r => setTimeout(r, 1000));
      responseText = '收到。作为您的评价司令，我可以帮您解读 AI 评价报告、分析维度差异、查看指标评分理由。您可以尝试点击右侧的快捷技能，或者告诉我具体需要分析哪个维度的教学指标。';
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
    { icon: <SearchOutlined />, text: '解读当前评价报告的核心发现' },
    { icon: <ReadOutlined />, text: '分析四大维度的得分差异与短板' },
    { icon: <EditOutlined />, text: '查看各指标的评分理由与扣分点' },
    { icon: <PlayCircleOutlined />, text: '立即 Run 一次全新的宏观评价分析', isAction: true },
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 rounded-xl overflow-hidden">
      
      {/* ============== 左侧对话区 (Chat Area) ============== */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
        <div className="h-14 border-b border-slate-100 flex items-center px-6 bg-slate-50/50 shrink-0">
          <h2 className="font-bold text-slate-800 m-0">主智能体对话终端 (ChatOps)</h2>
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
                  msg.content != null && typeof msg.content === 'string' ? msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== (msg.content as string).split('\n').length - 1 && <br />}
                    </React.Fragment>
                  )) : (msg.content as React.ReactNode | null)
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
            <Tag color="blue">模型：DeepSeek V3</Tag>
            <Tag color="cyan">状态：待命 (Idle)</Tag>
          </div>
          <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            我是整个评价系统的大脑。我负责统筹调度 9 位微专家智能体，执行从数据入库到图谱编织、再到矩阵打分的完整 ChatOps 工作流。
          </p>
        </div>

        {/* Report Summary Card */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-emerald-50/30 to-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-black">报</div>
            <div>
              <h3 className="font-bold text-slate-700 text-sm m-0">当前评价报告</h3>
              <p className="text-[10px] text-slate-400 m-0">使命型 17 项指标评价</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">总分</span>
              <span className="font-black text-lg text-emerald-600">88.5<span className="text-xs font-normal text-slate-400">分</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">等级</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">良好 (B)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">维度 A</span>
              <span className="font-bold text-emerald-600">92%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">维度 B</span>
              <span className="font-bold text-emerald-600">90%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">维度 C</span>
              <span className="font-bold text-blue-600">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">维度 D</span>
              <span className="font-bold text-blue-600">82%</span>
            </div>
          </div>
        </div>

        {/* Skill Panel */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-3">
            <ThunderboltOutlined className="text-amber-500" />
            <h3 className="font-bold text-slate-700 text-sm m-0">快捷指令库 (Skills)</h3>
          </div>
          
          <div className="space-y-2">
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
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${skill.isAction ? '' : 'text-slate-400'}`}>
                    {skill.icon}
                  </div>
                  <div className="leading-tight text-xs">
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
