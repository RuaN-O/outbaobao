type ArticleFormProps = {
  submitLabel?: string;
};

export function ArticleForm({ submitLabel = "保存草稿" }: ArticleFormProps) {
  return (
    <form className="article-detail" action="/api/admin/articles" method="post">
      <div className="toolbar">
        <label htmlFor="title">标题</label>
        <input id="title" name="title" />
      </div>

      <div className="toolbar">
        <label htmlFor="summary">摘要</label>
        <textarea id="summary" name="summary" rows={4} />
      </div>

      <div className="toolbar">
        <label htmlFor="tags">标签</label>
        <input id="tags" name="tags" placeholder="用逗号分隔" />
      </div>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
