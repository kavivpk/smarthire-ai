import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <Header />
      <main className="flex-1 page-enter">
        {children}
      </main>
      <Footer />
    </div>
  );
}
