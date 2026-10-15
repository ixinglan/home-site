#!/usr/bin/env bash
#
# publish.sh —— 打包并同步到服务器 nginx 目录
# 用法：./publish.sh
#
set -e

# 切到脚本所在目录
cd "$(dirname "$0")"

# 1. 打包，产物输出到 dist/
npm run build

# 2. 同步到服务器（--delete：服务器上有、本地没有的文件会被删除）
rsync -av --delete dist/ root@qiang-tc2028:/usr/local/nginx/site-homepage/

echo "发布完成"
