#!/usr/bin/env bash
#
# 把当前目录安装到本机目标路径，然后执行部署。
#
#   ./install.sh                          # 安装到 /home/paul/project/baseTemplate 并部署
#   TARGET_DIR=/opt/baseTemplate ./install.sh
#   ./install.sh --no-nginx               # 其余参数透传给 deploy.sh
#
# 说明：使用 rsync 增量同步，保留 node_modules/dist（脚本按需重装重建），
# 不会删除目标目录中的 .run 运行时文件。

set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${TARGET_DIR:-/home/paul/project/baseTemplate}"

log() { printf '\033[32m[install]\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[install]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[31m[install] 错误：\033[0m%s\n' "$*" >&2; exit 1; }

command -v rsync >/dev/null 2>&1 || die "未找到 rsync（Debian/Ubuntu: sudo apt-get install -y rsync）"

if [[ "$SRC_DIR" == "$TARGET_DIR" ]]; then
  log "当前目录已是 $TARGET_DIR，跳过复制"
else
  log "安装到 $TARGET_DIR"
  mkdir -p "$TARGET_DIR" || die "无法创建 $TARGET_DIR（检查目录权限，或 sudo mkdir -p 后 chown 给当前用户）"
  rsync -a \
    --exclude node_modules \
    --exclude dist \
    --exclude .run \
    --exclude .git \
    "$SRC_DIR"/ "$TARGET_DIR"/
fi

# 执行位只是方便直接敲 deploy/deploy.sh；非属主无法 chmod，失败不影响部署
chmod +x "$TARGET_DIR/deploy/deploy.sh" 2>/dev/null || true
if [[ ! -x "$TARGET_DIR/deploy/deploy.sh" ]]; then
  warn "deploy/deploy.sh 没有执行位（文件属主不是当前用户），统一用 bash 调用即可"
fi

log "开始部署"
exec bash "$TARGET_DIR/deploy/deploy.sh" up "$@"
