import RegisterForm from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-purple-500/5 via-transparent to-pink-500/5" />
      <div className="relative z-10">
        <RegisterForm />
      </div>
    </div>
  )
}
