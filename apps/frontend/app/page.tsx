/**
 * Frontend home page
 */

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Welcome to My App</h1>
      <p className="mt-4 text-gray-600">
        This is the user-facing frontend application
      </p>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2">
          <li>✅ View Products</li>
          <li>✅ View Banners</li>
          <li>✅ User Authentication</li>
          <li>✅ Product Reviews</li>
        </ul>
      </div>
    </main>
  )
}

