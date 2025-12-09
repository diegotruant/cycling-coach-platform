
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('--- GENERATORE STRINGA CONNESSIONE SUPABASE ---\n');

rl.question('Inserisci la Password del DB: ', (password) => {
    rl.question('Inserisci il Project Ref (es. abcdefgh): ', (projectRef) => {

        // Encode password safely
        const encodedPassword = encodeURIComponent(password);

        const connectionString = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;

        console.log('\n✅ Ecco la tua stringa CORRETTA e CODIFICATA:');
        console.log('--------------------------------------------------');
        console.log(`DATABASE_URL="${connectionString}"`);
        console.log('--------------------------------------------------');
        console.log('👉 Copia e incolla questa riga nel tuo file .env');

        rl.close();
    });
});
