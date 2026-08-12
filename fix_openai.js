const fs = require('fs');

const files = [
  'src/app/api/bristh/copilot/route.ts',
  'src/app/api/bristh/agents/fiona/route.ts',
  'src/app/api/bristh/agents/eric/route.ts',
  'src/app/api/bristh/agents/bob/route.ts',
  'src/app/api/bristh/agents/alice/route.ts',
  'src/app/api/bristh/agents/david/route.ts',
  'src/app/api/bristh/agents/edda/route.ts',
  'src/app/api/bristh/orchestrate/route.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/model: 'qwen-plus'/g, "model: 'deepseek-v3'");
    fs.writeFileSync(file, content);
    console.log('Fixed model to deepseek in', file);
  }
});
