import Link from "next/link";
import { getAllPosts } from "../utils/mdx";
import styled from 'styled-components'

import styles from '../styles/index.module.css'

const Header = styled.h1`
color: blue;
font-family: arial;
`

export default function BlogList({ posts }) {
  return (
    <section className={styles.recentPosts}>
      <Header>Recently Published</Header>
      <div id="articles">
        {posts.map((post, index) => {
          post.frontmatter.abstract = post.frontmatter.abstract || post.excerpt
          const options = {
            // Format Date in JS: https://stackoverflow.com/a/69883358/6908282
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          }
          const date = new Date(post.frontmatter.publishedOn)
          return (
            <article className={styles.ContentPreview} key={index}>
              <Link href={`/blog/${encodeURIComponent(post.slug)}`} passHref={true}>
                <a>
                  <h3>{post.frontmatter.title}</h3>
                  <p>{post.frontmatter.abstract}</p>
                  <div className={styles.articleBottom}>
                    <p>Read More</p>
                    <p title={date.toLocaleString()}>{date.toLocaleString(undefined, options)}</p>
                  </div>
                </a>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  );
}

export const getStaticProps = async () => {
  const posts = getAllPosts();
  // sort array - https://stackoverflow.com/a/67992215/6908282
  posts.sort((a, b) => a.frontmatter.publishedOn > b.frontmatter.publishedOn ? -1 : 1)

  return {
    props: { posts },
  };
};