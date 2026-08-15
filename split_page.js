const fs = require('fs');

const code = fs.readFileSync('src/app/page.tsx', 'utf8');

// We know the line numbers roughly from our grep:
// function VirtualOfficeView at 468
// function DocumentEditorView at 1491
// function ToolboxView at 1736
// function SkillsView at 2306
// function TaskHistoryView at 2364
// function KnowledgeBaseView at 2748
// function AISettingsView at 2863

const sections = [
  { name: 'VirtualOfficeView', startStr: 'function VirtualOfficeView(' },
  { name: 'DocumentEditorView', startStr: 'function DocumentEditorView(' },
  { name: 'ToolboxView', startStr: 'function ToolboxView(' },
  { name: 'SkillsView', startStr: 'function SkillsView(' },
  { name: 'TaskHistoryView', startStr: 'function TaskHistoryView(' },
  { name: 'KnowledgeBaseView', startStr: 'function KnowledgeBaseView(' },
  { name: 'AISettingsView', startStr: 'function AISettingsView(' }
];

let lines = code.split('\n');
let currentSection = null;
let currentBuffer = [];
let sectionsCode = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  const foundSection = sections.find(s => line.startsWith(s.startStr));
  if (foundSection) {
    if (currentSection) {
      sectionsCode[currentSection] = currentBuffer.join('\n');
    }
    currentSection = foundSection.name;
    currentBuffer = [];
  }
  
  if (currentSection) {
    currentBuffer.push(line);
  }
}

if (currentSection) {
  sectionsCode[currentSection] = currentBuffer.join('\n');
}

for (const name in sectionsCode) {
  fs.writeFileSync(`src/components/shared/${name}.tsx`, sectionsCode[name]);
  console.log(`Extracted ${name}.tsx (${sectionsCode[name].split('\n').length} lines)`);
}

