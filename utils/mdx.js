import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { bundleMDX } from "mdx-bundler";

import remarkGfm from 'remark-gfm'
import { remarkMdxImages } from 'remark-mdx-images';
import rehypeToc from '@jsdevtools/rehype-toc'
import rehypeSlug from 'rehype-slug';
import rehypeCodeTitles from 'rehype-code-titles';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';
import { s } from 'hastscript'

const rootDir = process.cwd();
const POSTS_PATH = path.join(rootDir, "data/posts");
const imagesPath = '/images/content/posts' // TODO: validate the images folder
const imagesDir = path.join(rootDir, 'public', imagesPath);

export const getSourceOfFile = (fileName) => {
    return fs.readFileSync(path.join(POSTS_PATH, fileName), 'utf8');
};

function first30words(file, options) {
    // rerference: https://github.com/jonschlinkert/gray-matter#:~:text=returns%20the%20first%204%20lines%20of%20the%20contents
    file.excerpt = file.content.split(' ').slice(0, 30).join(' ') + "...";
}

export const getAllPosts = () => {
    return fs
        .readdirSync(POSTS_PATH)
        .filter((path) => /\.mdx?$/.test(path))
        .map((fileName) => {
            const source = getSourceOfFile(fileName);
            const slug = fileName.replace(/\.mdx?$/, "");
            const { data, excerpt } = matter(source, { excerpt: first30words });

            return {
                frontmatter: data,
                slug: slug,
                excerpt: excerpt,
            };
        });
};

export const getSinglePost = async (slug) => {
    const filepath = path.join(POSTS_PATH, `${slug}.mdx`)
    const sourceMDX = getSourceOfFile(slug + ".mdx");

    const { code, frontmatter } = await bundleMDX({
        // source: sourceMDX,
        file: filepath,
        cwd: POSTS_PATH,
        xdmOptions(options) {
            options.remarkPlugins = [
                ...(options.remarkPlugins ?? []),
                remarkGfm,
                remarkMdxImages,
                // remarkMath,
            ];
            options.rehypePlugins = [
                ...(options.rehypePlugins ?? []),
                // [rehypeToc,
                //     {
                //         headings: ["h2", "h3"],     // Only include <h1> and <h2> headings in the TOC
                //         cssClasses: {
                //             toc: "page-outline",      // Change the CSS class for the TOC
                //             link: "page-link",        // Change the CSS class for links in the TOC
                //         }
                //     }
                // ],
                rehypeSlug,
                rehypeCodeTitles,
                rehypePrism,
                [rehypeAutolinkHeadings,
                    {
                        behavior: 'prepend',
                        content: s(
                            // add SVG using rehype-autolink-headings in mdx.js - https://github.com/remarkjs/remark/discussions/732#discussioncomment-816042
                            // another reference: https://github.com/janosh/svelte-toc/commit/8493df334a11661eddf03434372f6cd71ea313c1
                            `svg`,
                            { width: 16, height: 16, viewBox: `0 0 16 16` },
                            // symbol #link-icon defined in app.html
                            s(`use`, { 'xlink:href': `#link-icon` })
                        ),
                        properties: {
                            ariaHidden: true,
                            tabIndex: -1,
                            className: ['rehypeautolinkheadings'],
                        },
                        test: [`h1`, `h2`, `h3`, `h4`, `h5`, `h6`] // Customizable headings: https://github.com/rehypejs/rehype-autolink-headings/issues/11

                    }
                ]
            ];

            return options;
        },
        esbuildOptions: (options) => {
            // Image importing, bundling - Reference: https://github.com/Savinvadim1312/notjustdev/blob/main/src/lib/postRepository.ts
            // Reference3: https://github.com/kentcdodds/mdx-bundler/issues/127
            // Reference2: https://github.com/kentcdodds/mdx-bundler#image-bundling
            options.outdir = path.join(imagesDir, slug.trim()),
                options.loader = {
                    ...options.loader,
                    '.jpg': 'file',
                };
            options.publicPath = `${imagesPath}/${slug.trim()}/`;
            options.write = true;

            return options;
        },
    });

    return {
        frontmatter,
        code,
    };
};
