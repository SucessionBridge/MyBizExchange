import '../styles/globals.css';
import Header from '../components/Header';

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <Component {...pageProps} />
    </div>
  );
}


