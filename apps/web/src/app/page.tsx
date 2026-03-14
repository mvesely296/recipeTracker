export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Recipe Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Plan meals, manage your pantry, and automate grocery shopping
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Get Started
          </a>
          <a
            href="/about"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
