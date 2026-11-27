# Fixguild 匠盟前端

使用 Vue 3、TypeScript 和 Vite 构建，配套后端项目 `lty-test`。

## 本地运行

在后端项目目录启动 H2 本地服务（需要 Java 21）：

```powershell
.\mvnw.cmd -DskipTests package
java -jar web/target/fixguild.jar --spring.profiles.active=local
```

在本项目目录执行（需要 Node.js 20.x 且至少 20.19，或 Node.js 22.12 及以上）：

```powershell
npm.cmd ci
npm.cmd run dev
```

访问 `http://localhost:5173`。Vite 默认将接口请求代理到 `http://localhost:8090`。后端地址有变动时，将 `.env.example` 复制到 `.env.local` 并设置 `FIXGUILD_API_TARGET`，然后重启 Vite。

H2 本地种子账号：

| 登录端 | 租户编码 | 用户名 | 密码 |
| --- | --- | --- | --- |
| 平台端 | — | `admin` | `admin123` |
| 租户端 | `T0001` | `tenant_admin` | `admin123` |
| 技师端 | `T0001` | `technician` | `admin123` |

## 页面和操作

- 平台端、租户端和技师端登录，查看当前账号资料、角色、权限和菜单树。业务导航按后端权限开放已实现的页面。
- 平台租户管理支持分页、按编码精确查询、按名称模糊查询、按状态筛选、新增、详情、编辑与启停。页面和操作按钮依据后端返回的权限显示。
- 创建租户后弹窗展示一次性的初始管理员密码。编辑时可更新或清空联系手机号，原号码按后端脱敏结果展示。后端的部分更新接口忽略空到期时间，清空输入框会保留已有日期。
- 租户端用户管理支持查询、新增、编辑、分配角色、启停、重置密码和删除。新建或重置后的一次性密码在弹窗中展示。后端禁止删除当前账号和最后一名启用的租户管理员。
- 租户端角色管理支持查询、新增、编辑、分配菜单和删除。删除前需解除该角色的用户绑定，系统内置角色仅供查看。菜单管理可查看目录、菜单及按钮权限。角色菜单授权按整组保存，当前接口没有返回该角色已分配的菜单。
- 登录状态保存在当前浏览器标签页中。退出登录会撤销服务端的当前令牌。修改密码成功后，需用新密码重新登录。
- 页头可检查后端服务状态，侧栏提供 Swagger 接口文档入口。

## 构建

```powershell
npm.cmd run build
npm.cmd run preview
```

构建输出位于 `dist/`。部署时同时配置 SPA 路由回退到 `index.html` 和同域反向代理。将 `/account/api/`、`/platform/api/`、`/tenant/api/`、`/api/health` 转发给后端。接口文档入口还需要转发 `/doc.html`、`/swagger-ui/` 和 `/v3/api-docs`，这些路径需在 SPA 回退之前匹配。

## 登录页配图

`public/maintenance.jpg` 使用内置 ImageGen 生成，随后压缩为 JPEG。生成提示词如下。

> Photorealistic editorial photograph for the left panel of a Chinese facilities maintenance SaaS sign-in screen. Vertical 2:3 image. A single industrial maintenance technician, seen from behind and in slight three-quarter profile, wearing dark forest green workwear and a natural ivory hard hat, examining pumps and polished steel pipes in a modern mechanical plant room. Put person and any bright highlights in the lower right / center-right, from about 48% image height. The upper left half of the picture is quiet dark green shadows and softly out of focus pipes with very little visual contrast, space for white overlay text added later. Sophisticated muted forest green color grade, soft natural side lighting, believable work environment and equipment, subtle film grain. Edge-to-edge photography. No text, no logos, no badges, no frames, no graphic overlays.
