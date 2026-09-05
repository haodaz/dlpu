import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EvaluationContext, ExpertResult } from '@/lib/evaluation/types';

// 导入 9 大真实微专家
import { industryExpert } from '@/lib/evaluation/experts/01_industryExpert';
import { alignmentExpert } from '@/lib/evaluation/experts/02_alignmentExpert';
import { teacherExpert } from '@/lib/evaluation/experts/03_teacherExpert';
import { studentExpert } from '@/lib/evaluation/experts/04_studentExpert';
import { assetExpert } from '@/lib/evaluation/experts/05_assetExpert';
import { practiceExpert } from '@/lib/evaluation/experts/06_practiceExpert';
import { integrationExpert } from '@/lib/evaluation/experts/07_integrationExpert';
import { careerExpert } from '@/lib/evaluation/experts/08_careerExpert';
import { alumniExpert } from '@/lib/evaluation/experts/09_alumniExpert';

// 导入主智能体
import { chiefEvaluate } from '@/lib/evaluation/chief';
import { chartEvaluate } from '@/lib/evaluation/chartExpert';

const prisma = new PrismaClient();

const ALL_EXPERTS = [
  industryExpert,
  alignmentExpert,
  teacherExpert,
  studentExpert,
  assetExpert,
  practiceExpert,
  integrationExpert,
  careerExpert,
  alumniExpert
];

export async function POST(request: Request) {
  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // 1. 初始化界面状态
          send({ type: 'log', agentId: 'system', message: '正在启动强防御架构智能评价引擎 (Promise.allSettled)...' });
          send({ type: 'agent', data: { id: 'chief', name: '主智能体 (Chief AI)', status: 'working', icon: '👑' } });

          // 2. 拉取全景数据
          send({ type: 'log', agentId: 'chief', message: '👑 主智能体正在拉取底层全景数据池...' });
          const rawData = await prisma.panoramicData.findMany();
          
          const context: EvaluationContext = {
            panoramicData: {}
          };

          rawData.forEach(item => {
            try {
              context.panoramicData[item.templateCode] = JSON.parse(item.rawPayload);
            } catch (e) {
              context.panoramicData[item.templateCode] = item.rawPayload;
            }
          });
          
          send({ type: 'log', agentId: 'system', message: `✅ 成功挂载 ${Object.keys(context.panoramicData).length} 个全景数据节点，下发给微专家。` });
          send({ type: 'agent', data: { id: 'chief', status: 'done', icon: '👑' } });

          // 3. 并发启动专家集群
          ALL_EXPERTS.forEach(exp => {
            send({ type: 'agent', data: { id: exp.id, name: exp.name, status: 'working', icon: exp.icon } });
          });
          
          send({ type: 'log', agentId: 'system', message: '🌐 9 大微专家集群已并行唤醒，各司其职中...' });

          // 封装执行器，附带专属日志流
          const expertPromises = ALL_EXPERTS.map(async (expert) => {
             const onLog = (msg: string) => send({ type: 'log', agentId: expert.id, message: msg });
             try {
                const report = await expert.evaluate(context, onLog);
                send({ type: 'agent', data: { id: expert.id, name: expert.name, status: 'done', icon: expert.icon } });
                return { id: expert.id, report };
             } catch (err: any) {
                onLog(`❌ ${expert.icon} ${expert.name} 运行崩溃: ${err.message}`);
                send({ type: 'agent', data: { id: expert.id, name: expert.name, status: 'error', icon: expert.icon } });
                throw err;
             }
          });

          // 【极其核心】使用 allSettled 进行防御性并行调用，任何一个专家的解析失败/网络断开，都不会导致整个系统挂掉
          const settledResults = await Promise.allSettled(expertPromises);

          // 筛选出成功的专家报告
          const validExpertResults: Record<string, ExpertResult> = {};
          
          settledResults.forEach((res, index) => {
            const expertDef = ALL_EXPERTS[index];
            if (res.status === 'fulfilled') {
              validExpertResults[res.value.id] = res.value.report;
            } else {
              // 为失败的专家提供降级报告，确保主智能体能拿到点什么
              validExpertResults[expertDef.id] = {
                status: "专家崩溃",
                indicator: "未知",
                criteria: "无",
                grade: "不合格",
                analysis: `系统捕捉到专家崩溃异常，可能是该维度的底层数据产生严重错乱导致AI拒答：${res.reason}`,
                suggestions: "建议系统管理员排查大模型网络连接或数据格式。"
              };
            }
          });

          // 4. 总 AI 合成与图表绘制
          send({ type: 'agent', data: { id: 'chief_synthesis', name: '主智能体 (统筹裁决)', status: 'working', icon: '👑' } });
          send({ type: 'agent', data: { id: 'chart_expert', name: '图表绘制师 (数据标签)', status: 'working', icon: '📊' } });
          send({ type: 'log', agentId: 'system', message: '👑 主智能体与 📊 图表绘制师 已并行唤醒，开始生成长卷宗与可视化数据...' });
          
          const chiefLog = (msg: string) => send({ type: 'log', agentId: 'chief_synthesis', message: msg });
          const chartLog = (msg: string) => send({ type: 'log', agentId: 'chart_expert', message: msg });

          const [finalReport, chartDataMap] = await Promise.all([
            chiefEvaluate(validExpertResults, chiefLog),
            chartEvaluate(validExpertResults, chartLog)
          ]);

          // 将 chartData 注入到 finalReport 的对应专家结果中
          for (const key in chartDataMap) {
            if (finalReport.expertResults[key]) {
              finalReport.expertResults[key].chartData = chartDataMap[key];
            }
          }

          send({ type: 'agent', data: { id: 'chief_synthesis', name: '主智能体 (统筹裁决)', status: 'done', icon: '👑' } });
          send({ type: 'agent', data: { id: 'chart_expert', name: '图表绘制师 (数据标签)', status: 'done', icon: '📊' } });

          // 5. 存入数据库
          send({ type: 'log', agentId: 'system', message: '💾 正在将万字长卷宗存入核心数据库...' });
          await prisma.panoramicData.create({
            data: {
              templateCode: 'EVAL_FINAL',
              sourceType: 'MULTI_AGENT_AI',
              status: 'COMPLETED',
              rawPayload: JSON.stringify(finalReport)
            }
          });

          send({ type: 'log', agentId: 'system', message: '✅ 终极评价裁决完毕，结果已绝对存证！正在渲染前端长卷...' });
          send({ type: 'agent', data: { id: 'chief_synthesis', name: '主智能体 (统筹裁决)', status: 'done', icon: '👑' } });
          
          send({ type: 'result', data: finalReport });

        } catch (error: any) {
          send({ type: 'error', message: error.message });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
