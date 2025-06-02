import '../styles/globals.css';
import Header from '../components/Header'; // 👈 import the Header component

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header /> {/* 👈 add the Header */}
      <main className="pt-20 px-4"> {/* padding top to offset fixed header */}
        <Component {...pageProps} />
      </main>
    </div>
  );
}


