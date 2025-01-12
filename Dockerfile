# 使用官方Nginx镜像作为基础镜像
FROM nginx:1.23-alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制Nginx配置文件
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 复制网站文件
COPY . .

# 暴露80端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/healthz || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
