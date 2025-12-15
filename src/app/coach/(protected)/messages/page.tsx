"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';

interface Message {
    id: number;
    content: string;
    timestamp: string;
}

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [athletes, setAthletes] = useState<{ id: string; name: string; email: string }[]>([]);
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');

    // Load existing messages and athletes
    useEffect(() => {
        // Fetch messages
        fetch('/api/coach/messages')
            .then((res) => res.json())
            .then((data) => setMessages(data))
            .catch(console.error);

        // Fetch athletes
        fetch('/api/coach/athletes')
            .then((res) => res.json())
            .then((data) => setAthletes(data))
            .catch(console.error);
    }, []);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        let emailLink = '';
        if (selectedAthleteId) {
            const athlete = athletes.find(a => a.id === selectedAthleteId);
            if (athlete && athlete.email) {
                emailLink = `mailto:${athlete.email}?subject=Messaggio dal Coach&body=${encodeURIComponent(newMessage)}`;
                window.location.href = emailLink;
            }
        }

        // Also save to internal history
        const payload = {
            content: newMessage,
            athleteId: selectedAthleteId // Optional: backend might not support this yet but good to send
        };

        try {
            const res = await fetch('/api/coach/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const created: Message = await res.json();
                setMessages((prev) => [...prev, created]);
                setNewMessage('');
            }
        } catch (e) {
            console.error('Failed to save message to history', e);
        }
    };

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <Card className="border border-border bg-card shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold">Messaggi Coach → Atleti</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">

                    {/* Athlete Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Seleziona Atleta (Opzionale)</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedAthleteId}
                            onChange={(e) => setSelectedAthleteId(e.target.value)}
                        >
                            <option value="">Tutti / Nessuno specifico</option>
                            {athletes.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({a.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Message list */}
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto border rounded-md p-2 bg-muted/20">
                        {messages.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">Nessun messaggio inviato.</p>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className="p-3 bg-background rounded-md shadow-sm border">
                                    <p className="text-sm">{msg.content}</p>
                                    <p className="text-xs text-muted-foreground text-right mt-1">{msg.timestamp}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input area */}
                    <div className="flex gap-2 items-center">
                        <Input
                            placeholder="Scrivi un messaggio..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleSend} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white">
                            <Send className="h-4 w-4 mr-1" />
                            {selectedAthleteId ? 'Invia Email' : 'Salva Nota'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
