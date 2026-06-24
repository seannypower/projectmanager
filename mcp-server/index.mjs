#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const BASE = 'https://zncwlitwciyfukmibgwv.supabase.co/rest/v1';
const KEY  = 'sb_publishable_gMAB1SeejfB6-_Zc1uwhOw_S68JHdhM';
const H    = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

async function sb(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : null;
}

const server = new Server({ name: 'tasks', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [
  {
    name: 'list_tasks',
    description: "Get all of Sean's tasks with subtasks from his task dashboard",
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_task',
    description: "Add a task to Sean's dashboard",
    inputSchema: { type: 'object', required: ['title'], properties: {
      title:    { type: 'string' },
      project:  { type: 'string', enum: ['personal', 'work', 'music', 'video'], default: 'personal' },
      priority: { type: 'string', enum: ['high', 'ongoing', 'waiting', 'norush'], default: 'ongoing' },
      due:      { type: 'string', description: 'e.g. "Jul 15"' },
      est:      { type: 'string', description: 'e.g. "3h"' },
      notes:    { type: 'string' },
    }},
  },
  {
    name: 'update_task',
    description: "Update a task on Sean's dashboard",
    inputSchema: { type: 'object', required: ['id'], properties: {
      id:       { type: 'number' },
      title:    { type: 'string' },
      project:  { type: 'string' },
      priority: { type: 'string' },
      due:      { type: 'string' },
      est:      { type: 'string' },
      notes:    { type: 'string' },
      snooze:   { type: 'number' },
    }},
  },
  {
    name: 'delete_task',
    description: "Delete a task from Sean's dashboard",
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
  },
  {
    name: 'add_subtask',
    description: "Add a subtask to an existing task on Sean's dashboard",
    inputSchema: { type: 'object', required: ['task_id', 'name'], properties: {
      task_id: { type: 'number' },
      name:    { type: 'string' },
      pri:     { type: 'string', enum: ['high', 'ongoing', 'waiting', 'norush'], default: 'ongoing' },
      dur:     { type: 'string', description: 'e.g. "2h"' },
      due:     { type: 'string' },
      notes:   { type: 'string' },
    }},
  },
]}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a } = req.params;
  try {
    if (name === 'list_tasks') {
      const data = await sb('GET', '/tasks?select=*,subtasks(*)&order=id');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'add_task') {
      const data = await sb('POST', '/tasks', { title: a.title, project: a.project ?? 'personal', priority: a.priority ?? 'ongoing', due: a.due ?? '', est: a.est ?? '', notes: a.notes ?? '', snooze: 0 });
      return { content: [{ type: 'text', text: `Added task id=${data[0].id}: "${data[0].title}"` }] };
    }
    if (name === 'update_task') {
      const { id, ...fields } = a;
      await sb('PATCH', `/tasks?id=eq.${id}`, fields);
      return { content: [{ type: 'text', text: `Task ${id} updated.` }] };
    }
    if (name === 'delete_task') {
      await sb('PATCH', `/tasks?id=eq.${a.id}`, { deleted_at: new Date().toISOString() });
      return { content: [{ type: 'text', text: `Task ${a.id} soft-deleted (recoverable from Supabase).` }] };
    }
    if (name === 'add_subtask') {
      const existing = await sb('GET', `/subtasks?task_id=eq.${a.task_id}&order=position`);
      await sb('POST', '/subtasks', { id: `sub_${Date.now()}`, task_id: a.task_id, name: a.name, pri: a.pri ?? 'ongoing', dur: a.dur ?? '', due: a.due ?? '', done: false, notes: a.notes ?? '', position: existing.length });
      return { content: [{ type: 'text', text: `Subtask "${a.name}" added to task ${a.task_id}.` }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
