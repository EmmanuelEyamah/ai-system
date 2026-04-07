/**
 * Migrate MySQL data (phpMyAdmin JSON export) to MongoDB Atlas via Prisma.
 *
 * Usage: node migrate-to-mongo.mjs /path/to/prompt_studio.json
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();
const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node migrate-to-mongo.mjs <path-to-json>");
  process.exit(1);
}

// Parse the phpMyAdmin JSON export
const raw = JSON.parse(readFileSync(filePath, "utf-8"));
const tables = {};
for (const entry of raw) {
  if (entry.type === "table" && entry.data) {
    tables[entry.name] = entry.data;
  }
}

console.log("Tables found:", Object.keys(tables).join(", "));
console.log(
  "Row counts:",
  Object.entries(tables)
    .map(([k, v]) => `${k}: ${v.length}`)
    .join(", ")
);

// Maps old cuid IDs → new MongoDB ObjectIds
const idMap = {};

function mapId(oldId) {
  return idMap[oldId] || null;
}

async function main() {
  console.log("\n--- Starting migration ---\n");

  // 1. Users
  console.log("Migrating users...");
  for (const row of tables.users || []) {
    const user = await prisma.user.create({
      data: {
        name: row.name,
        createdAt: new Date(row.created_at),
      },
    });
    idMap[row.id] = user.id;
    console.log(`  User: ${row.name} → ${user.id}`);
  }

  // 2. Chats
  console.log("Migrating chats...");
  for (const row of tables.chats || []) {
    const userId = mapId(row.user_id);
    if (!userId) {
      console.log(`  Skipping chat ${row.id} — user not found`);
      continue;
    }
    const chat = await prisma.chat.create({
      data: {
        userId,
        title: row.title,
        taskType: row.task_type || null,
        status: row.status,
        starred: row.starred === "1" || row.starred === true,
        analysisModel: row.analysis_model || "claude-sonnet-4.6",
        generationModel: row.generation_model || "claude-sonnet-4.6",
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
    });
    idMap[row.id] = chat.id;
    console.log(`  Chat: "${row.title.slice(0, 40)}..." → ${chat.id}`);
  }

  // 3. Messages
  console.log("Migrating messages...");
  for (const row of tables.messages || []) {
    const chatId = mapId(row.chat_id);
    if (!chatId) continue;
    let metadata = null;
    if (row.metadata) {
      try {
        metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
      } catch {}
    }
    const msg = await prisma.message.create({
      data: {
        chatId,
        role: row.role,
        content: row.content,
        metadata,
        createdAt: new Date(row.created_at),
      },
    });
    idMap[row.id] = msg.id;
  }
  console.log(`  Migrated ${(tables.messages || []).length} messages`);

  // 4. Attachments
  console.log("Migrating attachments...");
  for (const row of tables.attachments || []) {
    const chatId = mapId(row.chat_id);
    if (!chatId) continue;
    const messageId = row.message_id ? mapId(row.message_id) : null;
    await prisma.attachment.create({
      data: {
        messageId,
        chatId,
        fileName: row.file_name,
        fileType: row.file_type,
        mimeType: row.mime_type,
        fileSize: parseInt(row.file_size, 10),
        storagePath: row.storage_path,
        extractedText: row.extracted_text || null,
        createdAt: new Date(row.created_at),
      },
    });
  }
  console.log(`  Migrated ${(tables.attachments || []).length} attachments`);

  // 5. Generated Prompts
  console.log("Migrating generated prompts...");
  for (const row of tables.generated_prompts || []) {
    const chatId = mapId(row.chat_id);
    if (!chatId) continue;
    const messageId = row.message_id ? mapId(row.message_id) : null;
    await prisma.generatedPrompt.create({
      data: {
        chatId,
        messageId,
        variant: row.variant,
        modelTarget: row.model_target,
        content: row.content,
        score: row.score ? parseFloat(row.score) : null,
        explanation: row.explanation || null,
        createdAt: new Date(row.created_at),
      },
    });
  }
  console.log(`  Migrated ${(tables.generated_prompts || []).length} prompts`);

  // 6. Research Sessions
  console.log("Migrating research sessions...");
  for (const row of tables.research_sessions || []) {
    const userId = mapId(row.user_id);
    if (!userId) continue;
    let reportData = null;
    if (row.report_data) {
      try {
        reportData = typeof row.report_data === "string" ? JSON.parse(row.report_data) : row.report_data;
      } catch {}
    }
    let toolsUsed = null;
    if (row.tools_used) {
      try {
        toolsUsed = typeof row.tools_used === "string" ? JSON.parse(row.tools_used) : row.tools_used;
      } catch {}
    }
    const session = await prisma.researchSession.create({
      data: {
        userId,
        title: row.title,
        query: row.query,
        status: row.status,
        starred: row.starred === "1" || row.starred === true,
        researchModel: row.research_model || "claude-sonnet-4.6",
        reportData,
        toolsUsed,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
    });
    idMap[row.id] = session.id;
    console.log(`  Session: "${row.title.slice(0, 40)}..." → ${session.id}`);
  }

  // 7. Research Messages
  console.log("Migrating research messages...");
  for (const row of tables.research_messages || []) {
    const sessionId = mapId(row.session_id);
    if (!sessionId) continue;
    let metadata = null;
    if (row.metadata) {
      try {
        metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
      } catch {}
    }
    await prisma.researchMessage.create({
      data: {
        sessionId,
        role: row.role,
        content: row.content,
        metadata,
        createdAt: new Date(row.created_at),
      },
    });
  }
  console.log(`  Migrated ${(tables.research_messages || []).length} research messages`);

  // 8. Cross App Tasks
  console.log("Migrating cross-app tasks...");
  for (const row of tables.cross_app_tasks || []) {
    let payload = {};
    if (row.payload) {
      try {
        payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
      } catch {}
    }
    let result = null;
    if (row.result) {
      try {
        result = typeof row.result === "string" ? JSON.parse(row.result) : row.result;
      } catch {}
    }
    await prisma.crossAppTask.create({
      data: {
        sourceApp: row.source_app,
        targetApp: row.target_app,
        taskType: row.task_type,
        status: row.status,
        payload,
        result,
        sourceRefId: row.source_ref_id ? mapId(row.source_ref_id) : null,
        targetRefId: row.target_ref_id ? mapId(row.target_ref_id) : null,
        createdAt: new Date(row.created_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : null,
      },
    });
  }
  console.log(`  Migrated ${(tables.cross_app_tasks || []).length} cross-app tasks`);

  console.log("\n--- Migration complete! ---");
  console.log(`Total ID mappings: ${Object.keys(idMap).length}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
