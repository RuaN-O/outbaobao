export default function AdminLoginPage() {
  return (
    <main>
      <h1>后台登录</h1>
      <form action="/api/admin/login" method="post">
        <label htmlFor="password">访问密码</label>
        <input id="password" name="password" type="password" required />
        <button type="submit">进入后台</button>
      </form>
    </main>
  );
}
