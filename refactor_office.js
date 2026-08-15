const fs = require('fs');
const path = require('path');

const filePath = path.join('/Users/aisandbox/Documents/myAI/src/app/(dashboard)/office/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add useRouter import
content = content.replace(
  "import { useTranslation } from 'react-i18next';",
  "import { useTranslation } from 'react-i18next';\nimport { useRouter } from 'next/navigation';"
);

// 2. Remove VoiceInputButton
content = content.replace("import VoiceInputButton from '@/components/ui/VoiceInputButton';\n", "");

// 3. Replace state definitions
content = content.replace(
  /const \[input, setInput\] = useState\(''\);\n\s*const \[status, setStatus\] = useState<'idle' \| 'analyzing' \| 'dispatching' \| 'completed' \| 'failed'>\('idle'\);\n\s*const \[activeNodes, setActiveNodes\] = useState<\{agent: string, instruction: string, status: string, taskId: string, depth: number, summary\?: string\}\[]>\[\]\);\n\s*const \[isModalOpen, setIsModalOpen\] = useState\(false\);\n\s*const \[inputMode, setInputMode\] = useState<'text' \| 'file' \| 'email'>\('text'\);\n\s*const \[currentTaskDisplay, setCurrentTaskDisplay\] = useState\(t\('bristh\.office\.noTask'\)\);/,
  `const router = useRouter();
  const { pendingDispatchTask, setPendingDispatchTask } = useWorkspace();
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'dispatching' | 'completed' | 'failed'>('idle');
  const [activeNodes, setActiveNodes] = useState<{agent: string, instruction: string, status: string, taskId: string, depth: number, summary?: string}[]>([]);
  const [currentTaskDisplay, setCurrentTaskDisplay] = useState(t('bristh.office.noTask'));`
);

// 4. Remove email and file upload functions and states
content = content.replace(
  /\/\/ States for Email Integration[\s\S]*?const handleFileUpload =[\s\S]*?if \(fileInputRef\.current\) fileInputRef\.current\.value = ''; \/\/ reset\n  };\n/,
  ""
);

// 5. Update terminateTask
content = content.replace(
  /const terminateTask = \(\) => \{\n\s*setStatus\('idle'\);\n\s*setActiveNodes\(\[\]\);\n\s*setInput\(''\);\n\s*setCurrentTaskDisplay\('暂无活动任务。点击新增接入任务。'\);\n\s*setLogs\(\[\]\);\n\s*\};/,
  `const terminateTask = () => {
    setStatus('idle');
    setActiveNodes([]);
    setCurrentTaskDisplay('暂无活动任务。点击新增接入任务。');
    setLogs([]);
  };`
);

// 6. Update handleDispatch and add useEffect
content = content.replace(
  /const handleDispatch = async \(\) => \{\n\s*\/\/ \.\.\. \[existing handleDispatch code below\]\n\s*if \(inputMode === 'text' && !input\.trim\(\)\) return;\n\s*setCurrentTaskDisplay\(inputMode === 'text' \? input\.substring\(0, 50\) \+ '\.\.\.' : `已关联\$\{inputMode === 'file' \? '上传文件' : 'CRM邮件'\}`\);\n\s*setIsModalOpen\(false\);\n\s*setStatus\('analyzing'\);\n\s*setActiveNodes\(\[\]\);\n\s*setLogs\(\[\]\);/,
  `useEffect(() => {
    if (pendingDispatchTask) {
      const { input, inputMode } = pendingDispatchTask;
      setPendingDispatchTask(null);
      handleDispatch(input, inputMode);
    }
  }, [pendingDispatchTask]);

  const handleDispatch = async (dispatchInput: string, dispatchMode: string) => {
    if (dispatchMode === 'text' && !dispatchInput.trim()) return;
    
    setCurrentTaskDisplay(dispatchMode === 'text' ? dispatchInput.substring(0, 50) + '...' : \`已关联\${dispatchMode === 'file' ? '上传文件' : 'CRM邮件'}\`);
    setStatus('analyzing');
    setActiveNodes([]);
    setLogs([]);`
);

// Update input references inside handleDispatch body
content = content.replace(
  /body: JSON\.stringify\(\{ source: 'TEXT', rawContent: input, locale: i18n\.language \}\)/,
  `body: JSON.stringify({ source: 'TEXT', rawContent: dispatchInput, locale: i18n.language })`
);

// 7. Update button to redirect to /new-task instead of opening modal
content = content.replace(
  /<button onClick=\{\(\) => setIsModalOpen\(true\)\} className="flex-1 flex items-center justify-center py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-xs font-bold hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500\/20">/,
  `<button onClick={() => router.push('/new-task')} className="flex-1 flex items-center justify-center py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-xs font-bold hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20">`
);

// 8. Remove the <Modal> component for new task
content = content.replace(
  /\{\/\* 新增\/管理接入 Modal \*\/\}\n\s*<Modal[\s\S]*?<\/Modal>/,
  ""
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully refactored office/page.tsx');
