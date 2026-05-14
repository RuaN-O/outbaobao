type SearchFormProps = {
  defaultValue: string;
};

export function SearchForm({ defaultValue }: SearchFormProps) {
  return (
    <form className="search-form" action="/" method="get">
      <input name="q" defaultValue={defaultValue} placeholder="搜索文章标题或摘要" />
    </form>
  );
}
