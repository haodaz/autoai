import path from 'path';
import fs from 'fs';

export function pickDashMcpBinary(): string | null {
  const platform = process.platform;
  const arch = process.arch;

  const candidates: string[] = [];
  if (platform === 'darwin') {
    if (arch === 'x64') candidates.push('dash-mcp-darwin-amd64');
    if (arch === 'arm64') candidates.push('dash-mcp-darwin-arm64');
  } else if (platform === 'linux') {
    if (arch === 'x64') candidates.push('dash-mcp-linux-amd64');
    if (arch === 'arm64') candidates.push('dash-mcp-linux-arm64');
  } else if (platform === 'win32') {
    candidates.push('dash-mcp-windows-amd64.exe');
  }

  // Path relative to the project root in development
  const binDir = path.join(process.cwd(), 'src/lib/mcp/bin');
  
  for (const name of candidates) {
    const p = path.join(binDir, name);
    if (fs.existsSync(p)) return p;
  }

  return null;
}
