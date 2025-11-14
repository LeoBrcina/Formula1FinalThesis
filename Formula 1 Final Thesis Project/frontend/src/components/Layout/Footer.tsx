// components/Layout/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-700 mt-12">
      <div className="container mx-auto py-4 px-6 text-center text-sm text-red-500">
        © {new Date().getFullYear()} F1 Data Analytics. Built with Next.js and FastF1.
      </div>
    </footer>
  );
}
