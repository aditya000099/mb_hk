import Navbar from './Navbar'
import LeftSidebar from './LeftSidebar'

export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#000000] text-[#d7dadc]">
      <Navbar />
      <div className="flex max-w-[1600px] mx-auto w-full">
        <LeftSidebar />
        <main className="flex-1 min-w-0 flex justify-center py-6 px-2 sm:px-3 lg:px-4">
          <div className="w-full max-w-[1100px] flex justify-center gap-6 items-start">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
