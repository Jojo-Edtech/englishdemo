# 阿里云轻量服务器多网站隔离规则（IP 路径隔离版）

当前服务器 IP：`47.106.124.32`

## 当前入口

- 项目目录页：`http://47.106.124.32/`
- `/login` 和未配置路径：统一回到项目目录页，不再显示任何单个项目的登录页
- 英语备课组学情分析平台：`http://47.106.124.32/english-analytics-demo/`
- AI Thomas：`http://47.106.124.32/thomas/`
- ThemeScope 看盘台：只保留明确路径入口 `http://47.106.124.32/themescope/login`，不挂在 IP 根入口；正式开放建议绑定独立域名。

## 关键规则

1. 不要再让任何单个项目占用 IP 根路径 `/`。
2. IP 根路径只放“项目入口页”，避免新项目误入旧项目登录页。
3. 静态网站优先用独立路径，例如 `/english-analytics-demo/`。
4. 带登录的应用不要使用通用 `/login`、`/api`、`/`，必须放到自己的项目前缀下，例如 `/themescope/login`、`/themescope/api/`。
5. 有登录、API、Cookie 的应用最好使用独立域名或子域名；短期没有域名时，才用路径隔离兜底。
6. 国内阿里云服务器使用正式域名时，域名通常需要备案和接入；`sslip.io`、`nip.io` 这类临时域名可能被阿里云拦截为未备案域名。
7. 不要启用临时域名或独立端口的 Nginx 站点配置，除非 DNS、备案/接入和阿里云防火墙都确认可用；这类配置先保留为 `.template`。

## 新增静态网站模板

把构建产物放到：

```text
/var/www/<project-name>/
```

在默认 server block 中加入：

```nginx
location = /<project-name> {
    return 301 /<project-name>/;
}

location ^~ /<project-name>/ {
    root /var/www;
    try_files $uri $uri/ /<project-name>/index.html;
    add_header Cache-Control "public, max-age=300";
}
```

然后执行：

```bash
nginx -t && systemctl reload nginx
```

## 新增 Node 应用路径模板

Node 应用先在本机监听独立端口，例如 `127.0.0.1:8787`。Nginx 只暴露明确路径：

```nginx
location = /<project-name> {
    return 301 /<project-name>/;
}

location ^~ /<project-name>/ {
    proxy_pass http://127.0.0.1:<port>/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

上线前要检查应用内部链接，不能自动跳到根路径 `/login`、`/api` 或 `/`。如果应用框架支持 `basePath`，优先在应用里设置项目前缀。

## 新增独立域名模板

域名 DNS A 记录指向 `47.106.124.32`，并确认备案/接入可用后，新建：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name demo.example.com;

    root /var/www/<project-name>;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

有登录系统的 Node 应用应使用独立域名：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:<port>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 当前服务器变更记录

- 已把 IP 根路径 `/` 改成项目目录页。
- 已把 `/english-analytics-demo/` 明确映射到静态学情平台。
- 已把 `/thomas/` 明确代理到 `127.0.0.1:8787`。
- 已把 IP 根路径和 `/login` 都改为项目目录页，避免 ThemeScope 登录页捕获其它 demo。
- 已停用临时域名/独立端口的活跃 Nginx 配置，改为 `project-vhosts.template` 和 `zz-project-vhosts.template` 作为以后参考。
- ThemeScope 这类带登录、API、Cookie 的应用不适合长期只靠路径隔离，建议后续使用独立域名。
