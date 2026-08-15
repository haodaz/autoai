const fs = require('fs');

const imports = `
'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Tooltip, Spin } from 'antd';
import { marked } from 'marked';
import { useWorkspace } from '@/components/layout/WorkspaceContext';
import { ThinkBlock, ToolCallsBlock, renderPreviewStandalone, COLOR_BORDER_MAP } from '@/components/shared/UIBlocks';
import { Building2, Cpu, Activity, History, BookOpen, Settings, Send, CheckCircle2, ChevronRight, ChevronLeft, Users, Layout, Plus, FileText, Calendar, Presentation, AlertTriangle, Scale, Mail, StopCircle, Edit, Edit3, Link2, UploadCloud, Terminal, Info, Download, MessageSquare, Wrench, PenTool, CheckCircle, XCircle, Hourglass, ChevronDown, ChevronUp, Database, Menu, X, Copy, RefreshCw, GitMerge, LogOut, UserCircle, Phone, AtSign, Camera, Save, ArrowLeft, ArrowRight, SaveAll, Loader2 } from 'lucide-react';
`;

const files = [
  'VirtualOfficeView.tsx',
  'DocumentEditorView.tsx',
  'ToolboxView.tsx',
  'SkillsView.tsx',
  'TaskHistoryView.tsx',
  'KnowledgeBaseView.tsx',
  'AISettingsView.tsx'
];

for (const file of files) {
  const path = `src/components/shared/${file}`;
  let code = fs.readFileSync(path, 'utf8');

  // Replace signature of VirtualOfficeView
  code = code.replace(
    /function VirtualOfficeView\([^)]*\)\s*\{/,
    'export default function VirtualOfficeView() {\n  const { setPendingPptData: onOpenPptCopilot, setCopilotView: onOpenDocCopilot } = useWorkspace();'
  );

  // Replace signature of TaskHistoryView
  code = code.replace(
    /function TaskHistoryView\([^)]*\)\s*\{/,
    'export default function TaskHistoryView() {\n  const { setPendingPptData: onOpenPptCopilot, setCopilotView: onOpenDocCopilot } = useWorkspace();'
  );

  // Replace signature of ToolboxView
  code = code.replace(
    /function ToolboxView\([^)]*\)\s*\{/,
    'export default function ToolboxView() {\n  const { pendingPptData: initialPpt, setPendingPptData } = useWorkspace();\n  const onPptConsumed = () => setPendingPptData(null);'
  );

  // Replace signature of DocumentEditorView
  code = code.replace(
    /function DocumentEditorView\(\{\s*taskId,\s*agent,\s*onClose\s*\}\s*:\s*\{[^}]*\}\)\s*\{/,
    'export default function DocumentEditorView({ taskId, agent, onClose }: { taskId: string; agent: string; onClose: () => void }) {'
  );

  // For others, just export default
  code = code.replace(/function SkillsView\(\)\s*\{/, 'export default function SkillsView() {');
  code = code.replace(/function KnowledgeBaseView\(\)\s*\{/, 'export default function KnowledgeBaseView() {');
  code = code.replace(/function AISettingsView\(\)\s*\{/, 'export default function AISettingsView() {');

  fs.writeFileSync(path, imports + '\n' + code);
  console.log(`Fixed ${file}`);
}
