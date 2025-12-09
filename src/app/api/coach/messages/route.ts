import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface Message {
    id: number;
    content: string;
    timestamp: string;
}

// File‑based persistence (JSON file in project root under data/coach)
const dataDir = path.resolve(process.cwd(), 'data', 'coach');
const messagesFile = path.join(dataDir, 'messages.json');

async function ensureDataFile() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.access(messagesFile);
    } catch {
        // If file does not exist, create an empty array
        await fs.writeFile(messagesFile, JSON.stringify([]), 'utf8');
    }
}

async function readMessages(): Promise<Message[]> {
    await ensureDataFile();
    const content = await fs.readFile(messagesFile, 'utf8');
    return JSON.parse(content) as Message[];
}

async function writeMessages(messages: Message[]) {
    await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), 'utf8');
}

export async function GET() {
    const messages = await readMessages();
    return NextResponse.json(messages);
}

export async function POST(request: Request) {
    try {
        const { content } = await request.json();
        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
        }
        const messages = await readMessages();
        const newId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
        const newMessage: Message = {
            id: newId,
            content,
            timestamp: new Date().toLocaleString('it-IT', { hour12: false }),
        };
        messages.push(newMessage);
        await writeMessages(messages);
        console.log(`🔔 Nuovo messaggio inviato (id=${newMessage.id}): ${newMessage.content}`);
        return NextResponse.json(newMessage, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
