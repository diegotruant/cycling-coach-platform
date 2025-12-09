import { Settings as SettingsIcon, User, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
                <p className="text-muted-foreground mt-2">
                    Gestisci il tuo profilo e le preferenze della piattaforma
                </p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <CardTitle>Profilo Coach</CardTitle>
                    </div>
                    <CardDescription>Gestisci le informazioni del tuo profilo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Nome</label>
                            <input
                                type="text"
                                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Il tuo nome"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <input
                                type="email"
                                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            rows={3}
                            placeholder="Racconta qualcosa di te..."
                        />
                    </div>
                    <Button>Salva Modifiche</Button>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <CardTitle>Notifiche</CardTitle>
                    </div>
                    <CardDescription>Configura le tue preferenze di notifica</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Alert HRV</p>
                            <p className="text-sm text-muted-foreground">Ricevi notifiche per alert HRV critici</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Workout Completati</p>
                            <p className="text-sm text-muted-foreground">Notifica quando un atleta completa un workout</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Test Completati</p>
                            <p className="text-sm text-muted-foreground">Notifica per nuovi risultati test</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                    </div>
                </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        <CardTitle>Configurazione AI</CardTitle>
                    </div>
                    <CardDescription>Configura l&apos;intelligenza artificiale per generare workout</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Provider AI</label>
                        <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="gemini">Google Gemini</option>
                            <option value="openai" disabled>OpenAI (Coming Soon)</option>
                            <option value="claude" disabled>Anthropic Claude (Coming Soon)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Modello</label>
                        <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Veloce, 1 credito)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Potente, 3 crediti)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">API Key Gemini</label>
                        <input
                            type="password"
                            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                            placeholder="AIza..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Ottieni la tua API key da{' '}
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">Testa Connessione</Button>
                        <Button>Salva Configurazione</Button>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm font-medium mb-1">Crediti Mensili</p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">50</span>
                            <span className="text-sm text-muted-foreground">/ 50 disponibili</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Reset il 1° di ogni mese
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle>Sicurezza</CardTitle>
                    </div>
                    <CardDescription>Gestisci password e sicurezza account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline">Cambia Password</Button>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                        Elimina Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
