import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UnauthorizedCoachPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Accesso Negato</h1>
                <p className="text-gray-600 mb-6">
                    Il tuo account non è autorizzato come Coach. <br />
                    Contatta l'amministratore del sistema.
                </p>
                <div className="space-y-4">
                    <SignOutButton>
                        <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition">
                            Disconnetti
                        </button>
                    </SignOutButton>
                    <Link href="/" className="block text-blue-500 hover:underline">
                        Torna alla Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
