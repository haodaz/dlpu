'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Tag, Button, Tabs, Radio, Drawer, Form, Input, Upload, message, Tooltip, Alert } from 'antd';
import { EyeOutlined, SettingOutlined, SendOutlined, CheckCircleFilled, UploadOutlined, CopyOutlined, RobotOutlined, CloudServerOutlined, UserOutlined } from '@ant-design/icons';
import { TEMPLATES, type TemplateEntry } from '@/lib/templates';
import { TEACHER_ITEMS } from '@/lib/diagnosis';
import { templateMapping } from '@/lib/data-management';
import { indicators } from '@/lib/indicators';
import { useTemplateConfig, type TemplateSetting } from '@/lib/diagnosis-state';

// 模板与范本(学校 / 院系管理员的配置页)
//   教师填报:系统自带多套模板可选,也可以学校自己配置(填写要求、AI 提示词、范文);确认后发布给教师
//   AI 采集:平台统一维护、逐个测过的采集模板,学校只能选用,不能改
//   学校系统:每个模板对应要从学校系统请求的字段与指标,可一键复制对接说明给信息中心
// 模板目录只在 src/lib/templates.ts 维护一份,教师端「模板库」读同一份

const VARIANTS = [
  { value: 'std', label: '标准版', desc: '按评价指标的完整要求,适合首次参评' },
  { value: 'lite', label: '简化版', desc: '只保留评价必需的部分,老师填写量约减半' },
  { value: 'custom', label: '学校自定义', desc: '在标准版基础上改写填写要求、提示词和范文' },
];
// AI 采集模板:平台测过的版本(数据可得性与效果已验证)
const AI_VARIANTS = [
  { value: 'std', label: '标准采集', desc: '公开来源 + 平方数据,已在 3 所试点校验证' },
  { value: 'deep', label: '深度采集', desc: '额外检索行业报告与招聘数据,耗时更长' },
];

const indicatorName = (id: string) => indicators.find((i) => i.id === id)?.name ?? '';

export default function AdminTemplatesPage() {
  const [config, setConfig] = useTemplateConfig();
  const [editing, setEditing] = useState<TemplateEntry | null>(null);
  const [msg, holder] = message.useMessage();
  const teacher = TEMPLATES.filter((t) => t.owner === 'TEACHER');
  const school = TEMPLATES.filter((t) => t.owner === 'SCHOOL');
  const ai = TEMPLATES.filter((t) => t.owner === 'AI');

  const update = (id: string, patch: Partial<TemplateSetting>) => setConfig({ ...config, [id]: { ...config[id], ...patch, variant: patch.variant ?? config[id]?.variant ?? 'std' } });
  const published = teacher.filter((t) => config[t.id]?.publishedAt).length;

  return (
    <div className="space-y-4">
      {holder}
      <Card data-spec="tpl-catalog" className="shadow-sm" styles={{ body: { padding: 20 } }}>
        <div className="text-base font-bold text-slate-800">模板与范本</div>
        <p className="text-sm text-slate-500 mt-1 mb-0">
          这里是管理员配置模板的地方:给老师用的填报模板可以选系统自带的版本,也可以自己改要求、提示词和范文,确认后发布给老师;AI 采集模板由平台统一维护;学校系统模板说明要从哪个系统取哪些字段。
        </p>
      </Card>

      <Card className="shadow-sm" styles={{ body: { padding: '4px 20px 20px' } }}>
        <Tabs
          items={[
            {
              key: 'teacher',
              label: (
                <span>
                  <UserOutlined /> 教师填报({teacher.length})
                </span>
              ),
              children: (
                <div data-spec="tpl-teacher" className="space-y-3">
                  <Alert
                    type="info"
                    showIcon
                    title={`已发布 ${published} / ${teacher.length} 个。老师在「评价任务」里看到的是这里发布的版本;未发布的沿用系统标准版。`}
                  />
                  {teacher.map((t) => {
                    const c = config[t.id];
                    const item = TEACHER_ITEMS.find((x) => x.templateId.toUpperCase() === t.id);
                    return (
                      <div key={t.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="font-bold text-slate-800">
                              {item?.kind ?? t.name}
                              <span className="ml-2 text-xs font-mono text-slate-400">{t.id}</span>
                              {c?.publishedAt ? (
                                <Tag color="success" className="ml-2" icon={<CheckCircleFilled />}>
                                  已发布 · {new Date(c.publishedAt).toLocaleDateString('zh-CN')}
                                </Tag>
                              ) : (
                                <Tag className="ml-2">未发布 · 沿用标准版</Tag>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              关联指标:{t.indicators.map((id) => `${id} ${indicatorName(id)}`).join('、')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={t.path}>
                              <Button size="small" icon={<EyeOutlined />}>
                                预览
                              </Button>
                            </Link>
                            <Button size="small" icon={<SettingOutlined />} onClick={() => setEditing(t)}>
                              配置
                            </Button>
                            <Button
                              size="small"
                              type="primary"
                              icon={<SendOutlined />}
                              onClick={() => {
                                update(t.id, { publishedAt: new Date().toISOString() });
                                msg.success(`已发布「${item?.kind ?? t.name}」模板,老师下次打开评价任务即可看到`);
                              }}
                            >
                              {c?.publishedAt ? '重新发布' : '确认并发布'}
                            </Button>
                          </div>
                        </div>
                        <Radio.Group
                          className="mt-3"
                          value={c?.variant ?? 'std'}
                          onChange={(e) => update(t.id, { variant: e.target.value, publishedAt: undefined })}
                          options={VARIANTS.map((v) => ({
                            value: v.value,
                            label: (
                              <Tooltip title={v.desc}>
                                <span>{v.label}</span>
                              </Tooltip>
                            ),
                          }))}
                        />
                        {c?.variant === 'custom' && (c.requirement || c.sampleName) && (
                          <div className="mt-2 text-xs text-slate-500">
                            {c.requirement && <div>自定义要求:{c.requirement.slice(0, 80)}</div>}
                            {c.sampleName && <div>学校范文:{c.sampleName}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ),
            },
            {
              key: 'ai',
              label: (
                <span>
                  <RobotOutlined /> AI 采集({ai.length})
                </span>
              ),
              children: (
                <div data-spec="tpl-ai" className="space-y-3">
                  <Alert type="info" showIcon title="AI 采集模板由平台统一维护,每个都测过数据可得性和效果;学校可以选用版本,不能改写内容,以保证采集质量。采集结果在评价任务里交教务确认后才计入评价。" />
                  {ai.map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-slate-800">
                          {t.name}
                          <span className="ml-2 text-xs font-mono text-slate-400">{t.id}</span>
                          <Tag color="purple" className="ml-2">
                            已验证
                          </Tag>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
                        <Radio.Group
                          className="mt-2"
                          size="small"
                          value={config[t.id]?.variant ?? 'std'}
                          onChange={(e) => update(t.id, { variant: e.target.value })}
                          options={AI_VARIANTS.map((v) => ({ value: v.value, label: <Tooltip title={v.desc}>{v.label}</Tooltip> }))}
                        />
                      </div>
                      <Link href={t.path}>
                        <Button size="small" icon={<EyeOutlined />}>
                          看采集结果样例
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: 'school',
              label: (
                <span>
                  <CloudServerOutlined /> 学校系统({school.length})
                </span>
              ),
              children: (
                <div data-spec="tpl-school" className="space-y-3">
                  <Alert
                    type="info"
                    showIcon
                    title="每个模板说明要从学校哪个系统取哪些字段、用在哪个指标上。点「复制对接说明」发给信息中心即可;数据怎么接进来见「数据源接入」。"
                  />
                  {school.map((t) => {
                    const usages = templateMapping[t.id]?.indicatorUsages ?? [];
                    const spec = `【${t.id} ${t.name}】\n用途:${t.desc}\n${usages.map((u) => `- 指标 ${u.indicatorId} ${indicatorName(u.indicatorId)}:需要字段 ${u.usedFields.join('、')}`).join('\n')}\n推送方式:POST /api/data-import,templateCode=${t.id}(详见技术对接文档)`;
                    return (
                      <div key={t.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="font-bold text-slate-800">
                            {t.name}
                            <span className="ml-2 text-xs font-mono text-slate-400">{t.id}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link href={t.path}>
                              <Button size="small" icon={<EyeOutlined />}>
                                看表头
                              </Button>
                            </Link>
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                navigator.clipboard?.writeText(spec).catch(() => {});
                                msg.success('对接说明已复制,可直接发给信息中心');
                              }}
                            >
                              复制对接说明
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 mb-2">{t.desc}</div>
                        <table className="w-full text-xs">
                          <tbody>
                            {usages.map((u) => (
                              <tr key={u.indicatorId} className="border-t border-slate-100">
                                <td className="py-1.5 pr-3 whitespace-nowrap text-slate-600">
                                  {u.indicatorId} {indicatorName(u.indicatorId)}
                                </td>
                                <td className="py-1.5">
                                  {u.usedFields.map((f) => (
                                    <Tag key={f} className="mb-1">
                                      {f}
                                    </Tag>
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <ConfigDrawer
        template={editing}
        setting={editing ? config[editing.id] : undefined}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return;
          update(editing.id, { ...patch, variant: 'custom', publishedAt: undefined });
          setEditing(null);
          msg.success('已保存为学校自定义版本,确认无误后点「确认并发布」');
        }}
      />
    </div>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return <span onClick={() => router.push(href)}>{children}</span>;
}

// 学校自定义:填写要求、AI 提示词、范文
function ConfigDrawer({ template, setting, onClose, onSave }: { template: TemplateEntry | null; setting?: TemplateSetting; onClose: () => void; onSave: (p: Partial<TemplateSetting>) => void }) {
  const [form] = Form.useForm();
  const item = template ? TEACHER_ITEMS.find((x) => x.templateId.toUpperCase() === template.id) : undefined;
  const [sample, setSample] = useState<string | undefined>(setting?.sampleName);
  return (
    <Drawer
      title={template ? `配置模板:${item?.kind ?? template.name}` : ''}
      open={!!template}
      onClose={onClose}
      size={520}
      destroyOnHidden
      afterOpenChange={(open) => {
        if (open) {
          form.setFieldsValue({ requirement: setting?.requirement ?? item?.standard.join('\n') ?? '', prompt: setting?.prompt ?? item?.aiAssist ?? '' });
          setSample(setting?.sampleName);
        }
      }}
      extra={
        <Button type="primary" onClick={() => form.validateFields().then((v) => onSave({ ...v, sampleName: sample }))}>
          保存
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="填写要求(老师看到的达标标准,每行一条)" name="requirement" rules={[{ required: true, message: '请填写要求' }]}>
          <Input.TextArea rows={5} />
        </Form.Item>
        <Form.Item label="AI 辅助起草的提示词" name="prompt" extra="老师点「AI 辅助起草」时,AI 按这段提示词生成初稿">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item label="学校范文" extra="上传一份本校的优秀范例,会和系统范本一起给老师参考">
          <Upload
            maxCount={1}
            beforeUpload={(f) => {
              setSample(f.name);
              return false;
            }}
            onRemove={() => setSample(undefined)}
            fileList={sample ? [{ uid: '1', name: sample, status: 'done' }] : []}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
        </Form.Item>
        <div className="text-xs text-slate-400">
          关联评价指标:{template?.indicators.map((id) => `${id} ${indicatorName(id)}`).join('、')}(指标关系由评价体系决定,不在这里修改)
        </div>
      </Form>
    </Drawer>
  );
}
