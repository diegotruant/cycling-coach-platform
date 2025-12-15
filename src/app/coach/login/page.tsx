import { SignIn } from "@clerk/nextjs";

export default function CoachLoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <SignIn
                routing="path"
                path="/coach/login"
                forceRedirectUrl="/coach"
                signUpUrl="/sign-up"
            />
        </div>
    );
}
