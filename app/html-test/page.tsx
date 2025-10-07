export default function HtmlTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">HTML Test Page</h1>
      <p className="mb-4">Click the link below to open the HTML test page:</p>

      <a href="/settings-test.html" target="_blank" className="text-blue-500 underline" rel="noreferrer">
        Open Settings Test HTML
      </a>
    </div>
  )
}
