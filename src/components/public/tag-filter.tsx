import Link from "next/link";

type TagFilterProps = {
  tags: string[];
  activeTag: string;
};

export function TagFilter({ tags, activeTag }: TagFilterProps) {
  return (
    <div className="tag-list">
      <Link className={`tag-chip ${activeTag ? "" : "active"}`} href="/">
        全部
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          className={`tag-chip ${activeTag === tag ? "active" : ""}`}
          href={`/?tag=${encodeURIComponent(tag)}`}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
