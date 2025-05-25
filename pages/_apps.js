import '@/styles/globals.css'  // if you’re using a global stylesheet
import '../styles/globals.css' // use this if Tailwind is configured locally

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Component {...pageProps} />
    </div>
  )
}
