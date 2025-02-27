export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-500 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl m-4 transition-transform hover:scale-105">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Tailwind Test</div>
          <p className="mt-2 text-slate-500">Testing various Tailwind classes</p>
          <div className="mt-4 space-y-4">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Button
            </button>
            <div className="flex space-x-4">
              <div className="h-12 w-12 rounded-full bg-red-500 animate-pulse"></div>
              <div className="h-12 w-12 rounded-full bg-green-500 animate-bounce"></div>
              <div className="h-12 w-12 rounded-full bg-yellow-500 animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 