#!/usr/bin/env bash
#
# local.sh —— 本地开发启动
# 用法：./local.sh
#
set -e

# 切到脚本所在目录，这样从任何地方执行都不会找错文件
cd "$(dirname "$0")"

# 安装依赖（已装过时很快，不会重复下载）
npm install

# 启动开发服务器 → http://localhost:5173
# 改 public/data/*.json 会自动刷新；Ctrl+C 停止
npm run dev
