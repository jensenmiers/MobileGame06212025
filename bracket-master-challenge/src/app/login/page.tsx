import { SocialLogin } from "@/components/Auth/SocialLogin";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bracket Master Challenge</h1>
          <p className="text-gray-400">Join the ultimate bracket prediction game</p>
        </div>
        <SocialLogin />
      </div>
    </div>
  );
} 