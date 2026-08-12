export function inferFactState(item: { title?: string, mismatchedFields?: string[], status?: string }) {
  let computedState = item.status || 'match';

  if (item.mismatchedFields && item.mismatchedFields.length > 0) {
    const criticalKeywords = ['院校', '学校', '公司', '企业', '机构', '作者', '论文', '雇主', '学历', '学位'];
    const isCriticalMismatch = item.mismatchedFields.some(field => 
      criticalKeywords.some(kw => field.includes(kw))
    );
    computedState = isCriticalMismatch ? 'mismatch' : 'manual_review';
  } else if (item.title && (!item.status || item.status === 'match')) {
    if (item.title.includes('不实') || item.title.includes('虚假')) computedState = 'mismatch';
    else if (item.title.includes('不符') || item.title.includes('异常') || item.title.includes('存疑') || item.title.includes('部分一致')) computedState = 'manual_review';
  }

  // If status was explicitly mismatch/manual_review, keep it, otherwise use our computed state
  if (item.status === 'mismatch' || item.status === 'manual_review') {
    return item.status;
  }
  
  return computedState;
}
