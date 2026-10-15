import React from 'react';
import { WarningOutlined } from '@ant-design/icons';

// 数据降级提示:后端数据库不可用、改用演示数据时显式告知用户
export default function DegradedBanner({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 mb-4">
      <WarningOutlined className="mt-0.5" />
      <span>{reason}</span>
    </div>
  );
}
