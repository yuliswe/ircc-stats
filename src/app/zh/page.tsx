import type { Metadata } from 'next';
import { ReportRoot } from '@/components/report/ReportRoot';

export const metadata: Metadata = {
  title: 'IRCC 报告 2025',
  description:
    '来自某些国家的申请人，是否被格外多地送去加拿大边境服务局（CBSA）和安全情报局（CSIS）接受安全审查？数据来自 IRCC 依《信息获取法》公开的档案 1A-2025-08687。',
};

export default function ZhPage() {
  return <ReportRoot locale='zh' />;
}
