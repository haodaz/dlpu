import { redirect } from 'next/navigation';

// 外部数据接入统一收口到「数据上传 → 数据源接入」
export default function ExternalDataPage() {
  redirect('/admin/data-sources');
}
