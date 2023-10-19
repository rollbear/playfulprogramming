import Fuse from "fuse.js";
import * as fs from "fs";
import * as path from "path";
import * as api from "utils/api";
import { PostInfo, CollectionInfo, UnicornInfo } from "types/index";

const posts = api.getPostsByLang("en");
const collections = api.getCollectionsByLang("en");

const createPostIndex = () => {
	return Fuse.createIndex<PostInfo>(
		[
			{
				name: "title",
				weight: 2,
			},
			{
				name: "authorName",
				getFn: (post) => {
					return post.authors
						.map((id) => api.getUnicornById(id, post.locale))
						.join(", ");
				},
				weight: 1.8,
			},
			{
				name: "slug",
				weight: 1.6,
			},
			{
				name: "authorHandles",
				getFn: (post) => {
					return post.authors
						.map((id) => api.getUnicornById(id, post.locale))
						.flatMap((author) => Object.values(author.socials))
						.join(", ");
				},
				weight: 1.2,
			},
			{ name: "tags", weight: 1.5, getFn: (post) => post.tags.join(", ") },
			{ name: "description", weight: 1.2 },
			{ name: "excerpt", weight: 1.2 },
		],
		posts,
	).toJSON();
};

const createCollectionIndex = () => {
	return Fuse.createIndex<CollectionInfo>(
		[
			{
				name: "title",
				weight: 2,
			},
			{
				name: "slug",
				weight: 1.6,
			},
			{
				name: "authorName",
				getFn: (post) => {
					return post.authors
						.map((id) => api.getUnicornById(id, post.locale).name)
						.join(", ");
				},
				weight: 1.8,
			},
			{
				name: "authorHandles",
				getFn: (post) => {
					return post.authors
						.map((id) => api.getUnicornById(id, post.locale))
						.flatMap((author) => Object.values(author.socials))
						.join(", ");
				},
				weight: 1.2,
			},
			{
				name: "description",
				weight: 1.2,
			},
		],
		collections,
	).toJSON();
};

const postIndex = createPostIndex();
const collectionIndex = createCollectionIndex();

const unicorns: Record<string, UnicornInfo> = api
	.getUnicornsByLang("en")
	.reduce((obj, unicorn) => {
		obj[unicorn.id] = unicorn;
		return obj;
	}, {});

const json = JSON.stringify({
	postIndex,
	posts,
	collectionIndex,
	collections,
	unicorns,
});
fs.writeFileSync(path.resolve(process.cwd(), "./api/searchIndex.json"), json);
