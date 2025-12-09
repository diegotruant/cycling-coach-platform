
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const connectionString = process.env.DATABASE_URL;

console.log('🔍 ANALISI CONNESSIONE DATABASE\n');

if (!connectionString) {
    console.error('❌ ERRORE: La variabile DATABASE_URL non è definita nel file .env');
    process.exit(1);
}

try {
    const url = new URL(connectionString);
    console.log('✅ Stringa Trovata. Ecco come viene interpretata:');
    console.log('------------------------------------------------');
    console.log(`👤 Utente:    ${url.username}`);
    console.log(`🔑 Password:  [${url.password ? 'PRESENTE (Lunghezza: ' + url.password.length + ')' : 'MANCANTE'}]`);
    console.log(`🌐 Host:      '${url.hostname}'   <-- CONTROLLA QUI! Se dice 'base', c'è un errore prima di questa parola.`);
    console.log(`🔌 Porta:     ${url.port}`);
    console.log(`📁 Database:  ${url.pathname}`);
    console.log('------------------------------------------------');

    if (url.hostname === 'base') {
        console.log('\n⚠️  DIAGNOSI: Il sistema vede "base" come nome del server.');
        console.log('   Molto probabilmente hai uno spazio o un errore di battitura nel file .env');
        console.log('   Esempio errore comune: "...@supa base.co..." invece di "...@db.progetto.supabase.co..."');
    }

} catch (e: any) {
    console.error('❌ ERRORE FORMATO: La stringa nel file .env non è un URL valido.');
    console.error('   Dettagli:', e.message);
}
