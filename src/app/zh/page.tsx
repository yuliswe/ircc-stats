import type { Metadata } from 'next';
import { ReportRoot } from '@/components/report/ReportRoot';

export const metadata: Metadata = {
  title: 'IRCC 报告 2025',
  description:
    '某些国籍的申请人是否被不成比例地转介至安全筛查，数据来自 IRCC 依《信息获取法》公开的档案 1A-2025-08687。',
};

export default function ZhPage() {
  return <ReportRoot locale='zh' />;
}
