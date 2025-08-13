import Head from 'next/head'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote'
import { getPostSlugs, getPostBySlug } from '../../lib/blog'

const components = {
  h1: (p) => <h1 {...p} className="text-3xl md:text-4xl font-serif font-bold mt-6 mb-3" />,
  h2: (p) => <h2 {...p} className="text-2xl font-bold mt-6 mb-3" />,
  h3: (p) => <h3 {...p} className="text-xl font-semibold mt-5 mb-2" />,
  p:  (p) => <p {...p} className="my-4 leading-7" />,
  ul: (p) => <ul {...p} className="my-4 list-disc list-inside space-y-1" />,
  ol: (p) => <ol {...p} className="my-4 list-decimal list-inside space-y-1" />,
  blockquote: (p) => <blockquote {...p} className="my-4 border-l-4 pl-3 text-gray-700 italic" />,
  code: (p) => <code {...p} className="px-1 py-0.5 rounded bg-gray-100" />,
  pre: (p) => <pre {...p} className="my-4 p-3 bg-gray-900 text-gray-100 rounded overflow-x-auto text-sm" />,
  a: ({ href, ...rest }) => <a href={href} {...rest} className="text-blue-600 hover:underline" />,
}

export default function BlogPost({ frontMatter, mdxSource }) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Head>
        <title>{frontMatter.title} — SuccessionBridge</title>
        <meta name="description" content={frontMatter.excerpt || ''} />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <Link href="/blog"><a className="text-sm text-blue-600 hover:underline">← Back to blog</a></Link>

        <article className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2E3A59]">{frontMatter.title}</h1>
            <div className="mt-2 text-sm text-gray-500">
              {frontMatter.author ? `${frontMatter.author} • ` : ''}{formatDate(frontMatter.date)}
            </div>
            {frontMatter.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={frontMatter.cover} alt="" className="mt-4 rounded-lg" />
            ) : null}
          </header>

          <div className="prose prose-lg max-w-none">
            <MDXRemote {...mdxSource} components={components} />
          </div>

          <footer className="mt-8 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <strong>Note:</strong> Our posts are guidance only and not legal, tax, or appraisal advice.
          </footer>
        </article>
      </div>
    </main>
  )
}

function formatDate(d) {
  try { return new Date(d).toLocaleDateString() } catch { return '' }
}

export async function getStaticPaths() {
  const slugs = getPostSlugs().map((s) => s.replace(/\.mdx$/, ''))
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false }
}

export async function getStaticProps({ params }) {
  const { mdxSource, frontMatter } = await getPostBySlug(params.slug)
  return { props: { mdxSource, frontMatter } }
}
