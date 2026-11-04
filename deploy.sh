#!/usr/bin/env bash
#
# baseTemplate 本机部署脚本
#
#   应用：npm 构建产物 dist/ 由 scripts/serve.mjs 托管在 127.0.0.1:9090
#   nginx：反向代理 <本机>:8080 → 127.0.0.1:9090
#          本机装有 nginx 时直接配置本机 nginx；
#          否则自动用 docker 跑一个专用 nginx 容器（host 网络）。
#
# 用法：
#   deploy/deploy.sh up             # 安装依赖 → 构建 → 启动 → 配置 nginx（默认）
#   deploy/deploy.sh down           # 停止应用（保留 nginx）
#   deploy/deploy.sh restart        # 重启应用
#   deploy/deploy.sh status         # 应用 / 健康检查 / nginx 状态
#   deploy/deploy.sh logs           # 跟踪应用日志
#   deploy/deploy.sh nginx          # 只重新渲染并加载 nginx 配置
#   deploy/deploy.sh nginx-stop     # 移除本项目的 nginx（容器或本机站点）
#
# 常用环境变量：
#   PORT=9090                       应用监听端口（仅 127.0.0.1）
#   NGINX_PORT=8080                 nginx 对外监听端口；改 80 需注意默认站点占用
#   SERVER_NAME=_                   nginx server_name，绑定域名时填写
#   NGINX_MODE=auto                 auto | host | docker | none
#   NGINX_CONTAINER=baseTemplate-nginx   docker 模式下的容器名
#   NGINX_IMAGE=nginx:alpine        docker 模式使用的镜像
#   NODE_BIN=$(command -v node)     指定 node 可执行文件
#
# 常用参数：
#   --no-nginx        跳过 nginx 配置（只起应用）
#   --skip-install    跳过 npm install/ci
#   --skip-build      跳过 npm run build，直接托管已有 dist/
#   --port=PORT       等价于 PORT=...
#   --nginx-port=PORT 等价于 NGINX_PORT=...
#   --nginx-mode=MODE 等价于 NGINX_MODE=...
#
# 说明：应用进程使用 nohup + pid 文件管理，不需要 root；
# 本机 nginx 模式写 /etc/nginx 需要 sudo，docker 模式需要当前用户能访问 docker。

set -euo pipefail

APP_NAME="baseTemplate"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUN_DIR="$APP_DIR/.run"
PID_FILE="$RUN_DIR/app.pid"
APP_LOG="$RUN_DIR/app.log"
NGINX_RENDERED="$RUN_DIR/$APP_NAME.nginx.conf"

PORT="${PORT:-9090}"
APP_HOST="${APP_HOST:-127.0.0.1}"
NGINX_PORT="${NGINX_PORT:-8080}"
SERVER_NAME="${SERVER_NAME:-_}"
NGINX_MODE="${NGINX_MODE:-auto}"
NGINX_CONTAINER="${NGINX_CONTAINER:-$APP_NAME-nginx}"
NGINX_IMAGE="${NGINX_IMAGE:-nginx:alpine}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"

SKIP_INSTALL=0
SKIP_BUILD=0
WITH_NGINX=1
COMMAND="up"
DOCKER=()

log()  { printf '\033[32m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[deploy]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[31m[deploy] 错误：\033[0m%s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
baseTemplate 本机部署脚本

  应用：dist/ 由 scripts/serve.mjs 托管在 127.0.0.1:9090
  nginx：反向代理 <本机>:8080 → 127.0.0.1:9090
         本机有 nginx 用本机 nginx，否则自动起专用 docker 容器

用法：
  deploy/deploy.sh up            # 安装依赖 → 构建 → 启动 → 配置 nginx
  deploy/deploy.sh down          # 停止应用（保留 nginx）
  deploy/deploy.sh restart       # 重启应用
  deploy/deploy.sh status        # 查看应用/nginx 状态
  deploy/deploy.sh logs          # 跟踪应用日志
  deploy/deploy.sh nginx         # 只重新渲染并加载 nginx 配置
  deploy/deploy.sh nginx-stop    # 移除本项目的 nginx（容器或本机站点）

环境变量：
  PORT=9090                       应用端口
  NGINX_PORT=8080                 对外端口
  SERVER_NAME=_                   server_name
  NGINX_MODE=auto                 auto | host | docker | none
  NGINX_CONTAINER=baseTemplate-nginx
  NGINX_IMAGE=nginx:alpine
  NODE_BIN=...                    node 可执行文件

参数：
  --no-nginx  --skip-install  --skip-build
  --port=N  --nginx-port=N  --nginx-mode=MODE  --server-name=NAME

示例：
  NGINX_PORT=80 deploy/deploy.sh up
  NGINX_MODE=docker deploy/deploy.sh nginx
EOF
  exit 0
}

# ── 参数解析 ────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    up|down|restart|status|logs|nginx|nginx-stop) COMMAND="$arg" ;;
    --no-nginx)        WITH_NGINX=0 ;;
    --skip-install)    SKIP_INSTALL=1 ;;
    --skip-build)      SKIP_BUILD=1 ;;
    --port=*)          PORT="${arg#*=}" ;;
    --nginx-port=*)    NGINX_PORT="${arg#*=}" ;;
    --nginx-mode=*)    NGINX_MODE="${arg#*=}" ;;
    --server-name=*)   SERVER_NAME="${arg#*=}" ;;
    -h|--help)         usage ;;
    *) die "未知参数：$arg（--help 查看用法）" ;;
  esac
done

health_url="http://$APP_HOST:$PORT/healthz"
app_healthy() {
  curl -fsS --max-time 2 "$health_url" 2>/dev/null | grep -q '"status":"ok"'
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$port" 2>/dev/null | grep -q LISTEN
  else
    curl -fsS --max-time 1 "http://127.0.0.1:$port/" >/dev/null 2>&1
  fi
}

read_pid() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && echo "$pid"
}

# ── 依赖与构建 ──────────────────────────────────────────────
preflight() {
  [[ -n "$NODE_BIN" ]] || die "未找到 node，请先安装 Node.js 22/24 LTS"

  local major
  major="$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')"
  # 与 package.json engines 保持一致：Node 22 / 24 均已验证
  if (( major < 22 || major >= 26 )); then
    die "当前 Node.js 版本为 $( "$NODE_BIN" -v )，本项目要求 >=22 <26（见 package.json engines）"
  fi
  command -v npm >/dev/null 2>&1 || die "未找到 npm"
  command -v curl >/dev/null 2>&1 || die "未找到 curl（健康检查与状态判断依赖它）"
}

install_deps() {
  if (( SKIP_INSTALL )); then log "跳过依赖安装"; return; fi
  if [[ -f "$APP_DIR/package-lock.json" ]]; then
    log "安装依赖（npm ci）"
    ( cd "$APP_DIR" && npm ci --no-audit --no-fund )
  else
    log "安装依赖（npm install）"
    ( cd "$APP_DIR" && npm install --no-audit --no-fund )
  fi
}

build_app() {
  if (( SKIP_BUILD )); then log "跳过构建"; return; fi
  log "构建 dist/…"
  ( cd "$APP_DIR" && npm run build )
  [[ -f "$APP_DIR/dist/index.html" ]] || die "构建完成但未找到 dist/index.html"
}

# ── 应用进程 ────────────────────────────────────────────────
start_app() {
  if app_healthy; then
    log "应用已在 $APP_HOST:$PORT 运行，跳过启动"
    return
  fi
  if port_in_use "$PORT"; then
    die "端口 $PORT 已被其他进程占用；先释放端口，或用 PORT=其他端口 重试"
  fi

  mkdir -p "$RUN_DIR"
  log "启动应用：$APP_HOST:$PORT（日志 $APP_LOG）"
  (
    cd "$APP_DIR"
    PORT="$PORT" HOST="$APP_HOST" nohup "$NODE_BIN" scripts/serve.mjs >> "$APP_LOG" 2>&1 &
    echo $! > "$PID_FILE"
  )

  for _ in $(seq 1 30); do
    if app_healthy; then
      log "应用启动成功（pid $(cat "$PID_FILE")）"
      return
    fi
    sleep 0.5
  done

  warn "应用未在 15s 内通过健康检查，最后 20 行日志："
  tail -n 20 "$APP_LOG" >&2 || true
  die "启动失败"
}

stop_app() {
  local pid
  if pid="$(read_pid)"; then
    log "停止应用（pid $pid）"
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.25
    done
    kill -9 "$pid" 2>/dev/null || true
    rm -f "$PID_FILE"
    log "应用已停止"
  elif app_healthy; then
    warn "未找到 pid 文件，但 $PORT 上仍是本应用；请手工确认进程后停止"
  else
    log "应用未运行"
  fi
}

# ── nginx 通用 ──────────────────────────────────────────────
render_nginx_conf() {
  mkdir -p "$RUN_DIR"
  sed \
    -e "s|__NGINX_PORT__|$NGINX_PORT|g" \
    -e "s|__SERVER_NAME__|$SERVER_NAME|g" \
    -e "s|__APP_HOST__|$APP_HOST|g" \
    -e "s|__APP_PORT__|$PORT|g" \
    "$APP_DIR/deploy/nginx/$APP_NAME.conf" > "$NGINX_RENDERED"
  log "已渲染 nginx 配置：$NGINX_RENDERED"
}

nginx_config_layout() {
  if [[ -d /etc/nginx/sites-available && -d /etc/nginx/sites-enabled ]]; then
    echo "debian"
  elif [[ -d /etc/nginx/conf.d ]]; then
    echo "confd"
  else
    echo "none"
  fi
}

host_nginx_reload() {
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx 2>/dev/null; then
    sudo systemctl reload nginx
  else
    sudo nginx -s reload
  fi
}

configure_nginx_host() {
  render_nginx_conf
  local layout target
  layout="$(nginx_config_layout)"
  case "$layout" in
    debian)
      target="/etc/nginx/sites-available/$APP_NAME.conf"
      sudo install -m 644 "$NGINX_RENDERED" "$target"
      sudo ln -sfn "$target" "/etc/nginx/sites-enabled/$APP_NAME.conf"
      ;;
    confd)
      target="/etc/nginx/conf.d/$APP_NAME.conf"
      sudo install -m 644 "$NGINX_RENDERED" "$target"
      ;;
    *)
      die "未找到 /etc/nginx 配置目录，请确认 nginx 安装方式后手工安装 $NGINX_RENDERED"
      ;;
  esac
  log "已写入本机 nginx 配置：$target"

  sudo nginx -t || die "nginx 配置校验失败，未 reload（原配置未生效）"
  host_nginx_reload
  log "本机 nginx 已 reload：http://<本机>:$NGINX_PORT → http://$APP_HOST:$PORT"
}

# ── nginx（docker 模式）─────────────────────────────────────
detect_docker() {
  command -v docker >/dev/null 2>&1 || return 1
  if docker info >/dev/null 2>&1; then DOCKER=(docker); return 0; fi
  if sudo -n docker info >/dev/null 2>&1; then DOCKER=(sudo docker); return 0; fi
  if sudo docker info >/dev/null 2>&1; then DOCKER=(sudo docker); return 0; fi
  return 1
}

docker_container_exists() {
  local name
  name="$("${DOCKER[@]}" ps -a --filter "name=^/${NGINX_CONTAINER}$" --format '{{.Names}}' 2>/dev/null || true)"
  [[ "$name" == "$NGINX_CONTAINER" ]]
}

docker_nginx_up() {
  detect_docker || { warn "未检测到可用的 docker，跳过 nginx（应用仍在 $APP_HOST:$PORT）"; return 1; }

  render_nginx_conf

  if docker_container_exists; then
    log "重建 nginx 容器：$NGINX_CONTAINER"
    "${DOCKER[@]}" rm -f "$NGINX_CONTAINER" >/dev/null
  else
    log "创建 nginx 容器：$NGINX_CONTAINER（镜像 $NGINX_IMAGE，host 网络）"
  fi

  if ! "${DOCKER[@]}" run -d \
      --name "$NGINX_CONTAINER" \
      --restart unless-stopped \
      --network host \
      -v "$NGINX_RENDERED:/etc/nginx/conf.d/default.conf:ro,Z" \
      "$NGINX_IMAGE" >/dev/null; then
    warn "docker run 失败，容器日志："
    "${DOCKER[@]}" logs --tail 20 "$NGINX_CONTAINER" 2>&1 | tail -20 || true
    die "无法启动 nginx 容器（$NGINX_PORT 可能已被占用，换 NGINX_PORT 或先停掉旧容器）"
  fi

  for _ in $(seq 1 30); do
    "${DOCKER[@]}" exec "$NGINX_CONTAINER" nginx -t >/dev/null 2>&1 && break
    sleep 0.5
  done
  if ! "${DOCKER[@]}" exec "$NGINX_CONTAINER" nginx -t >/dev/null 2>&1; then
    "${DOCKER[@]}" logs --tail 20 "$NGINX_CONTAINER" 2>&1 | tail -20 || true
    die "容器内 nginx 配置校验失败"
  fi

  for _ in $(seq 1 30); do
    if curl -fsS --max-time 2 "http://127.0.0.1:$NGINX_PORT/healthz" >/dev/null 2>&1; then
      log "docker nginx 就绪：http://<本机>:$NGINX_PORT → http://$APP_HOST:$PORT"
      return 0
    fi
    sleep 0.5
  done

  warn "nginx 容器已启动，但 $NGINX_PORT 没有健康响应；容器日志："
  "${DOCKER[@]}" logs --tail 20 "$NGINX_CONTAINER" 2>&1 | tail -20 || true
  warn "排查：端口是否被占用（ss -ltnp | grep :$NGINX_PORT），或换 NGINX_PORT 重试"
  return 1
}

docker_nginx_stop() {
  detect_docker || return 0
  if docker_container_exists; then
    log "停止并移除 nginx 容器：$NGINX_CONTAINER"
    "${DOCKER[@]}" rm -f "$NGINX_CONTAINER" >/dev/null
  fi
}

# ── nginx 入口 ──────────────────────────────────────────────
configure_nginx() {
  if (( ! WITH_NGINX )); then log "按参数跳过 nginx 配置"; return 0; fi

  case "$NGINX_MODE" in
    none)
      log "NGINX_MODE=none，跳过 nginx"
      return 0
      ;;
    host)
      command -v nginx >/dev/null 2>&1 || die "NGINX_MODE=host 但未安装 nginx"
      configure_nginx_host
      return 0
      ;;
    docker)
      docker_nginx_up
      return 0
      ;;
    auto) ;;
    *) die "NGINX_MODE 只能是 auto | host | docker | none" ;;
  esac

  if command -v nginx >/dev/null 2>&1; then
    log "检测到本机 nginx，使用 host 模式"
    configure_nginx_host
  elif detect_docker; then
    log "未检测到本机 nginx，使用 docker 模式"
    docker_nginx_up
  else
    warn "既没有本机 nginx，也没有可用的 docker。应用已在 $APP_HOST:$PORT 运行，可直连。"
    warn "  安装 nginx：sudo apt-get install -y nginx   或   sudo dnf install -y nginx"
    warn "  或安装 docker 后执行：deploy/deploy.sh nginx"
  fi
}

remove_nginx() {
  if command -v nginx >/dev/null 2>&1; then
    local layout target
    layout="$(nginx_config_layout)"
    if [[ "$layout" == "debian" ]]; then
      target="/etc/nginx/sites-available/$APP_NAME.conf"
      if [[ -e "/etc/nginx/sites-enabled/$APP_NAME.conf" ]]; then
        sudo rm -f "/etc/nginx/sites-enabled/$APP_NAME.conf"
        sudo rm -f "$target"
        sudo nginx -t >/dev/null 2>&1 && host_nginx_reload || true
        log "已移除本机 nginx 站点配置"
      fi
    elif [[ "$layout" == "confd" && -e "/etc/nginx/conf.d/$APP_NAME.conf" ]]; then
      sudo rm -f "/etc/nginx/conf.d/$APP_NAME.conf"
      sudo nginx -t >/dev/null 2>&1 && host_nginx_reload || true
      log "已移除本机 nginx 配置"
    fi
  fi
  docker_nginx_stop
}

# ── 子命令 ─────────────────────────────────────────────────
cmd_up() {
  preflight
  install_deps
  build_app
  start_app
  configure_nginx || warn "nginx 未配置成功，应用仍可通过 $health_url 访问"
  log "完成：应用 $APP_HOST:$PORT，nginx http://<本机>:$NGINX_PORT"
}

cmd_status() {
  echo "应用目录：$APP_DIR"
  if app_healthy; then
    echo "应用状态：运行中（$health_url）pid=$(read_pid || echo 未知)"
  else
    echo "应用状态：未运行或健康检查失败（$health_url）"
  fi

  if detect_docker && docker_container_exists; then
    local state
    state="$("${DOCKER[@]}" inspect -f '{{.State.Status}}' "$NGINX_CONTAINER" 2>/dev/null || echo unknown)"
    echo "nginx 模式：docker（容器 $NGINX_CONTAINER，$state）"
    echo "nginx 入口：http://<本机>:$NGINX_PORT"
  elif command -v nginx >/dev/null 2>&1; then
    local target
    if [[ "$(nginx_config_layout)" == "debian" ]]; then
      target="/etc/nginx/sites-enabled/$APP_NAME.conf"
    else
      target="/etc/nginx/conf.d/$APP_NAME.conf"
    fi
    [[ -e "$target" ]] && echo "nginx 模式：host（$target）" || echo "nginx 模式：host（配置未安装）"
    echo "nginx 入口：http://<本机>:$NGINX_PORT"
  else
    echo "nginx：未配置（既无本机 nginx，也无 docker 容器）"
    echo "直连地址：$health_url"
  fi
}

cmd_logs() {
  [[ -f "$APP_LOG" ]] || die "暂无日志：$APP_LOG"
  exec tail -n 50 -f "$APP_LOG"
}

case "$COMMAND" in
  up)         cmd_up ;;
  down)       stop_app ;;
  restart)    stop_app; cmd_up ;;
  status)     cmd_status ;;
  logs)       cmd_logs ;;
  nginx)      configure_nginx ;;
  nginx-stop) remove_nginx ;;
  *)          die "未知子命令：$COMMAND" ;;
esac
