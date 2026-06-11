import Navbar from './Navbar'
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="max-w-[1200px] mx-auto p-5">
        {children}
      </main>
    </div>
  )
}
