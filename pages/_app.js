import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Component {...pageProps} />
    </div>
  )
}
