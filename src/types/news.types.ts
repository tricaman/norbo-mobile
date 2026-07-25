import { NewsCategory } from "@/shared/news-contract"; // generated, DO NOT edit
export { NewsCategory };

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  body: string;
  coverImageUrl: string | null;
  publishedAt: string; // ISO
}
