'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Tooltip } from 'antd';
import { SafetyCertificateFilled, HistoryOutlined, RiseOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import type { IndustryReport, SignalKind, Claim, HistoryMark, ReportDelta, Source, PolicyItem } from '@/lib/industry-report/types';

// 产业分析报告(产业分析报告页、教师白皮书工具共用)
// 版式:在线 PDF——A4 纸张、页眉页码、研究报告体例(成段正文、三线表、图表编号、资料来源、上标引注),可下载 PDF / Word
// 可解释:每章标注信号类型;引注可点击溯源;正文中未核验的数字标红;专家逐章审核并回流知识库

const REVIEW_KEY = 'industry_report_review';

export const KIND_META: Record<SignalKind, { label: string; cls: string; tip: string }> = {
  STRONG: { label: '强信号 · 公式计算', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', tip: '数值由公开数据按附录公式计算,大模型不参与' },
  EXTRACTED: { label: 'AI 抽取 · 来源可核验', cls: 'bg-sky-50 text-sky-700 border-sky-200', tip: '大模型只从检索材料中抽取,每条都带来源编号;数值须在原文中逐字出现' },
  INTERPRETED: { label: 'AI 撰写 · 仅基于本报告数据', cls: 'bg-violet-50 text-violet-700 border-violet-200', tip: '只读取本报告各章的数据,不引入新数字;未能核验的数字标红' },
  WEAK: { label: '弱信号 · 置信度低', cls: 'bg-amber-50 text-amber-700 border-amber-200', tip: '无量化数据支撑,仅供专家参考' },
  SKIPPED: { label: '数据不足', cls: 'bg-slate-100 text-slate-500 border-slate-200', tip: '不以模型推断补齐' },
};

// 章节:review 为本章审核时回流知识库的条目类型(见 flywheel.markReviewed)
const CHAPTERS = [
  { key: 'industry', no: '第一章', title: '产业分析', review: ['policy', 'tech'] as string[] },
  { key: 'chain', no: '第二章', title: '产业链图谱分析', review: ['chain'] },
  { key: 'talent', no: '第三章', title: '产业人才需求分析', review: ['chain'] },
  { key: 'insight', no: '第四章', title: '发展研判与专业建设建议', review: ['weak'] },
] as const;

export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

const LEVEL_ORDER: PolicyItem['level'][] = ['国家级', '部委级', '省级', '市级', '区县级'];
const dateText = (iso: string) => new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

// ---------- 报告 ----------
export function ReportView({ report }: { report: IndustryReport }) {
  const reviewKey = `${REVIEW_KEY}:${report.generatedAt}`;
  const [review, setReview] = useState<Record<string, boolean>>({});
  const docRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReview(readJSON<Record<string, boolean>>(reviewKey) ?? {});
  }, [reviewKey]);
  const toggle = (k: string, v: boolean) => {
    const next = { ...review, [k]: v };
    setReview(next);
    writeJSON(reviewKey, next);
    // 审核结果回流知识库:某类条目所在的章节都审核过,才把它标为已审核
    if (report.runId) {
      const kinds = ['policy', 'chain', 'tech', 'weak'].filter((kind) => {
        const chs = CHAPTERS.filter((c) => (c.review as readonly string[]).includes(kind));
        return chs.length > 0 && chs.every((c) => next[c.key]);
      });
      fetch('/api/industry-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: report.runId, chapters: kinds }),
      }).catch(() => {});
    }
  };
  const reviewedCount = CHAPTERS.filter((c) => review[c.key]).length;
  const srcMap = useMemo(() => new Map(report.sources.map((s) => [s.id, s])), [report.sources]);
  const title = `${report.region}${report.industry}产业分析报告`;
  const r = report.regional;
  const n = report.narrative;
  const ext = report.ext;
  const legacy = !r || !n || !ext;
  // 上市公司研发:全国代表性(扩展章)+ 本省(区域画像),同名去重
  const listedAll = [
    ...(ext?.nationalListed ?? []).map((x) => ({ ...x, scope: '全国' })),
    ...(r?.listed ?? []).map((x) => ({ ...x, scope: r?.province ?? '本省' })),
  ].filter((x, i, a) => a.findIndex((y) => y.company === x.company) === i);
  // 产业链细分表:只列有细分行业或全国企业的环节(历史沉淀的旧环节没有这两项)
  const detailNodes = report.chain.nodes.filter((x) => x.industries?.length || x.national?.length);
  const tableNodes = detailNodes.length ? detailNodes : report.chain.nodes;
  // 关键岗位表:扩展章的关键岗位优先,旧报告退回区域画像岗位
  const keyRows = ext?.keyJobs.length
    ? ext.keyJobs.map((j) => ({ title: j.title, salary: j.salary, skills: j.skills, companies: j.companies, src: j.src }))
    : (r?.jobs ?? []).map((j) => ({ title: j.title, salary: j.salary, skills: j.skills, companies: j.city ? [j.city] : [], src: j.src }));

  const downloadPdf = () => {
    const prev = document.title;
    document.title = title; // 浏览器「另存为 PDF」时的默认文件名
    window.print();
    setTimeout(() => (document.title = prev), 500);
  };
  const downloadWord = () => {
    if (!docRef.current) return;
    exportWord(docRef.current, title);
  };

  const Cite = ({ ids }: { ids: number[] }) => <CiteMarks ids={ids} srcMap={srcMap} />;
  const chapterProps = (key: (typeof CHAPTERS)[number]['key']) => ({
    reviewed: !!review[key],
    onReview: (v: boolean) => toggle(key, v),
  });
  let page = 2; // 封面不编页码,摘要页为第 1 页之后递增
  const nextPage = () => page++;

  return (
    <div className="report-desk">
      {/* 工具条 */}
      <div className="no-print sticky top-[64px] z-20 mb-4 flex items-center gap-3 flex-wrap rounded-xl bg-white/90 backdrop-blur border border-slate-200 px-4 py-2.5 shadow-sm">
        <span className="font-bold text-slate-800">{title}</span>
        <span className="text-xs text-slate-400">
          {dateText(report.generatedAt)} · 引用来源 {report.sources.length} 条 ·{' '}
          {reviewedCount === CHAPTERS.length ? (
            <span className="text-emerald-600 font-bold">
              <SafetyCertificateFilled /> 经专家审核校正
            </span>
          ) : (
            `专家审核 ${reviewedCount}/${CHAPTERS.length}`
          )}
        </span>
        <div className="ml-auto flex gap-2">
          <Button icon={<FilePdfOutlined />} onClick={downloadPdf}>
            下载 PDF
          </Button>
          <Tooltip title="可编辑的 Word 文档,方便学校修改后作为上报材料">
            <Button type="primary" icon={<FileWordOutlined />} onClick={downloadWord}>
              下载 Word
            </Button>
          </Tooltip>
        </div>
      </div>
      {legacy && (
        <div className="no-print mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          这是旧版报告,缺少部分章节(全国上市公司研发、重点企业介绍、关键岗位详情、人才供需)。点「更新报告」重新生成即可得到三章结构的完整版本。
        </div>
      )}
      {report.delta && (
        <div className="no-print mb-4">
          <DeltaPanel delta={report.delta} />
        </div>
      )}

      <div ref={docRef} className="paper-doc" data-spec="ir-paper">
        {/* 封面 */}
        <section className="paper paper-cover">
          <div className="cover-band" />
          <div className="mt-28">
            <div className="text-[13px] tracking-[0.3em] text-slate-500">产业研究报告</div>
            <h1 className="doc-title">
              {report.region}
              <br />
              {report.industry}产业分析报告
            </h1>
            <div className="text-[15px] text-slate-600 mt-4">面向「{report.major || '相关专业'}」专业建设</div>
          </div>
          <div className="cover-meta">
            <div>报告日期:{dateText(report.generatedAt)}</div>
            <div>研究区域:{report.region}</div>
            <div>
              数据基础:联网检索与公开资料 {report.sources.filter((s) => s.origin === 'web').length} 条 · 平方数据 {report.sources.filter((s) => s.origin === 'pingfang').length} 条
              {r && r.kind !== 'SKIPPED' ? ` · 区域产业画像(${r.origin === 'base' ? '预查底库' : '本次现查'})` : ''}
            </div>
            <div>生成方式:数值按公式计算或从原文逐字抽取,文字由大模型 {report.model} 仅依据本报告数据撰写</div>
          </div>
          <div className="cover-foot">方略一答 · 专业建设智能诊断</div>
        </section>

        {/* 摘要与目录 */}
        <Sheet page={1} header={title} section="摘要">
          <h2 className="doc-h2">核心观点</h2>
          <ol className="key-points">
            {report.insight.summary.map((c, i) => (
              <li key={i}>
                <Rich text={c.text} bad={c.unverifiedNumbers} srcMap={srcMap} />
              </li>
            ))}
          </ol>
          <h2 className="doc-h2 mt-10">目录</h2>
          <ol className="toc">
            {CHAPTERS.map((c) => (
              <li key={c.key}>
                <span>
                  {c.no} {c.title}
                </span>
                <i />
              </li>
            ))}
            <li>
              <span>附录 方法说明与参考来源</span>
              <i />
            </li>
          </ol>
          <p className="doc-note mt-8">
            阅读说明:正文上标数字为参考来源编号,可在附录中查到原文链接;标红数字为程序未能在本报告数据中核对到的数字,请专家复核。各章标注的信号类型说明该章数据如何产生。
          </p>
        </Sheet>

        {/* 第一章 产业分析 */}
        <Sheet page={nextPage()} header={title} section="第一章 产业分析">
          <ChapterHead no="第一章" title="产业分析" kind={r?.kind ?? report.policy.kind} {...chapterProps('industry')} />
          <h3 className="doc-h3">一、产业发展概况</h3>
          <Paras claims={n?.overview} srcMap={srcMap} />
          {r && r.scale.length > 0 && (
            <>
              <Caption no="表 1-1" title={`${r.province}${r.industry}主要规模指标`} />
              <table className="t3">
                <thead>
                  <tr>
                    <th>指标</th>
                    <th>范围</th>
                    <th className="num">数值</th>
                    <th>年份</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {r.scale.map((x, i) => (
                    <tr key={i}>
                      <td>{x.metric}</td>
                      <td>{x.scope}</td>
                      <td className="num">
                        {x.value}
                        {x.unit && !x.value.includes(x.unit) ? x.unit : ''}
                      </td>
                      <td>{x.year || '—'}</td>
                      <td>
                        <Cite ids={x.src} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine />
            </>
          )}
          {r && r.segments.length > 0 && (
            <>
              <Caption no="图 1-1" title="重点细分方向" />
              <div className="seg-grid">
                {r.segments.map((x) => (
                  <div key={x.name} className="seg">
                    <b>{x.name}</b>
                    <span>
                      {x.desc}
                      <Cite ids={x.src} />
                    </span>
                  </div>
                ))}
              </div>
              <SourceLine />
            </>
          )}

          <h3 className="doc-h3">二、政策环境</h3>
          <Paras claims={n?.policy} srcMap={srcMap} />
          {report.policy.byYear.length > 0 && report.policy.items.length > 0 && (
            <>
              <Caption no="图 1-2" title="政策层级加权得分的年度分布" />
              <figure className="chart word-skip">
                <div className="bars">
                  {report.policy.byYear.map((y) => {
                    const max = Math.max(...report.policy.byYear.map((x) => x.weighted), 1);
                    return (
                      <div key={y.year} className="bar-col">
                        <span className="bar-val">{y.weighted}</span>
                        <div className="bar" style={{ height: `${(y.weighted / max) * 100}%` }} />
                        <span className="bar-lab">
                          {y.year}
                          <br />
                          {y.density} 条
                        </span>
                      </div>
                    );
                  })}
                </div>
              </figure>
              <table className="t3 word-only">
                <thead>
                  <tr>
                    <th>年份</th>
                    <th className="num">政策数</th>
                    <th className="num">加权得分</th>
                  </tr>
                </thead>
                <tbody>
                  {report.policy.byYear.map((y) => (
                    <tr key={y.year}>
                      <td>{y.year}</td>
                      <td className="num">{y.density}</td>
                      <td className="num">{y.weighted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine text={`政策力度按国家级 5 / 部委级 4 / 省级 3 / 市级 2 / 区县级 1 加权;政策加速度 ${report.policy.acceleration === null ? '样本不足,不计算' : `${report.policy.acceleration}%`}`} />
              <Caption no="表 1-2" title="国家—部委—本省政策导向" />
              <table className="t3">
                <thead>
                  <tr>
                    <th style={{ width: 64 }}>层级</th>
                    <th>政策与导向</th>
                    <th style={{ width: 48 }}>年份</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVEL_ORDER.flatMap((lv) =>
                    report.policy.items
                      .filter((p) => p.level === lv)
                      .sort((a, b) => b.year - a.year)
                      .map((p, i, arr) => (
                        <tr key={p.name}>
                          {i === 0 && (
                            <td rowSpan={arr.length} className="lv">
                              {lv}
                            </td>
                          )}
                          <td>
                            <div className="font-semibold">
                              《{p.name.replace(/[《》]/g, '')}》<span className="text-slate-500 font-normal">· {p.issuer}</span>
                              <Cite ids={[p.sourceId]} />
                              <HistoryTag h={p.history} />
                            </div>
                            {p.gist && <div className="gist">{p.gist}</div>}
                          </td>
                          <td>{p.year}</td>
                        </tr>
                      )),
                  )}
                </tbody>
              </table>
              <SourceLine text={report.policy.note} />
            </>
          )}
        </Sheet>

        <Sheet page={nextPage()} header={title} section="第一章 产业分析">
          <h3 className="doc-h3">三、资本与创新投入</h3>
          <Paras claims={n?.capital} srcMap={srcMap} />
          {listedAll.length > 0 && (
            <>
              <Caption no="表 1-3" title="代表性上市公司研发投入" />
              <table className="t3">
                <thead>
                  <tr>
                    <th>公司</th>
                    <th>证券代码</th>
                    <th>范围</th>
                    <th className="num">研发费用</th>
                    <th className="num">占营收比</th>
                    <th>年份</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {listedAll.map((x) => (
                    <tr key={x.company}>
                      <td className="font-semibold">{x.company}</td>
                      <td>{x.code || '—'}</td>
                      <td>{x.scope}</td>
                      <td className="num">{x.rdExpense || '—'}</td>
                      <td className="num">{x.rdRatio || '—'}</td>
                      <td>{x.year || '—'}</td>
                      <td>
                        <Cite ids={x.src} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine text="上市公司年报及公开报道,方略一答整理;不限本省,仅列出研发数据能在原文中核对到的公司" />
            </>
          )}
          {r && r.financing.length > 0 && (
            <>
              <Caption no="表 1-4" title="投融资与重大项目" />
              <table className="t3">
                <thead>
                  <tr>
                    <th>主体</th>
                    <th>事件</th>
                    <th className="num">金额</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {r.financing.map((x, i) => (
                    <tr key={i}>
                      <td className="font-semibold">{x.company || '—'}</td>
                      <td>
                        {x.event}
                        <Cite ids={x.src} />
                      </td>
                      <td className="num">{x.amount || '—'}</td>
                      <td>{x.date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine />
            </>
          )}
          {report.tech.directions.length > 0 && (
            <>
              <Caption no="表 1-5" title="技术方向研究热度(补充参考)" />
              <table className="t3 compact">
                <thead>
                  <tr>
                    <th>技术方向</th>
                    {report.tech.years.map((y) => (
                      <th key={y} className="num">
                        {y}
                      </th>
                    ))}
                    <th className="num">同比</th>
                    <th className="num">CAGR</th>
                    <th>阶段</th>
                  </tr>
                </thead>
                <tbody>
                  {report.tech.directions.map((d) => (
                    <tr key={d.name}>
                      <td>
                        <a href={d.queryUrl} target="_blank" rel="noreferrer" className="doc-link">
                          {d.name}
                        </a>
                      </td>
                      {d.counts.map((c) => (
                        <td key={c.year} className="num">
                          {c.count.toLocaleString()}
                        </td>
                      ))}
                      <td className={`num ${d.yoy !== null && d.yoy < 0 ? 'text-red-600' : ''}`}>{d.yoy === null ? '—' : `${d.yoy}%`}</td>
                      <td className="num">{d.cagr === null ? '—' : `${d.cagr}%`}</td>
                      <td>
                        <Tooltip title={`判定依据:${d.stageRule}`}>
                          <span>{d.stage}</span>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine text="OpenAlex 年度论文数(仅统计完整年份),增长指标按附录公式计算;论文热度反映学术关注度,仅作技术方向的补充参考" />
            </>
          )}
          <h3 className="doc-h3">四、产业发展态势总结</h3>
          <Paras claims={n?.trend ?? report.insight.summary} srcMap={srcMap} />
        </Sheet>

        {/* 第二章 产业链图谱分析 */}
        <Sheet page={nextPage()} header={title} section="第二章 产业链图谱分析">
          <ChapterHead no="第二章" title="产业链图谱分析" kind={report.chain.kind} {...chapterProps('chain')} />
          <h3 className="doc-h3">一、产业链分析</h3>
          <Paras claims={n?.chain} srcMap={srcMap} />
          {report.chain.nodes.length > 0 && (
            <>
              <Caption no="图 2-1" title={`${report.industry}产业链图谱`} />
              <div className="chain">
                {(['上游', '中游', '下游'] as const).map((lv) => (
                  <div key={lv} className="chain-col">
                    <div className="chain-h">{lv}</div>
                    {report.chain.nodes
                      .filter((x) => x.level === lv)
                      .map((x) => (
                        <div key={x.node} className="chain-node">
                          <b>
                            {x.node}
                            <Cite ids={x.sourceIds.slice(0, 2)} />
                            <HistoryTag h={x.history} />
                          </b>
                          {!!x.industries?.length && <span>{x.industries.join(' · ')}</span>}
                        </div>
                      ))}
                    {!report.chain.nodes.some((x) => x.level === lv) && <div className="chain-node text-slate-400">资料中未提及</div>}
                  </div>
                ))}
              </div>
              <SourceLine />
              <Caption no="表 2-1" title="产业链各环节细分行业与全国代表性企业" />
              <table className="t3">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>环节</th>
                    <th style={{ width: 120 }}>细分领域</th>
                    <th>包含的行业 / 产品</th>
                    <th>全国代表性企业</th>
                  </tr>
                </thead>
                <tbody>
                  {(['上游', '中游', '下游'] as const).flatMap((lv) =>
                    tableNodes
                      .filter((x) => x.level === lv)
                      .map((x, i, arr) => (
                        <tr key={x.node}>
                          {i === 0 && (
                            <td rowSpan={arr.length} className="lv">
                              {lv}
                            </td>
                          )}
                          <td className="font-semibold">
                            {x.node}
                            <Cite ids={x.sourceIds.slice(0, 2)} />
                          </td>
                          <td>{x.industries?.join('、') || '—'}</td>
                          <td>{x.national?.join('、') || '—'}</td>
                        </tr>
                      )),
                  )}
                </tbody>
              </table>
              <SourceLine />
            </>
          )}
        </Sheet>

        <Sheet page={nextPage()} header={title} section="第二章 产业链图谱分析">
          <h3 className="doc-h3">二、区域产业布局</h3>
          <Paras claims={n?.structure} srcMap={srcMap} />
          {report.chain.nodes.some((x) => x.companies.length) && (
            <>
              <Caption no="表 2-2" title={`${report.region}在产业链各环节的布局与企业`} />
              <table className="t3">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>环节</th>
                    <th style={{ width: 120 }}>细分领域</th>
                    <th>本地企业</th>
                  </tr>
                </thead>
                <tbody>
                  {report.chain.nodes
                    .filter((x) => x.companies.length)
                    .map((x) => (
                      <tr key={x.node}>
                        <td className="lv">{x.level}</td>
                        <td className="font-semibold">{x.node}</td>
                        <td>{x.companies.join('、')}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <SourceLine />
            </>
          )}
          {r && r.cities.length > 0 && (
            <>
              <Caption no="表 2-3" title={`${r.province}${r.industry}企业的城市分布`} />
              <table className="t3">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>城市</th>
                    <th>产业侧重</th>
                    <th>代表企业</th>
                  </tr>
                </thead>
                <tbody>
                  {r.cities.map((x) => (
                    <tr key={x.city}>
                      <td className="font-semibold">{x.city}</td>
                      <td>
                        {x.focus}
                        <Cite ids={x.src} />
                      </td>
                      <td>{x.companies.join('、') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine />
            </>
          )}
          {report.chain.clusters?.length > 0 && (
            <p className="doc-note">
              区域产业集群(平方产业集群库):
              {report.chain.clusters.map((c, i) => (
                <React.Fragment key={c.name}>
                  {i > 0 && ';'}
                  {c.name}({c.type})
                  <Cite ids={[c.sourceId]} />
                </React.Fragment>
              ))}
            </p>
          )}
          {!!ext?.companies.length && (
            <>
              <h3 className="doc-h3">三、重点企业介绍</h3>
              {ext.companies.map((c, i) => (
                <div key={c.name} className="company">
                  <h4 className="doc-h4">
                    {i + 1}. {c.name}
                    <span className="company-meta">{[c.city, c.node].filter(Boolean).join(' · ')}</span>
                  </h4>
                  <p>
                    {c.intro}
                    <Cite ids={c.src} />
                  </p>
                </div>
              ))}
              <SourceLine text="企业介绍优先取自平方企业库,库中没有的企业取自公开资料" />
            </>
          )}
        </Sheet>

        {/* 第三章 产业人才需求分析 */}
        <Sheet page={nextPage()} header={title} section="第三章 产业人才需求分析">
          <ChapterHead no="第三章" title="产业人才需求分析" kind={ext?.keyJobs.length || r?.jobs.length || report.chain.jobs.length ? 'EXTRACTED' : 'SKIPPED'} {...chapterProps('talent')} />
          <h3 className="doc-h3">一、人才供需分析</h3>
          <Paras claims={n?.talent} srcMap={srcMap} />
          <FactBlock title="(一)人才紧缺情况" facts={[...(ext?.shortage ?? []), ...(r?.demand ?? [])]} Cite={Cite} />
          <FactBlock title="(二)岗位需求情况" facts={ext?.demand ?? []} Cite={Cite} empty="招聘平台岗位数量数据待接入(平方暂无招聘库),公开资料中未检索到可核验的全国 / 本省岗位数量。" />
          <h4 className="doc-h4">(三)人才供给情况</h4>
          <Paras claims={n?.supply} srcMap={srcMap} empty="公开资料中未检索到对应专业的开设与招生数据。" />
          {!!ext?.supply.length && (
            <blockquote className="quote">
              {ext.supply.map((d, i) => (
                <p key={i}>
                  {d.text}
                  <Cite ids={d.src} />
                </p>
              ))}
            </blockquote>
          )}
          {report.chain.skillFreq.length > 0 && (
            <>
              <Caption no="图 3-1" title={`岗位技能要求出现频次(样本 ${report.chain.jobs.length} 个岗位)`} />
              <figure className="chart word-skip">
                <div className="hbars">
                  {report.chain.skillFreq.slice(0, 10).map((s) => (
                    <div key={s.skill} className="hbar">
                      <span className="hbar-lab">{s.skill}</span>
                      <div className="hbar-track">
                        <div style={{ width: `${(s.count / report.chain.skillFreq[0].count) * 100}%` }} />
                      </div>
                      <span className="hbar-val">{s.count}</span>
                    </div>
                  ))}
                </div>
              </figure>
              <table className="t3 word-only">
                <tbody>
                  {report.chain.skillFreq.slice(0, 10).map((s) => (
                    <tr key={s.skill}>
                      <td>{s.skill}</td>
                      <td className="num">{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine text="按岗位计数:同一岗位多次提到同一技能只计一次" />
            </>
          )}
        </Sheet>

        <Sheet page={nextPage()} header={title} section="第三章 产业人才需求分析">
          <h3 className="doc-h3">二、关键岗位清单</h3>
          {keyRows.length > 0 ? (
            <>
              <Caption no="表 3-1" title="关键岗位、薪资与技能要求" />
              <table className="t3">
                <thead>
                  <tr>
                    <th>岗位</th>
                    <th>薪资</th>
                    <th>技能要求</th>
                    <th>代表性企业</th>
                  </tr>
                </thead>
                <tbody>
                  {keyRows.map((j, i) => (
                    <tr key={i}>
                      <td className="font-semibold">
                        {j.title}
                        <Cite ids={j.src} />
                      </td>
                      <td>{j.salary || '—'}</td>
                      <td>{j.skills.join('、') || '—'}</td>
                      <td>{j.companies.join('、') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceLine text="岗位介绍与分年限月薪优先取自平方职业库,其余取自招聘信息与公开报道;薪资照录原文口径" />
            </>
          ) : (
            <p className="doc-note">公开资料中未检索到可核验的关键岗位信息。</p>
          )}
          {ext?.keyJobs.map((j, i) => (
            <div key={j.title} className="job">
              <h4 className="doc-h4">
                ({i + 1}){j.title}
                {j.occupation && <span className="company-meta">对应平方职业库:{j.occupation}</span>}
              </h4>
              <dl className="job-dl">
                <dt>岗位介绍</dt>
                <dd>
                  {j.intro}
                  <Cite ids={j.src} />
                </dd>
                {j.abilities.length > 0 && (
                  <>
                    <dt>所需能力</dt>
                    <dd>{j.abilities.join(';')}</dd>
                  </>
                )}
                {j.skills.length > 0 && (
                  <>
                    <dt>技能清单</dt>
                    <dd>{j.skills.join('、')}</dd>
                  </>
                )}
                <dt>薪资范围</dt>
                <dd>{j.salary || '公开资料未注明'}</dd>
                {j.companies.length > 0 && (
                  <>
                    <dt>代表性企业</dt>
                    <dd>{j.companies.join('、')}</dd>
                  </>
                )}
              </dl>
            </div>
          ))}
        </Sheet>

        {/* 第四章 研判与建议 */}
        <Sheet page={nextPage()} header={title} section="第四章 发展研判与专业建设建议">
          <ChapterHead no="第四章" title="发展研判与专业建设建议" kind={report.insight.kind} {...chapterProps('insight')} />
          <h3 className="doc-h3">一、发展方向研判</h3>
          <Paras claims={report.insight.summary} srcMap={srcMap} />
          <h3 className="doc-h3">二、对「{report.major || '相关专业'}」建设的建议</h3>
          <ol className="advice">
            {report.insight.majorAdvice.map((c, i) => (
              <li key={i}>
                <Rich text={c.text} bad={c.unverifiedNumbers} srcMap={srcMap} />
              </li>
            ))}
          </ol>
          {report.weak.signals.length > 0 && (
            <>
              <h3 className="doc-h3">三、值得关注的早期信号</h3>
              <p className="doc-note">以下方向近期报道较多,但尚无量化数据支撑,置信度低,仅供专家参考。</p>
              <ul className="weak">
                {report.weak.signals.map((s) => (
                  <li key={s.topic}>
                    <b>{s.topic}</b>:{s.evidence}
                    <Cite ids={s.sourceIds} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Sheet>

        {/* 附录 */}
        <Sheet page={nextPage()} header={title} section="附录" spec="ir-appendix">
          <h2 className="doc-h2">附录 方法说明与参考来源</h2>
          <h3 className="doc-h3">(一)方法说明</h3>
          <table className="t3 method">
            <tbody>
              {report.method.map((m) => (
                <tr key={m.label}>
                  <td className="font-semibold" style={{ width: 84 }}>
                    {m.label}
                  </td>
                  <td>{m.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="doc-h3">(二)参考来源</h3>
          <ol className="refs">
            {report.sources.map((s) => (
              <li key={s.id} id={`ref-${s.id}`}>
                <span className="ref-no">[{s.id}]</span>
                {s.origin === 'pingfang' && <span className="ref-pf">平方</span>}
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="doc-link">
                    {s.title}
                  </a>
                ) : (
                  <span>{s.title}</span>
                )}
              </li>
            ))}
          </ol>
        </Sheet>
      </div>
    </div>
  );
}

// ---------- 版式组件 ----------
function Sheet({ page, header, section, spec, children }: { page: number; header: string; section: string; spec?: string; children: React.ReactNode }) {
  return (
    <section className="paper" data-spec={spec}>
      <header className="paper-head">
        <span>{header}</span>
        <span>{section}</span>
      </header>
      {children}
      <footer className="paper-foot">— {page} —</footer>
    </section>
  );
}

function ChapterHead({ no, title, kind, reviewed, onReview }: { no: string; title: string; kind: SignalKind; reviewed: boolean; onReview: (v: boolean) => void }) {
  const m = KIND_META[kind];
  return (
    <div className="chapter-head">
      <h2 className="doc-h2">
        {no} {title}
      </h2>
      <span className="no-print flex items-center gap-2 ml-auto">
        <Tooltip title={m.tip}>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${m.cls}`}>{m.label}</span>
        </Tooltip>
        <Checkbox checked={reviewed} onChange={(e) => onReview(e.target.checked)}>
          <span className="text-xs text-slate-500">专家已审核</span>
        </Checkbox>
      </span>
    </div>
  );
}

const Caption = ({ no, title }: { no: string; title: string }) => (
  <div className="caption">
    {no} {title}
  </div>
);

const SourceLine = ({ text }: { text?: string }) => <div className="src-line">资料来源:{text ?? '联网检索与公开资料,方略一答整理;上标为参考来源编号'}</div>;

function Paras({ claims, srcMap, empty }: { claims?: Claim[]; srcMap: Map<number, Source>; empty?: string }) {
  if (!claims?.length) return <p className="doc-note">{empty ?? '本节暂无正文(公开资料不足,或为旧版报告)。'}</p>;
  return (
    <div className="paras">
      {claims.map((c, i) => (
        <p key={i}>
          <Rich text={c.text} bad={c.unverifiedNumbers} srcMap={srcMap} />
          {c.unverifiedNumbers.length > 0 && <span className="no-print unverified">标红数字未能在本报告数据中逐字核对,请专家复核</span>}
        </p>
      ))}
    </div>
  );
}

function CiteMarks({ ids, srcMap }: { ids: number[]; srcMap: Map<number, Source> }) {
  const list = Array.from(new Set(ids)).filter((id) => srcMap.has(id));
  if (!list.length) return null;
  return (
    <sup className="cite">
      [
      {list.map((id, i) => {
        const s = srcMap.get(id)!;
        return (
          <React.Fragment key={id}>
            {i > 0 && ','}
            <Tooltip title={s.title}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {id}
                </a>
              ) : (
                <a href={`#ref-${id}`}>{id}</a>
              )}
            </Tooltip>
          </React.Fragment>
        );
      })}
      ]
    </sup>
  );
}

// 正文:[S12] 渲染为上标引注;未核验数字标红
function Rich({ text, bad, srcMap }: { text: string; bad: string[]; srcMap: Map<number, Source> }) {
  // 表格引用([T1] 等)是内部依据,纸面上不显示
  const parts = text.replace(/\s*\[T\d+\]/g, '').split(/((?:\s*\[S\d+\])+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const ids = [...part.matchAll(/\[S(\d+)\]/g)].map((m) => Number(m[1]));
        if (ids.length && !part.replace(/\s*\[S\d+\]/g, '').trim()) return <CiteMarks key={i} ids={ids} srcMap={srcMap} />;
        return <Highlighted key={i} text={part} bad={bad} />;
      })}
    </>
  );
}

function Highlighted({ text, bad }: { text: string; bad: string[] }) {
  if (!bad.length) return <>{text}</>;
  // 只匹配完整数字,避免 45 命中 45.4
  const re = new RegExp(`((?<![\\d.])(?:${bad.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\d.]))`, 'g');
  return (
    <>
      {text.split(re).map((part, i) =>
        bad.includes(part) ? (
          <mark key={i} className="unverified-num">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

// 历史沉淀标记:本次检索未命中、由知识库补回的条目
function HistoryTag({ h }: { h?: HistoryMark }) {
  if (!h) return null;
  return (
    <Tooltip title={`历史检索沉淀:累计出现 ${h.seenCount} 次,最近 ${new Date(h.lastSeen).toLocaleDateString('zh-CN')}${h.reviewed ? ',专家已审核' : ''}`}>
      <span className={`no-print ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold px-1 rounded border ${h.reviewed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
        <HistoryOutlined /> {h.reviewed ? '已审核沉淀' : '历史沉淀'}
      </span>
    </Tooltip>
  );
}

// 本次变化:与上一次同产业同地区报告的差值
function DeltaPanel({ delta }: { delta: ReportDelta }) {
  const first = !delta.baseAt;
  const groups = [
    { label: '新增政策', items: delta.newPolicies },
    { label: '新增产业链环节', items: delta.newNodes },
    { label: '新出现企业', items: delta.newCompanies },
    { label: '新增岗位', items: delta.newJobs },
  ];
  const recalled = delta.recalled.policies + delta.recalled.nodes + delta.recalled.jobs;
  return (
    <section data-spec="ir-delta" className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <RiseOutlined className="text-indigo-500" />
        <span className="font-bold text-slate-800">本次变化</span>
        <span className="text-xs text-slate-500">
          {first
            ? '首次检索该产业,已建立基线,下次将只检索变化'
            : `对比 ${new Date(delta.baseAt!).toLocaleDateString('zh-CN')} 的上一次报告 · ${delta.mode === 'incremental' ? `增量检索最近 ${delta.freshnessDays} 天` : '全量检索'}`}
        </span>
      </div>
      {!first && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {groups.map((g) => (
            <div key={g.label}>
              <span className="text-slate-500">{g.label}:</span>
              {g.items.length ? (
                <span className="text-slate-700">
                  {g.items.slice(0, 6).join('、')}
                  {g.items.length > 6 ? ` 等 ${g.items.length} 项` : ''}
                </span>
              ) : (
                <span className="text-slate-400">无</span>
              )}
            </div>
          ))}
          <div className="md:col-span-2">
            <span className="text-slate-500">技术方向阶段变化:</span>
            {delta.stageChanges.length ? <span className="text-slate-700">{delta.stageChanges.map((c) => `${c.name} ${c.from} → ${c.to}`).join(';')}</span> : <span className="text-slate-400">无</span>}
          </div>
        </div>
      )}
      <div className="text-xs text-slate-400 mt-2">
        从知识库补回历史条目 {recalled} 条 · 检索缓存命中 {delta.cache.searchHit}/{delta.cache.searchHit + delta.cache.searchMiss} · 论文统计缓存命中 {delta.cache.openalexHit}/
        {delta.cache.openalexHit + delta.cache.openalexMiss}
      </div>
    </section>
  );
}

// ---------- 导出 Word ----------
// 用 Word 能直接打开的 HTML 文档(.doc):保留标题层级、成段正文、三线表、图表编号与参考来源;
// 图形(柱状图等)换成同数据的表格,便于学校在 Word 里继续修改后上报
function exportWord(doc: HTMLElement, title: string) {
  const clone = doc.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print, .word-skip, .paper-head, .paper-foot, .cover-band').forEach((e) => e.remove());
  clone.querySelectorAll('.word-only').forEach((e) => e.classList.remove('word-only'));
  clone.querySelectorAll('.paper').forEach((e, i) => {
    if (i > 0) (e as HTMLElement).setAttribute('style', 'page-break-before:always');
  });
  const css = `
    body{font-family:"宋体",SimSun,serif;font-size:10.5pt;line-height:1.8;color:#111}
    h1{font-family:"黑体",SimHei,sans-serif;font-size:24pt;line-height:1.4;margin:120pt 0 12pt}
    h2{font-family:"黑体",SimHei,sans-serif;font-size:15pt;margin:18pt 0 8pt}
    h3{font-family:"黑体",SimHei,sans-serif;font-size:12pt;margin:12pt 0 6pt}
    h4{font-family:"黑体",SimHei,sans-serif;font-size:10.5pt;margin:10pt 0 4pt}
    dt{font-weight:bold;margin-top:4pt}dd{margin:0 0 2pt 2em}
    p{text-indent:2em;margin:0 0 6pt}
    .caption{font-family:"黑体",SimHei,sans-serif;font-size:10pt;text-align:center;margin:12pt 0 4pt}
    .src-line,.doc-note{font-size:9pt;color:#555;text-indent:0}
    table{border-collapse:collapse;width:100%;font-size:9pt;margin:4pt 0}
    thead th{border-top:1.5pt solid #000;border-bottom:.75pt solid #000;padding:3pt 4pt;text-align:left}
    tbody td{padding:3pt 4pt;vertical-align:top}
    tbody tr:last-child td{border-bottom:1.5pt solid #000}
    sup{font-size:7pt;color:#1f4e8c}
    a{color:#1f4e8c;text-decoration:none}
    .gist{color:#444}
    .seg{margin:0 0 4pt}
    .unverified-num{background:#fee2e2;color:#b91c1c}
  `;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page{size:21cm 29.7cm;margin:2.54cm 2.2cm}${css}</style></head>
<body>${clone.innerHTML}</body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${title}.doc`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// 原文陈述小节(人才紧缺 / 岗位需求):逐条引用原文,没有时说明缺口
function FactBlock({ title, facts, Cite, empty }: { title: string; facts: { text: string; src: number[] }[]; Cite: (p: { ids: number[] }) => React.ReactNode; empty?: string }) {
  return (
    <>
      <h4 className="doc-h4">{title}</h4>
      {facts.length ? (
        <blockquote className="quote">
          {facts.map((d, i) => (
            <p key={i}>
              {d.text}
              <Cite ids={d.src} />
            </p>
          ))}
        </blockquote>
      ) : (
        <p className="doc-note">{empty ?? '公开资料中未检索到可核验的相关陈述。'}</p>
      )}
    </>
  );
}
