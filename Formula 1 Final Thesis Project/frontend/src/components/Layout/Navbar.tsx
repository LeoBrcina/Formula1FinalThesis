// components/Layout/Navbar.tsx
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-700">
      {/* Full-width flex container */}
      <div className="w-full flex items-center justify-between px-10 py-4">
        {/* Left-aligned brand */}
        <Link
          href="/"
          className="text-2xl font-extrabold text-white hover:text-red-500 transition-colors"
          style={{
            transform: 'scaleX(0.8) scaleY(1.25)',
            transformOrigin: 'left center',
            display: 'block',
          }}
        >
          F1 Analytics
        </Link>

        {/* Right-aligned navigation */}
        <ul className="flex space-x-6 text-sm font-medium text-gray-300">
          <li>
            <Link href="/drivers" className="hover:text-red-500 transition-colors">
              Drivers
            </Link>
          </li>
          <li>
            <Link href="/constructors" className="hover:text-red-500 transition-colors">
              Constructors
            </Link>
          </li>
          <li>
            <Link href="/predictions" className="hover:text-red-500 transition-colors">
              Predictions
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
