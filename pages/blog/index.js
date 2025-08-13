import Link from 'next/link'
import Head from 'next/head'
import { getAllPostsMeta } from '../../lib/blog'

export default function BlogIndex({ posts }) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>Blog — SuccessionBridge</title>
        <meta name="description" content="Guides, playbooks, and updates from SuccessionBridge." />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <header className="text-center mb-10 md:mb-14">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#2E3A59]">
            SuccessionBridge Blog
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Plain-English guides on valuation, listings, and getting deals done.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-center text-gray-600">No posts yet.</p>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <article key={p.slug} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt={p.title} className="w-full h-48 object-cover" />
                ) : null}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-[#2E3A59]">
                    <Link href={`/blog/${p.slug}`}>
                      <a className="hover:text-blue-600">{p.title}</a>
                    </Link>
                  </h2>
                  <div className="mt-1 text-sm text-gray-500">{formatDate(p.date)}</div>
                  <p className="mt-3 text-gray-700">{p.excerpt || ''}</p>
                  <div className="mt-4">
                    <Link href={`/blog/${p.slug}`}>
                      <a className="inline-block text-sm font-semibold text-blue-600 hover:underline">Read more →</a>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

function formatDate(d) {
  try { return new Date(d).toLocaleDateString() } catch { return '' }
}

export async function getStaticProps() {
  const posts = getAllPostsMeta()
  return { props: { posts } }
}
