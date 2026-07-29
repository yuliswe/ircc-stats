import type { Metadata } from 'next';
import { OpinionRoot } from '@/components/opinion/OpinionRoot';

export const metadata: Metadata = {
  title: 'IRCC 观点专栏：中国与印度',
  description:
    '一篇基于 IRCC ATIP 档案 1A-2025-08687 的数据评论：把中国与印度并排比较，追问对中国申请人来说被额外安全审查是否已成常态、这套审查的依据是否站得住、以及它换回了什么。',
};

export default function OpinionZhPage() {
  return <OpinionRoot locale='zh' />;
}
