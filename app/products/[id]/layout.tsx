export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="product-layout">
      <div className="product-container">
        {children}
      </div>
    </div>
  )
}




