import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const IMAP_USER = process.env.IMAP_USER;
const IMAP_PASSWORD = process.env.IMAP_PASSWORD;
const ORCHESTRATE_URL = 'http://localhost:5859/api/bristh/orchestrate';

if (!IMAP_USER || !IMAP_PASSWORD) {
  console.error('❌ Error: IMAP_USER or IMAP_PASSWORD is not set in .env.local');
  process.exit(1);
}

const config = {
  imap: {
    user: IMAP_USER,
    password: IMAP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 3000,
    tlsOptions: { rejectUnauthorized: false }
  }
};

let isProcessing = false;

async function pollEmails(connection: imaps.ImapSimple) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    await connection.openBox('INBOX');
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: [''], markSeen: true };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    if (messages.length > 0) {
      console.log(`\n📥 Found ${messages.length} new email(s). Processing...`);
    }

    for (const item of messages) {
      const all = item.parts.find(part => part.which === '');
      if (!all) continue;
      
      // Parse with mailparser
      const parsed = await simpleParser(all.body);
      
      const subject = parsed.subject || 'No Subject';
      const from = parsed.from?.text || 'Unknown Sender';
      const body = parsed.text || parsed.html?.replace(/<[^>]+>/g, '') || 'No content';
      
      console.log(`\n========================================`);
      console.log(`📬 NEW MAIL: ${subject}`);
      console.log(`👤 FROM: ${from}`);
      console.log(`========================================`);
      
      // Construct raw content for Orchestrator
      const rawContent = `[邮件指令]\n发件人: ${from}\n主题: ${subject}\n\n正文:\n${body}`;

      console.log(`🚀 Dispatching task to Chief Orchestrator...`);
      
      try {
        const response = await fetch(ORCHESTRATE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'EMAIL',
            rawContent
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Task successfully dispatched! Task Context ID: ${data.contextId}`);
          console.log(`🤖 ${data.tasks.length} Agent(s) assigned to the pipeline. Executing...`);

          const otherTasks = data.tasks.filter((t: any) => t.agent.toLowerCase() !== 'grace');
          const graceTasks = data.tasks.filter((t: any) => t.agent.toLowerCase() === 'grace');

          const runAgent = async (t: any) => {
            const agentName = t.agent.toLowerCase();
            try {
              console.log(`➡️  Starting ${t.agent}...`);
              const agentRes = await fetch(`http://localhost:5859/api/bristh/agents/${agentName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: t.id })
              });
              if (!agentRes.ok) {
                console.error(`❌ ${t.agent} failed with status ${agentRes.status}`);
              } else {
                console.log(`✅ ${t.agent} completed successfully.`);
              }
            } catch (err: any) {
              console.error(`❌ ${t.agent} error:`, err.message);
            }
          };

          // 1. Run all other agents concurrently
          await Promise.all(otherTasks.map(runAgent));
          
          // 2. Run Grace only after everyone else is done
          if (graceTasks.length > 0) {
             console.log(`⏳ Dependencies met. Starting Grace for attachment delivery...`);
             await Promise.all(graceTasks.map(runAgent));
          }
          console.log(`🎉 All background agents have finished processing the email!`);
        } else {
          const errorData = await response.json();
          console.error(`❌ Orchestrator returned an error:`, errorData);
        }
      } catch (postError: any) {
        console.error(`❌ Failed to connect to Orchestrator API at ${ORCHESTRATE_URL}. Is Next.js running?`, postError.message);
      }
    }
  } catch (error) {
    console.error('⚠️ Error during IMAP poll:', error);
  } finally {
    isProcessing = false;
  }
}

async function startDaemon() {
  console.log(`\n📧 Starting Bristh Email Daemon...`);
  console.log(`🌐 Connecting to IMAP server as ${IMAP_USER}...`);
  
  try {
    const connection = await imaps.connect(config);
    console.log(`✅ Connected successfully! Listening for new emails...`);
    
    // Poll every 10 seconds
    setInterval(() => {
      pollEmails(connection);
    }, 10000);
    
    // Initial poll
    pollEmails(connection);

    // Handle disconnects
    connection.on('error', (err) => {
      console.error('❌ IMAP Connection Error:', err);
      process.exit(1);
    });

    connection.on('end', () => {
      console.error('❌ IMAP Connection Ended');
      process.exit(1);
    });

  } catch (err: any) {
    console.error('❌ Failed to start IMAP Daemon:', err.message);
    process.exit(1);
  }
}

startDaemon();
