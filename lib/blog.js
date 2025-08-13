import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog')

export function getPostSlugs() {
  return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))
}

export function getPostMeta(slug) {
  const realSlug = slug.replace(/\.mdx$/, '')
  const filePath = path.join(POSTS_DIR, `${realSlug}.mdx`)
  const file = fs.readFileSync(filePath, 'utf8')
  const { data } = matter(file)
  return { slug: realSlug, ...data }
}

export function getAllPostsMeta() {
  const metas = getPostSlugs().map(getPostMeta)
  return metas
    .filter((m) => m.title)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function getPostBySlug(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  const source = fs.readFileSync(filePath, 'utf8')
  const { content, data } = matter(source)

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      ],
    },
    parseFrontmatter: false,
  })

  return {
    mdxSource,
    frontMatter: { slug, ...data },
  }
}
