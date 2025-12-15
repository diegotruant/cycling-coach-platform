import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <h2 className="mb-4 text-2xl font-bold">Pagina Non Trovata</h2>
            <p className="mb-4 text-gray-600">Impossibile trovare la risorsa richiesta.</p>
            <Link href="/" className="text-blue-500 hover:underline">
                Torna alla Home
            </Link>
        </div>
    );
}
