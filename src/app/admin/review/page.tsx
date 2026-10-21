import { redirect } from 'next/navigation';

// 「回看与比较」已并入诊断分析:横向比较在诊断分析首页,纵向回看在具体专业的诊断页
export default function ReviewPage() {
  redirect('/admin');
}
