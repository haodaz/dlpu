'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { CloseOutlined, CodeOutlined, LeftOutlined, PlayCircleFilled, RedoOutlined, RightOutlined } from '@ant-design/icons';
import { SPEC_NOTES, LAYER_NAME, type SpecLayer } from './specNotes';
import { STORY, STORY_ACTS } from './storyline';
import { useDataImported, useResolvedIssues } from '@/lib/diagnosis-state';
import type { Role } from '@/components/AppLayout';

/**
 * 产品方案模式 · 按模块讲解(移植自 yida-company 的 SpecMode,源自 zhijipro reference/web/spec.js)
 * 开启后,当前页面上「有说明的模块」各画一个虚线框;点哪个框才展开哪个模块的说明,面板停靠在模块对侧、不遮挡它。
 * 分层:框架(侧栏、顶栏)/ 本页面。
 * 模块 = 页面元素上的 data-spec="id";文案在 specNotes.ts。改设计时同步改那里。
 * 故事线(storyline.ts):按会议叙事一步步点着讲,每一步切角色 / 跳页面 / 切换有无数据,并高亮这一页要看的模块。
 */
interface Live {
  id: string;
  el: Element;
  rect: DOMRect;
}
interface JNote {
  id: string;
  ctx: string;
  text: string;
  at: string;
}
const SEEN_KEY = 'dalian.spec.seen';
const JOURNAL_KEY = 'dalian.spec.journal';

const load = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* 忽略 */
  }
};

export default function SpecMode({ role, onRole }: { role: Role; onRole: (r: Role) => void }) {
  const path = usePathname();
  const router = useRouter();
  const [imported, setImported] = useDataImported();
  const { reset: resetIssues } = useResolvedIssues();
  const [storyIdx, setStoryIdx] = useState<number | null>(null);
  const [tech, setTech] = useState(false);
  const scrolledFor = useRef<string | null>(null);
  const step = storyIdx === null ? null : STORY[storyIdx];
  const focusId = step?.focus ?? null;
  const [on, setOn] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [layerPick, setLayerPick] = useState<SpecLayer | null>(null);
  const [live, setLive] = useState<Live[]>([]);
  const [avail, setAvail] = useState<SpecLayer[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [fresh, setFresh] = useState(0);
  const [journal, setJournal] = useState<JNote[]>([]);
  const [draft, setDraft] = useState('');
  const [mounted, setMounted] = useState(false);
  const liveRef = useRef<Live[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setSeen(load(SEEN_KEY, []));
    setJournal(load(JOURNAL_KEY, []));
  }, []);

  const scan = useCallback(() => {
    const els = [...document.querySelectorAll('[data-spec]')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    const present = new Set<SpecLayer>();
    const byId = new Map<string, Element>();
    for (const e of els) {
      const id = e.getAttribute('data-spec')!;
      const n = SPEC_NOTES[id];
      if (!n) continue;
      present.add(n.layer);
      byId.set(id, e);
    }
    const layers = (['page', 'frame'] as SpecLayer[]).filter((l) => present.has(l));
    // 默认讲「本页面」,页面没有说明时讲「框架」
    const cur = layerPick && layers.includes(layerPick) ? layerPick : layers[0] ?? 'frame';
    const out: Live[] = [];
    for (const [id, el] of byId) {
      if (SPEC_NOTES[id].layer !== cur) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      out.push({ id, el, rect });
    }
    out.sort((x, y) => y.rect.width * y.rect.height - x.rect.width * x.rect.height); // 大框在下,小框在上
    // 故事线:要看的模块出现后滚到顶栏下方(底部留给故事线播放条),每步只滚一次
    if (focusId && scrolledFor.current !== focusId && byId.has(focusId)) {
      scrolledFor.current = focusId;
      const top = byId.get(focusId)!.getBoundingClientRect().top + scrollY - 88;
      scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
    liveRef.current = out;
    setLive(out);
    setAvail(layers);
    const seenNow = load<string[]>(SEEN_KEY, []);
    setFresh([...byId.keys()].filter((id) => !seenNow.includes(id)).length);
  }, [layerPick, focusId]);

  // 开着时持续刷新(页面内容在动),关着时低频计算「新模块」提示
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    scan();
    const t = setInterval(scan, on ? 400 : 1500);
    const onScroll = () => on && scan();
    addEventListener('resize', scan);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      clearInterval(t);
      removeEventListener('resize', scan);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [scan, on]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSel(null);
    setLayerPick(focusId ? SPEC_NOTES[focusId]?.layer ?? null : null);
  }, [path, focusId]);
  useEffect(() => {
    document.body.classList.toggle('spec-on', on);
  }, [on]);

  // 框不拦截滚动;点击在捕获阶段判定落在哪个模块(取最小的那个)
  useEffect(() => {
    if (!on) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest?.('#spec-panel, #spec-btn, #spec-hint, #spec-story')) return;
      e.preventDefault();
      e.stopPropagation();
      const hit = liveRef.current
        .filter((r) => {
          const b = r.el.getBoundingClientRect();
          return e.clientX >= b.left - 5 && e.clientX <= b.right + 5 && e.clientY >= b.top - 5 && e.clientY <= b.bottom + 5;
        })
        .pop();
      setSel(hit ? hit.id : null);
      if (hit) {
        const s = Array.from(new Set([...load<string[]>(SEEN_KEY, []), hit.id]));
        save(SEEN_KEY, s);
        setSeen(s);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sel) setSel(null);
        else if (storyIdx !== null) setStoryIdx(null);
        else setOn(false);
      }
    };
    document.addEventListener('click', onClick, true);
    addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick, true);
      removeEventListener('keydown', onKey);
    };
  }, [on, sel, storyIdx]);

  // 进入故事线的某一步:切角色 / 切换有无数据 / 跳页面,高亮要看的模块
  const goStep = (i: number) => {
    const st = STORY[i];
    setOn(true);
    setSel(null);
    setStoryIdx(i);
    scrolledFor.current = null;
    if (st.role !== role) onRole(st.role);
    if (st.imported !== undefined && st.imported !== imported) setImported(st.imported);
    if (location.pathname + location.search !== st.path) router.push(st.path);
  };
  const resetDemo = () => {
    if (!confirm('把演示数据恢复到初始状态(未导入数据、整改任务全部待处理),从第 1 步重新开始?')) return;
    resetIssues();
    goStep(0);
  };

  const cur = layerPick && avail.includes(layerPick) ? layerPick : avail[0] ?? 'frame';
  const selLive = live.find((r) => r.id === sel);
  const note = sel ? SPEC_NOTES[sel] : null;
  const notes = journal.filter((j) => j.ctx === sel);
  const right = selLive ? innerWidth - selLive.rect.right >= selLive.rect.left : true;

  const addNote = () => {
    if (!draft.trim() || !sel) return;
    const j = [...journal, { id: Math.random().toString(36).slice(2), ctx: sel, text: draft.trim(), at: new Date().toLocaleString('zh-CN', { hour12: false }) }];
    setJournal(j);
    save(JOURNAL_KEY, j);
    setDraft('');
  };

  return (
    <>
      <button
        id="spec-btn"
        onClick={() => {
          setOn((o) => !o);
          setSel(null);
          setLayerPick(null);
        }}
        className={`no-print inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
          on ? 'bg-[#6055f5] text-white border-transparent' : fresh > 0 ? 'bg-amber-50 text-amber-700 border-amber-300 spec-glow' : 'bg-white text-[#6055f5] border-[rgba(96,85,245,.25)]'
        }`}
        title={on ? '退出产品方案模式(Esc)' : '按模块查看这一页的使用说明'}
      >
        <i className={`w-2 h-2 rounded-full ${on ? 'bg-white' : fresh > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} />
        产品方案模式
        {!on && fresh > 0 && <b className="min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[11px] leading-[18px] px-1">{fresh}</b>}
      </button>

      {mounted &&
        on &&
        createPortal(
          <>
            {live.map((r) => {
              const b = r.el.getBoundingClientRect();
              if (b.bottom < 0 || b.top > innerHeight) return null;
              const top = Math.max(2, b.top - 5);
              return (
                <div
                  key={r.id}
                  className={`spec-frame ${r.id === 'sidebar' ? 'side' : ''} ${
                    r.id === sel ? 'sel' : r.id === focusId && !sel ? 'sel story' : sel || focusId ? 'dim' : ''
                  } ${seen.includes(r.id) ? '' : 'new'}`}
                  style={{ left: b.left - 5, top, width: b.width + 10, height: Math.min(b.height + 10, innerHeight - top - 2) }}
                >
                  <span>
                    {SPEC_NOTES[r.id].label}
                    {!seen.includes(r.id) && <i />}
                  </span>
                </div>
              );
            })}
            {!sel && storyIdx === null && (
              <div
                id="spec-hint"
                className="fixed left-1/2 -translate-x-1/2 bottom-5 z-[2100] rounded-full bg-white/95 shadow-[0_8px_28px_rgba(30,30,90,.18)] border border-[rgba(96,85,245,.16)] px-4 py-2 text-[12.5px] text-slate-600 flex items-center gap-2"
              >
                <b className="text-[#6055f5]">产品方案模式</b>
                <span className="flex items-center gap-1">
                  {avail.map((l, i) => (
                    <React.Fragment key={l}>
                      {i > 0 && <i className="not-italic text-slate-300">|</i>}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLayerPick(l);
                        }}
                        className={`px-2 py-0.5 rounded-full ${l === cur ? 'bg-[#6055f5] text-white' : 'bg-[#f4f4fb] text-slate-600'}`}
                      >
                        {LAYER_NAME[l]}
                      </button>
                    </React.Fragment>
                  ))}
                </span>
                有 {live.length} 处说明 · 点虚线框查看 · Esc 退出
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goStep(0);
                  }}
                  className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6055f5] text-white font-semibold"
                >
                  <PlayCircleFilled /> 故事线演示
                </button>
              </div>
            )}
            {step && storyIdx !== null && (
              <div
                id="spec-story"
                className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[2150] w-[min(760px,calc(100vw-24px))] rounded-2xl bg-white/95 backdrop-blur border border-[rgba(96,85,245,.18)] shadow-[0_18px_50px_rgba(30,30,90,.22)] px-4 py-3 text-[12.5px]"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <b className="text-[#6055f5]">故事线</b>
                  <span className="px-2 py-0.5 rounded-full bg-[#eef2ff] text-[#4f46e5] font-semibold">
                    {step.act} · 第 {storyIdx + 1} / {STORY.length} 步
                  </span>
                  <span className="text-slate-400">{step.role === 'admin' ? '管理员视角' : '教师视角'}</span>
                  <button onClick={() => setStoryIdx(null)} className="ml-auto w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100" aria-label="退出故事线">
                    <CloseOutlined />
                  </button>
                </div>
                {/* 进度:按环节分组,点任意一格直接跳到那一步 */}
                <div className="flex gap-3 mt-2 flex-wrap">
                  {STORY_ACTS.map((act) => (
                    <div key={act} className="flex items-center gap-1" title={act}>
                      {STORY.map((s, i) =>
                        s.act === act ? (
                          <button
                            key={s.key}
                            title={s.title}
                            onClick={() => goStep(i)}
                            className={`h-1.5 rounded-full transition-all ${i === storyIdx ? 'w-6 bg-[#6055f5]' : i < storyIdx ? 'w-3.5 bg-[#a5a0fb]' : 'w-3.5 bg-[#e5e7f5] hover:bg-[#c7c4fb]'}`}
                          />
                        ) : null,
                      )}
                    </div>
                  ))}
                </div>
                <h4 className="m-0 mt-2.5 text-[15px] font-bold text-[#1e1b4b]">{step.title}</h4>
                <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-[#1e1b4b]">{step.cap}</p>
                {tech && <p className="m-0 mt-1.5 text-[12px] leading-relaxed text-slate-500 bg-[#f5f3ff] rounded-lg px-2.5 py-1.5">{step.tech}</p>}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <button
                    disabled={storyIdx === 0}
                    onClick={() => goStep(storyIdx - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                  >
                    <LeftOutlined /> 上一步
                  </button>
                  {storyIdx < STORY.length - 1 ? (
                    <button onClick={() => goStep(storyIdx + 1)} className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#6055f5] text-white font-semibold">
                      下一步:{STORY[storyIdx + 1].title} <RightOutlined />
                    </button>
                  ) : (
                    <button onClick={() => setStoryIdx(null)} className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#6055f5] text-white font-semibold">
                      演示完毕
                    </button>
                  )}
                  <button
                    onClick={() => focusId && setSel(focusId)}
                    className="px-3 py-1.5 rounded-lg bg-[#f4f4fb] text-[#4f46e5]"
                    title="展开这个模块的完整使用说明"
                  >
                    看模块说明
                  </button>
                  <button onClick={() => setTech((t) => !t)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f4f4fb] text-slate-600">
                    <CodeOutlined /> {tech ? '收起技术说明' : '技术说明'}
                  </button>
                  <button onClick={resetDemo} className="ml-auto inline-flex items-center gap-1 text-slate-400 hover:text-slate-600">
                    <RedoOutlined /> 重置演示
                  </button>
                </div>
              </div>
            )}
            {note && (
              <aside
                id="spec-panel"
                className="fixed top-3 bottom-3 z-[2200] bg-white rounded-[20px] shadow-[0_20px_70px_rgba(30,30,90,.28),0_0_0_1px_rgba(96,85,245,.12)] flex flex-col text-[13.5px] text-slate-700"
                style={{ width: Math.min(460, innerWidth - 24), right: right ? 12 : 'auto', left: right ? 'auto' : 12 }}
              >
                <header className="flex items-start gap-2.5 px-5 pt-4 pb-3 rounded-t-[20px]" style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
                  <div className="flex-1">
                    <small className="text-[#6055f5] font-semibold tracking-wider text-[11.5px]">
                      使用说明 · {LAYER_NAME[note.layer]} · {note.label}
                    </small>
                    <h2 className="m-0 mt-0.5 text-[18px] text-[#1e1b4b] leading-snug">{note.title}</h2>
                  </div>
                  <button onClick={() => setSel(null)} className="w-7 h-7 rounded-full bg-white text-slate-500 flex items-center justify-center shrink-0" aria-label="关闭">
                    <CloseOutlined />
                  </button>
                </header>
                <div className="flex-1 overflow-y-auto px-5 pb-6">
                  <p className="text-[14.5px] leading-[1.75] text-slate-800 mt-3 mb-1">{note.lead}</p>
                  {note.points.length > 0 && (
                    <>
                      <h3 className="text-[12.5px] text-[#6055f5] tracking-wide mt-5 mb-2">怎么用</h3>
                      <ol className="list-none m-0 p-0">
                        {note.points.map(([t, d], i) => (
                          <li key={i} className="flex gap-2.5 py-2 px-2 rounded-xl hover:bg-[#f7f6ff]">
                            <em className="not-italic shrink-0 w-[22px] h-[22px] rounded-full bg-[#6055f5] text-white text-[12px] font-bold flex items-center justify-center mt-0.5">{i + 1}</em>
                            <div>
                              <b className="block text-slate-900">{t}</b>
                              {d && <p className="m-0 mt-0.5 leading-[1.7] text-slate-600">{d}</p>}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                  {note.from && note.from.length > 0 && (
                    <>
                      <h3 className="text-[12.5px] text-[#6055f5] tracking-wide mt-5 mb-2">对应会议要求</h3>
                      <div className="border border-[#ececf5] rounded-xl overflow-hidden">
                        <div className="grid grid-cols-2 text-[12px] font-semibold">
                          <span className="px-3 py-1.5 bg-[#f8f8fc] text-slate-500">会议要求</span>
                          <span className="px-3 py-1.5 bg-[#f3f1ff] text-[#6055f5]">本页做法</span>
                        </div>
                        {note.from.map(([a, b], i) => (
                          <div key={i} className="grid grid-cols-2 border-t border-[#ececf5]">
                            <span className="px-3 py-2 leading-relaxed text-slate-500">{a}</span>
                            <span className="px-3 py-2 leading-relaxed text-slate-800 bg-[#fbfaff] border-l border-[#ececf5]">{b}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {note.impl.length > 0 && (
                    <>
                      <h3 className="text-[12.5px] text-[#6055f5] tracking-wide mt-5 mb-2">实现落点</h3>
                      <ul className="m-0 pl-4 leading-[1.8] text-slate-600 text-[12.5px]">
                        {note.impl.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <h3 className="text-[12.5px] text-[#6055f5] tracking-wide mt-5 mb-2">
                    设计手记 <small className="text-slate-400 font-normal">想到什么随手记(存在本机浏览器)</small>
                  </h3>
                  {notes.length ? (
                    notes.map((j) => (
                      <div key={j.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                        <p className="m-0 whitespace-pre-wrap leading-relaxed text-amber-950">{j.text}</p>
                        <small className="text-amber-700 text-[11px] flex">
                          {j.at}
                          <button
                            className="ml-auto underline"
                            onClick={() => {
                              const n = journal.filter((x) => x.id !== j.id);
                              setJournal(n);
                              save(JOURNAL_KEY, n);
                            }}
                          >
                            删除
                          </button>
                        </small>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-[12.5px] mb-2">这个模块还没有手记</div>
                  )}
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`关于「${note.label}」,想到什么记什么…`}
                      className="flex-1 h-[58px] border border-gray-200 rounded-lg px-2.5 py-2 text-[13px] resize-y outline-none focus:border-[#6055f5]"
                    />
                    <button onClick={addNote} className="bg-[#6055f5] text-white rounded-lg px-3.5 py-2 text-[13px] shrink-0">
                      记一条
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </>,
          document.body,
        )}
    </>
  );
}
